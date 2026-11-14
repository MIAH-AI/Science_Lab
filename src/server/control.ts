// The control service: schools, campuses, licences, and the two calls a school server makes (enrol once,
// then a heartbeat whenever it has a connection). See doc/roadmap/licensing-and-deployment.md.
import { audit, type Admin, type Fail } from './admins'
import { config } from './config'
import { iso, type Db } from './db'
import {
  DEFAULT_GRACE_DAYS,
  DEFAULT_TERM_MONTHS,
  signLicence,
  signStatus,
  standing,
  termEnd,
  type Licence,
  type Standing,
} from './licence'
import { newToken, tokenHash } from './secrets'
import { keepCampusUsage } from './usage'

export const ENROL_HOURS = 24

// How many people of each kind a school server last reported. Counts only; names stay at the school.
export type People = {
  students: number
  teachers: number
  leaders: number
  pending: number
  invited: number
  disabled: number
}
const PEOPLE_KEYS = [
  'students',
  'teachers',
  'leaders',
  'pending',
  'invited',
  'disabled',
] as const
function cleanPeople(value: unknown): People | null {
  if (!value || typeof value !== 'object') return null
  const v = value as Record<string, unknown>
  if (!PEOPLE_KEYS.every((k) => whole(v[k], 0, 1_000_000))) return null
  return Object.fromEntries(PEOPLE_KEYS.map((k) => [k, v[k]])) as People
}
function readPeople(text: string | null): People | null {
  try {
    return text ? cleanPeople(JSON.parse(text)) : null
  } catch {
    return null
  }
}
const fail = (error: string): Fail => ({ ok: false, error })
const isDate = (s: string) =>
  /^\d{4}-\d{2}-\d{2}$/.test(s) && !Number.isNaN(Date.parse(s + 'T00:00:00Z'))
const whole = (n: unknown, min: number, max: number) =>
  Number.isInteger(n) && (n as number) >= min && (n as number) <= max
const dup = (e: unknown) => /duplicate key|unique/i.test(String(e))

type SchoolRow = {
  id: string
  name: string
  term_months: number
  grace_days: number
}
type CampusRow = {
  id: string
  school_id: string
  name: string
  suspended_at: unknown
  suspended_reason: string | null
  machine: string | null
  secret_hash: string | null
  last_heartbeat: unknown
  version: string | null
  seats_used: number | null
  people: string | null
}
type LicenceRow = {
  id: string
  campus_id: string
  kind: 'trial' | 'active'
  starts: string
  ends: string
  grace_days: number
  seats: number
  token: string
  note: string | null
  issued_at: unknown
  issued_by_name?: string | null
}

export async function createSchool(
  db: Db,
  by: Admin,
  input: { name: string; termMonths?: number; graceDays?: number },
): Promise<{ ok: true; id: string } | Fail> {
  const name = input.name.trim()
  const termMonths = input.termMonths ?? DEFAULT_TERM_MONTHS
  const graceDays = input.graceDays ?? DEFAULT_GRACE_DAYS
  if (name.length < 2) return fail('Enter the school’s name.')
  if (!whole(termMonths, 1, 12)) return fail('A term is 1 to 12 months.')
  if (!whole(graceDays, 0, 90)) return fail('The grace period is 0 to 90 days.')
  try {
    const [{ id }] = await db.query<{ id: string }>(
      'INSERT INTO schools (name, term_months, grace_days) VALUES ($1, $2, $3) RETURNING id',
      [name, termMonths, graceDays],
    )
    await audit(
      db,
      by.id,
      'school.create',
      name,
      `${termMonths} month terms, ${graceDays} days grace`,
    )
    return { ok: true, id }
  } catch (e) {
    if (dup(e)) return fail('There is already a school with that name.')
    throw e
  }
}

// Term length and grace period are set per school and used as the starting values for its next licence.
export async function updateSchoolTerms(
  db: Db,
  by: Admin,
  id: string,
  input: { termMonths: number; graceDays: number },
): Promise<{ ok: true } | Fail> {
  if (!whole(input.termMonths, 1, 12)) return fail('A term is 1 to 12 months.')
  if (!whole(input.graceDays, 0, 90))
    return fail('The grace period is 0 to 90 days.')
  const rows = await db.query<{ name: string }>(
    'UPDATE schools SET term_months = $2, grace_days = $3 WHERE id = $1 RETURNING name',
    [id, input.termMonths, input.graceDays],
  )
  if (!rows.length) return fail('That school was not found.')
  await audit(
    db,
    by.id,
    'school.terms',
    rows[0].name,
    `${input.termMonths} month terms, ${input.graceDays} days grace`,
  )
  return { ok: true }
}

export async function addCampus(
  db: Db,
  by: Admin,
  schoolId: string,
  name: string,
): Promise<{ ok: true; id: string } | Fail> {
  if (name.trim().length < 2) return fail('Enter the campus name.')
  const school = (
    await db.query<SchoolRow>('SELECT * FROM schools WHERE id = $1', [schoolId])
  )[0]
  if (!school) return fail('That school was not found.')
  try {
    const [{ id }] = await db.query<{ id: string }>(
      'INSERT INTO campuses (school_id, name) VALUES ($1, $2) RETURNING id',
      [schoolId, name.trim()],
    )
    await audit(db, by.id, 'campus.create', `${school.name} · ${name.trim()}`)
    return { ok: true, id }
  } catch (e) {
    if (dup(e)) return fail('This school already has a campus with that name.')
    throw e
  }
}

const campusWithSchool = async (db: Db, campusId: string) =>
  (
    await db.query<
      CampusRow & {
        school_name: string
        term_months: number
        grace_days: number
      }
    >(
      `SELECT c.*, s.name AS school_name, s.term_months, s.grace_days
       FROM campuses c JOIN schools s ON s.id = c.school_id WHERE c.id = $1`,
      [campusId],
    )
  )[0]

const latestLicence = async (db: Db, campusId: string) =>
  (
    await db.query<LicenceRow>(
      'SELECT * FROM licences WHERE campus_id = $1 ORDER BY seq DESC LIMIT 1',
      [campusId],
    )
  )[0] as LicenceRow | undefined

export type IssueInput = {
  campusId: string
  kind: 'trial' | 'active'
  starts: string
  // Either a number of terms (using the school's term length) or an exact last day.
  terms?: number
  ends?: string
  seats: number
  // Leave out to use the school's own grace period.
  graceDays?: number
  note?: string
}

// Issues a licence. It replaces the campus's current one; the old one stays in the history.
// Extending a licence is issuing a new one with a later end date.
export async function issueLicence(
  db: Db,
  by: Admin | null,
  input: IssueInput,
  now: Date,
): Promise<{ ok: true; id: string; token: string; licence: Licence } | Fail> {
  const key = config.signingKey()
  if (!key)
    return fail(
      'The licence signing key is not set up, so no licence can be issued.',
    )
  const campus = await campusWithSchool(db, input.campusId)
  if (!campus) return fail('That campus was not found.')
  if (!isDate(input.starts)) return fail('Choose a start date.')
  if (input.kind !== 'trial' && input.kind !== 'active')
    return fail('Choose trial or full licence.')
  let ends = input.ends
  if (!ends) {
    if (!whole(input.terms, 1, 12))
      return fail('Choose how many terms, or an end date.')
    ends = termEnd(input.starts, input.terms!, campus.term_months)
  }
  if (!isDate(ends)) return fail('Choose an end date.')
  if (ends < input.starts) return fail('The end date is before the start date.')
  if (!whole(input.seats, 1, 100_000))
    return fail('Enter how many seats (1 or more).')
  const graceDays = input.graceDays ?? campus.grace_days
  if (!whole(graceDays, 0, 90)) return fail('The grace period is 0 to 90 days.')
  const [{ id }] = await db.query<{ id: string }>(
    'SELECT gen_random_uuid() AS id',
  )
  const licence: Licence = {
    v: 1,
    id,
    school: campus.school_name,
    schoolId: campus.school_id,
    campus: campus.name,
    campusId: campus.id,
    kind: input.kind,
    starts: input.starts,
    ends,
    graceDays,
    seats: input.seats,
    machine: campus.machine,
    issued: now.toISOString(),
  }
  const token = signLicence(licence, key)
  await db.query(
    `INSERT INTO licences (id, campus_id, kind, starts, ends, grace_days, seats, token, note, issued_at, issued_by)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
    [
      id,
      campus.id,
      licence.kind,
      licence.starts,
      ends,
      graceDays,
      licence.seats,
      token,
      input.note?.trim() || null,
      now.toISOString(),
      by?.id ?? null,
    ],
  )
  await audit(
    db,
    by?.id ?? null,
    'licence.issue',
    `${campus.school_name} · ${campus.name}`,
    `${licence.kind}, ${licence.starts} to ${ends}, ${licence.seats} seats, ${graceDays} days grace`,
  )
  return { ok: true, id, token, licence }
}

export async function setSuspended(
  db: Db,
  by: Admin,
  campusId: string,
  suspended: boolean,
  reason: string,
  now: Date,
): Promise<{ ok: true } | Fail> {
  if (suspended && reason.trim().length < 3)
    return fail('Say why the campus is being suspended.')
  const campus = await campusWithSchool(db, campusId)
  if (!campus) return fail('That campus was not found.')
  await db.query(
    'UPDATE campuses SET suspended_at = $2, suspended_reason = $3 WHERE id = $1',
    [
      campusId,
      suspended ? now.toISOString() : null,
      suspended ? reason.trim() : null,
    ],
  )
  await audit(
    db,
    by.id,
    suspended ? 'campus.suspend' : 'campus.resume',
    `${campus.school_name} · ${campus.name}`,
    reason.trim(),
  )
  return { ok: true }
}

/* ---- What the console shows ---- */
export type LicenceView = {
  id: string
  kind: 'trial' | 'active'
  starts: string
  ends: string
  graceDays: number
  seats: number
  note: string
  issued: string
  issuedBy: string
  token: string
}
export type CampusView = {
  id: string
  name: string
  suspended: boolean
  suspendedReason: string
  // enrolled: the server has checked in online. tied: a fingerprint is on record (enrolled, or typed in for
  // a server that stays offline), so licences are made for that one machine.
  enrolled: boolean
  machine: string
  lastHeartbeat: string | null
  version: string
  seatsUsed: number | null
  people: People | null
  licence: LicenceView | null
  // null when there is no licence yet.
  standing: Standing | null
  history: LicenceView[]
}
export type SchoolView = {
  id: string
  name: string
  termMonths: number
  graceDays: number
  campuses: CampusView[]
}

const viewLicence = (r: LicenceRow): LicenceView => ({
  id: r.id,
  kind: r.kind,
  starts: r.starts,
  ends: r.ends,
  graceDays: r.grace_days,
  seats: r.seats,
  note: r.note ?? '',
  issued: iso(r.issued_at)!,
  issuedBy: r.issued_by_name ?? 'system',
  token: r.token,
})
const asLicence = (r: LicenceRow, c: CampusRow): Licence => ({
  v: 1,
  id: r.id,
  school: '',
  schoolId: c.school_id,
  campus: c.name,
  campusId: c.id,
  kind: r.kind,
  starts: r.starts,
  ends: r.ends,
  graceDays: r.grace_days,
  seats: r.seats,
  machine: null,
  issued: iso(r.issued_at)!,
})

export async function listSchools(
  db: Db,
  now: Date,
  onlyId?: string,
): Promise<SchoolView[]> {
  const schools = await db.query<SchoolRow>(
    `SELECT * FROM schools ${onlyId ? 'WHERE id = $1' : ''} ORDER BY lower(name)`,
    onlyId ? [onlyId] : [],
  )
  if (!schools.length) return []
  const campuses = await db.query<CampusRow>(
    `SELECT * FROM campuses ${onlyId ? 'WHERE school_id = $1' : ''} ORDER BY created_at`,
    onlyId ? [onlyId] : [],
  )
  const licences = await db.query<LicenceRow>(
    `SELECT l.*, a.name AS issued_by_name FROM licences l
     JOIN campuses c ON c.id = l.campus_id LEFT JOIN platform_admins a ON a.id = l.issued_by
     ${onlyId ? 'WHERE c.school_id = $1' : ''} ORDER BY l.seq DESC`,
    onlyId ? [onlyId] : [],
  )
  return schools.map((s) => ({
    id: s.id,
    name: s.name,
    termMonths: s.term_months,
    graceDays: s.grace_days,
    campuses: campuses
      .filter((c) => c.school_id === s.id)
      .map((c) => {
        const mine = licences.filter((l) => l.campus_id === c.id)
        const current = mine[0]
        return {
          id: c.id,
          name: c.name,
          suspended: !!c.suspended_at,
          suspendedReason: c.suspended_reason ?? '',
          enrolled: !!c.secret_hash,
          machine: c.machine ?? '',
          lastHeartbeat: iso(c.last_heartbeat),
          version: c.version ?? '',
          seatsUsed: c.seats_used,
          people: readPeople(c.people),
          licence: current ? viewLicence(current) : null,
          standing: current
            ? standing(asLicence(current, c), now, {
                suspended: !!c.suspended_at,
              })
            : null,
          history: mine.map(viewLicence),
        }
      }),
  }))
}

export const getSchool = async (db: Db, id: string, now: Date) =>
  (await listSchools(db, now, id))[0] ?? null

// For a server that will never be online: tie the campus to it by the fingerprint the server shows on its
// licence page, and issue the current licence again for that machine.
export async function tieToMachine(
  db: Db,
  by: Admin,
  campusId: string,
  machine: string,
  now: Date,
): Promise<{ ok: true; token: string | null } | Fail> {
  const clean = machine.trim().toLowerCase()
  if (!/^[a-f0-9]{64}$/.test(clean))
    return fail(
      'A fingerprint is 64 letters and numbers. Copy it from the server’s licence page.',
    )
  const campus = await campusWithSchool(db, campusId)
  if (!campus) return fail('That campus was not found.')
  // A different machine replaces the old one, which can no longer check in.
  await db.query(
    'UPDATE campuses SET machine = $2, secret_hash = CASE WHEN machine = $2 THEN secret_hash ELSE NULL END WHERE id = $1',
    [campusId, clean],
  )
  await audit(
    db,
    by.id,
    'campus.tie',
    `${campus.school_name} · ${campus.name}`,
    clean.slice(0, 12),
  )
  const current = await latestLicence(db, campusId)
  if (!current) return { ok: true, token: null }
  const again = await issueLicence(
    db,
    by,
    {
      campusId,
      kind: current.kind,
      starts: current.starts,
      ends: current.ends,
      seats: current.seats,
      graceDays: current.grace_days,
      note: 'Made for the server with this fingerprint',
    },
    now,
  )
  return again.ok ? { ok: true, token: again.token } : again
}

/* ---- Calls made by a school server ---- */

// A one-time code the installer types on the school server. Making a new one cancels any older unused one.
export async function newEnrolToken(
  db: Db,
  by: Admin,
  campusId: string,
  now: Date,
): Promise<{ ok: true; token: string; expires: string } | Fail> {
  const campus = await campusWithSchool(db, campusId)
  if (!campus) return fail('That campus was not found.')
  await db.query(
    'DELETE FROM enrol_tokens WHERE campus_id = $1 AND used_at IS NULL',
    [campusId],
  )
  const token = 'T2SE-' + newToken(18)
  const expires = new Date(now.getTime() + ENROL_HOURS * 3_600_000)
  await db.query(
    'INSERT INTO enrol_tokens (token_hash, campus_id, expires_at) VALUES ($1, $2, $3)',
    [tokenHash(token), campusId, expires.toISOString()],
  )
  await audit(
    db,
    by.id,
    'campus.enrol-token',
    `${campus.school_name} · ${campus.name}`,
  )
  return { ok: true, token, expires: expires.toISOString() }
}

export type Enrolled = {
  ok: true
  campusId: string
  school: string
  campus: string
  // Kept by the school server and sent with every heartbeat. Shown once.
  secret: string
  licence: string | null
}

// The school server sends its one-time code and its machine fingerprint. The campus is tied to that
// machine, and its licence is issued again bound to it.
export async function enrolCampus(
  db: Db,
  input: { token: string; machine: string; version?: string },
  now: Date,
): Promise<Enrolled | Fail> {
  if (!/^[a-f0-9]{32,128}$/.test(input.machine))
    return fail('Bad machine fingerprint.')
  const used = await db.query<{ campus_id: string }>(
    `UPDATE enrol_tokens SET used_at = $2 WHERE token_hash = $1 AND used_at IS NULL AND expires_at > $2
     RETURNING campus_id`,
    [tokenHash(input.token.trim()), now.toISOString()],
  )
  if (!used.length)
    return fail(
      'This enrolment code has been used or has run out. Make a new one in the console.',
    )
  const campusId = used[0].campus_id
  const secret = newToken()
  await db.query(
    'UPDATE campuses SET machine = $2, secret_hash = $3, version = $4, last_heartbeat = $5 WHERE id = $1',
    [
      campusId,
      input.machine,
      tokenHash(secret),
      input.version ?? null,
      now.toISOString(),
    ],
  )
  const campus = (await campusWithSchool(db, campusId))!
  const current = await latestLicence(db, campusId)
  let licence: string | null = null
  if (current) {
    const again = await issueLicence(
      db,
      null,
      {
        campusId,
        kind: current.kind,
        starts: current.starts,
        ends: current.ends,
        seats: current.seats,
        graceDays: current.grace_days,
        note: 'Bound to the enrolled server',
      },
      now,
    )
    if (!again.ok) return again
    licence = again.token
  }
  await audit(
    db,
    null,
    'campus.enrolled',
    `${campus.school_name} · ${campus.name}`,
    input.machine.slice(0, 12),
  )
  return {
    ok: true,
    campusId,
    school: campus.school_name,
    campus: campus.name,
    secret,
    licence,
  }
}

// A heartbeat reports the server's version and seats in use, and brings back the current licence and a
// signed note of whether the campus is suspended.
export async function heartbeat(
  db: Db,
  input: {
    campusId: string
    secret: string
    machine: string
    version?: string
    seatsUsed?: number
    people?: unknown
    usage?: unknown
    nonce?: string
  },
  now: Date,
): Promise<{ ok: true; licence: string | null; status: string } | Fail> {
  const key = config.signingKey()
  if (!key) return fail('The control service is not set up.')
  const campus = (
    await db
      .query<CampusRow>('SELECT * FROM campuses WHERE id = $1', [
        input.campusId,
      ])
      .catch(() => [])
  )[0]
  if (
    !campus ||
    !campus.secret_hash ||
    campus.secret_hash !== tokenHash(input.secret) ||
    campus.machine !== input.machine
  )
    return fail('This server is not enrolled for that campus.')
  const people = cleanPeople(input.people)
  await db.query(
    'UPDATE campuses SET last_heartbeat = $2, version = $3, seats_used = $4, people = $5 WHERE id = $1',
    [
      campus.id,
      now.toISOString(),
      input.version ?? campus.version,
      whole(input.seatsUsed, 0, 1_000_000)
        ? input.seatsUsed
        : campus.seats_used,
      people ? JSON.stringify(people) : campus.people,
    ],
  )
  await keepCampusUsage(db, campus.id, input.usage, now)
  const current = await latestLicence(db, campus.id)
  return {
    ok: true,
    licence: current?.token ?? null,
    status: signStatus(
      {
        campusId: campus.id,
        suspended: !!campus.suspended_at,
        at: now.toISOString(),
        nonce:
          typeof input.nonce === 'string'
            ? input.nonce.slice(0, 64)
            : undefined,
      },
      key,
    ),
  }
}
