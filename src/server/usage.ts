// Anonymous usage counts: how many times the Study Desk, a subject's lab or its exam practice was opened
// on each day. A count is a number against a day and a subject. Nothing here says who opened anything:
// no account, no device, no address is kept, so these are not learner records (CON-2).
//
// The website counts under the source "web". A school server counts under "local" in its own database and
// sends its daily totals with each check-in; the control service keeps them under the campus id.
import type { Db } from './db'

export const SUBJECTS = [
  'maths',
  'physics',
  'chemistry',
  'biology',
  'geography',
  'agric',
] as const
export type UsageSubject = (typeof SUBJECTS)[number]
// desk = Study Desk opened; lab = a subject's lab opened; exam = a lab opened straight into exam practice.
export const KINDS = ['desk', 'lab', 'exam'] as const
export type UsageKind = (typeof KINDS)[number]
// The Study Desk belongs to no subject.
export const NO_SUBJECT = 'all'
export const REPORT_DAYS = 35

export type UsageRow = {
  day: string
  subject: string
  kind: UsageKind
  count: number
}

export const USAGE_TABLE = `CREATE TABLE usage_daily (
  day text NOT NULL CHECK (day ~ '^\\d{4}-\\d{2}-\\d{2}$'),
  source text NOT NULL,
  subject text NOT NULL,
  kind text NOT NULL,
  count integer NOT NULL CHECK (count >= 0),
  PRIMARY KEY (day, source, subject, kind)
)`

const dayOf = (d: Date) => d.toISOString().slice(0, 10)
const daysBefore = (now: Date, n: number) =>
  dayOf(new Date(now.getTime() - n * 86_400_000))

// True for a (subject, kind) pair the app can really produce.
export function validEvent(subject: unknown, kind: unknown) {
  if (!(KINDS as readonly unknown[]).includes(kind)) return false
  return kind === 'desk'
    ? subject === NO_SUBJECT
    : (SUBJECTS as readonly unknown[]).includes(subject)
}

// Adds one to today's count.
export async function countOne(
  db: Db,
  source: string,
  subject: string,
  kind: UsageKind,
  now: Date,
) {
  if (!validEvent(subject, kind)) return false
  await db.query(
    `INSERT INTO usage_daily (day, source, subject, kind, count) VALUES ($1, $2, $3, $4, 1)
     ON CONFLICT (day, source, subject, kind) DO UPDATE SET count = usage_daily.count + 1`,
    [dayOf(now), source, subject, kind],
  )
  return true
}

const asRow = (r: UsageRow): UsageRow => ({
  day: r.day,
  subject: r.subject,
  kind: r.kind,
  count: Number(r.count),
})

// One source's daily totals for the last `days` days, oldest first.
export async function usageOf(
  db: Db,
  source: string,
  now: Date,
  days = REPORT_DAYS,
): Promise<UsageRow[]> {
  return (
    await db.query<UsageRow>(
      `SELECT day, subject, kind, count FROM usage_daily WHERE source = $1 AND day >= $2 ORDER BY day`,
      [source, daysBefore(now, days - 1)],
    )
  ).map(asRow)
}

// Keeps the totals a school server sent. A server sends each day's running total, so the same day arrives
// many times: the larger number wins, and a resent or replayed check-in changes nothing.
export async function keepCampusUsage(
  db: Db,
  campusId: string,
  rows: unknown,
  now: Date,
) {
  if (!Array.isArray(rows)) return 0
  const oldest = daysBefore(now, REPORT_DAYS)
  // A school's clock may be a day ahead of ours; anything later is not believed.
  const newest = daysBefore(now, -1)
  let kept = 0
  for (const r of rows.slice(0, REPORT_DAYS * 13) as Partial<UsageRow>[]) {
    if (
      typeof r?.day !== 'string' ||
      !/^\d{4}-\d{2}-\d{2}$/.test(r.day) ||
      r.day < oldest ||
      r.day > newest ||
      !validEvent(r.subject, r.kind) ||
      !Number.isInteger(r.count) ||
      (r.count as number) < 0 ||
      (r.count as number) > 1_000_000
    )
      continue
    await db.query(
      `INSERT INTO usage_daily (day, source, subject, kind, count) VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (day, source, subject, kind) DO UPDATE SET count = GREATEST(usage_daily.count, EXCLUDED.count)`,
      [r.day, campusId, r.subject, r.kind, r.count],
    )
    kept++
  }
  return kept
}

export type UsageReport = {
  days: number
  // Every day in the range, oldest first, including days with nothing counted.
  byDay: { day: string; desk: number; lab: number; exam: number }[]
  bySubject: { subject: UsageSubject; lab: number; exam: number }[]
  // "web" is the website; every other source is a campus id.
  bySource: { source: string; desk: number; lab: number; exam: number }[]
  total: { desk: number; lab: number; exam: number }
  // The same total for the equally long period just before, to show whether use is rising or falling.
  before: { desk: number; lab: number; exam: number }
}

const zero = () => ({ desk: 0, lab: 0, exam: 0 })

// Everything the console's Usage screen shows, for the last `days` days ending today.
export async function usageReport(
  db: Db,
  now: Date,
  days: number,
  source?: string,
): Promise<UsageReport> {
  const from = daysBefore(now, days - 1)
  const earlier = daysBefore(now, days * 2 - 1)
  const rows = await db.query<UsageRow & { source: string }>(
    `SELECT day, source, subject, kind, count FROM usage_daily
     WHERE day >= $1 AND day <= $2 ${source ? 'AND source = $3' : ''}`,
    source ? [earlier, dayOf(now), source] : [earlier, dayOf(now)],
  )
  const byDay = new Map<string, UsageReport['byDay'][number]>()
  for (let i = days - 1; i >= 0; i--) {
    const day = daysBefore(now, i)
    byDay.set(day, { day, ...zero() })
  }
  const bySubject = new Map<UsageSubject, UsageReport['bySubject'][number]>(
    SUBJECTS.map((subject) => [subject, { subject, lab: 0, exam: 0 }]),
  )
  const bySource = new Map<
    string,
    { source: string } & ReturnType<typeof zero>
  >()
  const total = zero()
  const before = zero()
  for (const r of rows) {
    const n = Number(r.count)
    if (r.day < from) {
      before[r.kind] += n
      continue
    }
    total[r.kind] += n
    const d = byDay.get(r.day)
    if (d) d[r.kind] += n
    const s = bySubject.get(r.subject as UsageSubject)
    if (s && r.kind !== 'desk') s[r.kind] += n
    const src = bySource.get(r.source) ?? { source: r.source, ...zero() }
    src[r.kind] += n
    bySource.set(r.source, src)
  }
  return {
    days,
    byDay: [...byDay.values()],
    bySubject: [...bySubject.values()],
    bySource: [...bySource.values()].sort(
      (a, b) => b.lab + b.exam + b.desk - (a.lab + a.exam + a.desk),
    ),
    total,
    before,
  }
}
