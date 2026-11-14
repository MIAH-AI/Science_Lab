// The console's reading screens: Overview, People, Content and Usage. They change nothing; every figure
// is either stored by the control service or counted by the app, and an empty state says so plainly.
import { useMemo, useState } from 'react'
import {
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  Building2,
  ExternalLink,
  Search,
  TriangleAlert,
} from 'lucide-react'
import { niceDate } from '../lib/terms'
import { index, type SubjectKey } from '../lib/topics'
import { subjects } from '../marketing/content'
import type { CampusView, SchoolView } from '../server/control'
import type { UsageReport } from '../server/usage'
import { ACTIONS, Pill, plural } from './Console'
import type { ConsoleState } from './api'

const num = (n: number) => n.toLocaleString('en-GB')
const shortDay = (day: string) =>
  new Date(day + 'T00:00:00Z').toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    timeZone: 'UTC',
  })
const when = (iso: string) =>
  new Date(iso).toLocaleString('en-GB', {
    dateStyle: 'medium',
    timeStyle: 'short',
  })
const opens = (t: { lab: number; exam: number }) => t.lab + t.exam
const everyCampus = (schools: SchoolView[]) =>
  schools.flatMap((s) => s.campuses.map((c) => ({ school: s, campus: c })))

function Tile({
  label,
  value,
  note,
  trend,
}: {
  label: string
  value: string
  note?: string
  trend?: 'up' | 'down'
}) {
  return (
    <div className="sd-card cs-tile">
      <span className="cs-label">{label}</span>
      <b>{value}</b>
      {note && (
        <small>
          {trend === 'up' && <ArrowUpRight size={15} aria-hidden="true" />}
          {trend === 'down' && <ArrowDownRight size={15} aria-hidden="true" />}
          {note}
        </small>
      )}
    </div>
  )
}

// "12% more than the 14 days before", or nothing when there is no earlier figure to compare with.
function change(now: number, before: number, days: number) {
  if (!before) return {}
  const pct = Math.round(((now - before) / before) * 100)
  if (pct === 0) return { note: `the same as the ${days} days before` }
  return {
    note: `${Math.abs(pct)}% ${pct > 0 ? 'more' : 'fewer'} than the ${days} days before`,
    trend: pct > 0 ? ('up' as const) : ('down' as const),
  }
}

/* ------------------------------------------------------------------ the daily chart */
// One bar a day: labs and exam practice opened. One series, so one colour and no legend; the bar under
// the pointer (or the keyboard focus) is read out above the chart, and the same figures are in a table.
function DayChart({ days }: { days: UsageReport['byDay'] }) {
  const [at, setAt] = useState<number | null>(null)
  const top = Math.max(1, ...days.map(opens))
  // A round number at or above the tallest day, so the scale reads cleanly.
  const step = 10 ** Math.floor(Math.log10(top))
  const max = Math.max(4, Math.ceil(top / step) * step)
  const shown = at === null ? null : days[at]
  const marks = [0, Math.floor(days.length / 2), days.length - 1]
  return (
    <figure className="cs-chart">
      <p className="cs-chart-read" aria-live="polite">
        {shown ? (
          <>
            <b>{niceDate(shown.day)}</b> · {plural(shown.lab, 'lab')} opened ·{' '}
            {num(shown.exam)} exam practice · {plural(shown.desk, 'visit')} to
            the Study Desk
          </>
        ) : (
          'Point at a day, or move to it with the Tab key, to read its figures.'
        )}
      </p>
      <div className="cs-plot">
        <div className="cs-yaxis" aria-hidden="true">
          <span>{num(max)}</span>
          <span>{num(max / 2)}</span>
          <span>0</span>
        </div>
        <div
          className="cs-bars"
          role="group"
          aria-label="Labs and exam practice opened each day"
          onMouseLeave={() => setAt(null)}
        >
          {days.map((d, i) => (
            <button
              key={d.day}
              type="button"
              className={at === i ? 'on' : undefined}
              aria-label={`${niceDate(d.day)}: ${num(opens(d))} opened`}
              onMouseEnter={() => setAt(i)}
              onFocus={() => setAt(i)}
              onBlur={() => setAt(null)}
            >
              <i style={{ height: `${(opens(d) / max) * 100}%` }} />
            </button>
          ))}
        </div>
      </div>
      <div className="cs-xaxis" aria-hidden="true">
        {marks.map((m) => (
          <span key={m}>{shortDay(days[m].day)}</span>
        ))}
      </div>
    </figure>
  )
}

/* ------------------------------------------------------------------ overview */
type Flag = { tone: 'bad' | 'warn'; text: string }
function flagsFor(c: CampusView, now: number): Flag[] {
  const out: Flag[] = []
  const s = c.standing
  if (c.suspended) out.push({ tone: 'bad', text: 'Suspended' })
  else if (!s) out.push({ tone: 'warn', text: 'No licence yet' })
  else if (s.state === 'locked')
    out.push({ tone: 'bad', text: `Licence ended ${niceDate(s.ends)}` })
  else if (s.state === 'not-started')
    out.push({
      tone: 'warn',
      text: `Licence starts in ${plural(s.daysLeft, 'day')}; locked until then`,
    })
  else if (s.state === 'grace')
    out.push({
      tone: 'warn',
      text: `Read-only, locks after ${niceDate(s.locks)}`,
    })
  else if (s.state === 'valid' && s.daysLeft <= 30)
    out.push({
      tone: 'warn',
      text: `Licence ends in ${plural(s.daysLeft, 'day')}`,
    })
  if (
    c.enrolled &&
    c.lastHeartbeat &&
    now - Date.parse(c.lastHeartbeat) > 7 * 86_400_000
  )
    out.push({
      tone: 'warn',
      text: `Has not checked in since ${niceDate(c.lastHeartbeat.slice(0, 10))}`,
    })
  if (c.licence && c.seatsUsed !== null && c.seatsUsed >= c.licence.seats)
    out.push({ tone: 'warn', text: 'Every seat is in use' })
  return out
}

export function Overview({
  schools,
  usage,
  audit,
  at,
  state,
}: {
  schools: SchoolView[]
  usage: UsageReport
  audit: {
    id: string
    at: string
    by: string
    action: string
    target: string
  }[]
  // When the server answered, so the page does not read the clock while drawing.
  at: number
  state: ConsoleState
}) {
  const all = everyCampus(schools)
  const licensed = all.filter(
    ({ campus }) => campus.standing?.canUse && !campus.suspended,
  )
  const seats = licensed.reduce((n, { campus }) => n + campus.licence!.seats, 0)
  const used = all.reduce((n, { campus }) => n + (campus.seatsUsed ?? 0), 0)
  const reporting = all.filter(({ campus }) => campus.seatsUsed !== null).length
  const flagged = all
    .map((x) => ({ ...x, flags: flagsFor(x.campus, at) }))
    .filter((x) => x.flags.length)
  return (
    <>
      <div className="cs-head">
        <h1>Overview</h1>
        <p>
          {state.me ? `Signed in as ${state.me.name}. ` : ''}Schools, licences
          and how the labs are being used.
        </p>
      </div>
      {!state.canSign && (
        <p className="cs-note bad" role="status">
          Licences cannot be issued yet. The signing key (LICENCE_SIGNING_KEY)
          is not in the site settings.
        </p>
      )}
      <div className="cs-tiles">
        <Tile
          label="Schools"
          value={num(schools.length)}
          note={plural(all.length, 'campus', 'campuses')}
        />
        <Tile
          label="Campuses licensed now"
          value={num(licensed.length)}
          note={`${plural(seats, 'seat')} licensed`}
        />
        <Tile
          label="Seats in use"
          value={reporting ? num(used) : '—'}
          note={
            reporting
              ? `reported by ${plural(reporting, 'campus', 'campuses')}`
              : 'No school server has reported yet'
          }
        />
        <Tile
          label="Opened in 14 days"
          value={num(opens(usage.total))}
          note="Labs and exam practice"
          {...change(opens(usage.total), opens(usage.before), 14)}
        />
      </div>
      <section className="sd-card cs-panel" aria-label="Needs attention">
        <h2>
          <TriangleAlert size={18} aria-hidden="true" /> Needs attention
        </h2>
        {flagged.length ? (
          <ul className="cs-flags">
            {flagged.map(({ school, campus, flags }) => (
              <li key={campus.id}>
                <a href={`/console/schools/${school.id}`}>
                  <b>
                    {school.name} · {campus.name}
                  </b>
                  {flags.map((f) => (
                    <span key={f.text} className={`cs-pill ${f.tone}`}>
                      {f.text}
                    </span>
                  ))}
                  <ArrowRight size={16} aria-hidden="true" />
                </a>
              </li>
            ))}
          </ul>
        ) : (
          <p className="cs-sub">
            {schools.length ? 'Nothing right now.' : 'No schools yet.'}{' '}
            {!schools.length && (
              <a href="/console/schools">Add the first one</a>
            )}
          </p>
        )}
      </section>
      <section
        className="sd-card cs-panel"
        aria-label="Use in the last 14 days"
      >
        <div className="cs-panel-head">
          <h2>Use in the last 14 days</h2>
          <a href="/console/usage">All usage</a>
        </div>
        {opens(usage.total) + usage.total.desk ? (
          <DayChart days={usage.byDay} />
        ) : (
          <p className="cs-sub">
            Nothing has been counted yet. Counts start when someone opens the
            Study Desk or a lab on a site that has this console switched on, or
            when an online school server checks in.
          </p>
        )}
      </section>
      <section className="sd-card cs-panel" aria-label="Latest changes">
        <div className="cs-panel-head">
          <h2>Latest changes</h2>
          <a href="/console/audit">Audit trail</a>
        </div>
        <ul className="cs-feed">
          {audit.map((e) => (
            <li key={e.id}>
              <span>{when(e.at)}</span>
              <b>{e.by}</b> {(ACTIONS[e.action] ?? e.action).toLowerCase()}
              {e.target ? `: ${e.target}` : ''}
            </li>
          ))}
        </ul>
      </section>
    </>
  )
}

/* ------------------------------------------------------------------ people */
export function People({ schools }: { schools: SchoolView[] }) {
  const all = everyCampus(schools)
  const reported = all.filter(({ campus }) => campus.people)
  const sum = (k: keyof NonNullable<CampusView['people']>) =>
    reported.reduce((n, { campus }) => n + campus.people![k], 0)
  return (
    <>
      <div className="cs-head">
        <h1>People</h1>
        <p>
          How many people each school server has. Names, classes and passwords
          stay on the school’s own server; only these numbers are sent here.
        </p>
      </div>
      <div className="cs-tiles">
        <Tile
          label="Students"
          value={reported.length ? num(sum('students')) : '—'}
        />
        <Tile
          label="Teachers"
          value={reported.length ? num(sum('teachers')) : '—'}
        />
        <Tile
          label="School leaders"
          value={reported.length ? num(sum('leaders')) : '—'}
          note="School admins and principals"
        />
        <Tile
          label="Waiting for approval"
          value={reported.length ? num(sum('pending')) : '—'}
        />
      </div>
      {schools.length === 0 && (
        <p className="cs-note">
          No schools yet. <a href="/console/schools">Add the first one</a>
        </p>
      )}
      {schools.map((s) => (
        <section key={s.id} className="sd-card cs-panel" aria-label={s.name}>
          <div className="cs-panel-head">
            <h2>
              <Building2 size={18} aria-hidden="true" /> {s.name}
            </h2>
            <a href={`/console/schools/${s.id}`}>Licences</a>
          </div>
          {s.campuses.length === 0 ? (
            <p className="cs-sub">This school has no campus yet.</p>
          ) : (
            <div className="cs-table cs-people">
              <table>
                <thead>
                  <tr>
                    <th>Campus</th>
                    <th>Seats</th>
                    <th>Students</th>
                    <th>Teachers</th>
                    <th>Leaders</th>
                    <th>Waiting</th>
                    <th>Invited</th>
                    <th>Disabled</th>
                    <th>Last check-in</th>
                  </tr>
                </thead>
                <tbody>
                  {s.campuses.map((c) => (
                    <tr key={c.id}>
                      <td>
                        <b>{c.name}</b> <Pill campus={c} />
                      </td>
                      <td>
                        {c.seatsUsed ?? '—'}
                        {c.licence ? ` of ${num(c.licence.seats)}` : ''}
                      </td>
                      {c.people ? (
                        <>
                          <td>{num(c.people.students)}</td>
                          <td>{num(c.people.teachers)}</td>
                          <td>{num(c.people.leaders)}</td>
                          <td>{num(c.people.pending)}</td>
                          <td>{num(c.people.invited)}</td>
                          <td>{num(c.people.disabled)}</td>
                        </>
                      ) : (
                        <td colSpan={6} className="cs-quiet">
                          {c.enrolled
                            ? 'This server has not sent its numbers yet.'
                            : 'This server is not connected to the console, so it sends no numbers.'}
                        </td>
                      )}
                      <td>
                        {c.lastHeartbeat
                          ? new Date(c.lastHeartbeat).toLocaleString('en-GB', {
                              day: 'numeric',
                              month: 'short',
                              hour: '2-digit',
                              minute: '2-digit',
                            })
                          : 'Never'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      ))}
      <p className="cs-note">
        Each school’s own admin adds, approves and removes its people on the
        school server. To change who can use this console, go to{' '}
        <a href="/console/admins">Admins</a>.
      </p>
    </>
  )
}

/* ------------------------------------------------------------------ content */
export function Content({ report }: { report: UsageReport }) {
  const [query, setQuery] = useState('')
  const words = query.toLowerCase().split(/\s+/).filter(Boolean)
  const totals = useMemo(
    () =>
      subjects.map((s) => ({
        ...s,
        topics: index[s.key as SubjectKey],
        subtopics: index[s.key as SubjectKey].reduce(
          (n, t) => n + t.s.length,
          0,
        ),
      })),
    [],
  )
  const used = (key: string) =>
    report.bySubject.find((b) => b.subject === key) ?? { lab: 0, exam: 0 }
  return (
    <>
      <div className="cs-head">
        <h1>Content</h1>
        <p>
          The subjects, topics and labs in this version of the app. Content is
          part of each release, so it is read here and changed by a release.
        </p>
      </div>
      <div className="cs-tiles">
        <Tile label="Subjects" value={num(totals.length)} />
        <Tile
          label="Topics"
          value={num(totals.reduce((n, s) => n + s.topics.length, 0))}
        />
        <Tile
          label="Subtopics"
          value={num(totals.reduce((n, s) => n + s.subtopics, 0))}
        />
        <Tile
          label="Opened in 30 days"
          value={num(opens(report.total))}
          note="Labs and exam practice"
        />
      </div>
      <label className="cs-search">
        <Search size={18} aria-hidden="true" />
        <span className="cs-hide">Find a topic</span>
        <input
          type="search"
          placeholder="Find a topic in any subject"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </label>
      {totals.map((s) => {
        const hits = words.length
          ? s.topics.filter((t) =>
              [t.t, ...t.s].some((title) =>
                words.every((w) =>
                  (title + ' ' + t.t).toLowerCase().includes(w),
                ),
              ),
            )
          : s.topics
        if (words.length && !hits.length) return null
        const u = used(s.key)
        return (
          <section key={s.key} className="sd-card cs-panel" aria-label={s.name}>
            <div className="cs-panel-head">
              <h2>
                <i className="cs-dot" style={{ background: s.colour }} />
                {s.name}
              </h2>
              <span className="cs-links">
                <a href={s.path} target="_blank" rel="noreferrer">
                  Open lab <ExternalLink size={14} aria-hidden="true" />
                </a>
                <a href={`${s.path}#exam`} target="_blank" rel="noreferrer">
                  Exam practice <ExternalLink size={14} aria-hidden="true" />
                </a>
              </span>
            </div>
            <dl className="cs-facts">
              <div>
                <dt>In the lab</dt>
                <dd>{s.facts}</dd>
              </div>
              <div>
                <dt>Topics</dt>
                <dd>
                  {num(s.topics.length)} topics · {num(s.subtopics)} subtopics
                </dd>
              </div>
              <div>
                <dt>Opened in 30 days</dt>
                <dd>
                  {plural(u.lab, 'lab')} · {num(u.exam)} exam practice
                </dd>
              </div>
            </dl>
            <details className="cs-topics" open={words.length > 0}>
              <summary>
                {words.length
                  ? `${plural(hits.length, 'topic')} match`
                  : `Show all ${num(s.topics.length)} topics`}
              </summary>
              <ul>
                {hits.map((t) => (
                  <li key={t.t}>
                    <b>{t.t}</b>
                    {t.s.length > 0 && <span>{t.s.join(' · ')}</span>}
                  </li>
                ))}
              </ul>
            </details>
          </section>
        )
      })}
    </>
  )
}

/* ------------------------------------------------------------------ usage */
export function Usage({
  report,
  source,
  campuses,
}: {
  report: UsageReport
  source: string
  campuses: { id: string; name: string }[]
}) {
  const link = (days: number, src = source) =>
    `/console/usage?days=${days}${src ? `&source=${src}` : ''}`
  const nameOf = (id: string) =>
    id === 'web'
      ? 'The website'
      : (campuses.find((c) => c.id === id)?.name ?? 'A removed campus')
  const any = opens(report.total) + report.total.desk > 0
  const top = Math.max(1, ...report.bySubject.map(opens))
  return (
    <>
      <div className="cs-head">
        <h1>Usage</h1>
        <p>
          How often the Study Desk, the labs and exam practice were opened. A
          count is one opening of a page, not one person, and nothing about the
          person is kept.
        </p>
      </div>
      <div className="cs-filters">
        <div className="cs-seg" role="group" aria-label="Period">
          {[7, 30, 90].map((d) => (
            <a
              key={d}
              href={link(d)}
              aria-current={report.days === d ? 'true' : undefined}
            >
              {d} days
            </a>
          ))}
        </div>
        <label className="cs-field">
          <span>Where</span>
          <select
            value={source}
            onChange={(e) =>
              window.location.assign(link(report.days, e.target.value))
            }
          >
            <option value="">Everywhere</option>
            <option value="web">The website</option>
            {campuses.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </label>
      </div>
      <div className="cs-tiles">
        <Tile
          label="Labs opened"
          value={num(report.total.lab)}
          {...change(report.total.lab, report.before.lab, report.days)}
        />
        <Tile
          label="Exam practice opened"
          value={num(report.total.exam)}
          {...change(report.total.exam, report.before.exam, report.days)}
        />
        <Tile
          label="Study Desk visits"
          value={num(report.total.desk)}
          {...change(report.total.desk, report.before.desk, report.days)}
        />
      </div>
      {!any && (
        <p className="cs-note">
          Nothing was counted in these {report.days} days. Counts start when
          someone opens the Study Desk or a lab on a site that has this console
          switched on, or when an online school server checks in.
        </p>
      )}
      <section className="sd-card cs-panel" aria-label="Opened each day">
        <h2>Labs and exam practice opened each day</h2>
        <DayChart days={report.byDay} />
      </section>
      <section className="sd-card cs-panel" aria-label="By subject">
        <h2>By subject</h2>
        <div className="cs-table">
          <table className="cs-meter">
            <thead>
              <tr>
                <th>Subject</th>
                <th aria-hidden="true" />
                <th>Labs</th>
                <th>Exam practice</th>
              </tr>
            </thead>
            <tbody>
              {subjects.map((s) => {
                const u = report.bySubject.find((b) => b.subject === s.key) ?? {
                  lab: 0,
                  exam: 0,
                }
                return (
                  <tr key={s.key}>
                    <td>{s.name}</td>
                    <td aria-hidden="true">
                      {opens(u) > 0 && (
                        <i style={{ width: `${(opens(u) / top) * 100}%` }} />
                      )}
                    </td>
                    <td>{num(u.lab)}</td>
                    <td>{num(u.exam)}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </section>
      {!source && (
        <section className="sd-card cs-panel" aria-label="By place">
          <h2>By place</h2>
          {report.bySource.length ? (
            <div className="cs-table">
              <table>
                <thead>
                  <tr>
                    <th>Where</th>
                    <th>Labs</th>
                    <th>Exam practice</th>
                    <th>Study Desk visits</th>
                  </tr>
                </thead>
                <tbody>
                  {report.bySource.map((s) => (
                    <tr key={s.source}>
                      <td>
                        <a href={link(report.days, s.source)}>
                          {nameOf(s.source)}
                        </a>
                      </td>
                      <td>{num(s.lab)}</td>
                      <td>{num(s.exam)}</td>
                      <td>{num(s.desk)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="cs-sub">No place has sent a count in this period.</p>
          )}
          <p className="cs-sub">
            A school server sends its counts when it is online. A server that
            never connects to the console is not in these figures.
          </p>
        </section>
      )}
      <details className="cs-history">
        <summary>Show the daily figures as a table</summary>
        <div className="sd-card cs-table">
          <table>
            <thead>
              <tr>
                <th>Day</th>
                <th>Labs</th>
                <th>Exam practice</th>
                <th>Study Desk visits</th>
              </tr>
            </thead>
            <tbody>
              {[...report.byDay].reverse().map((d) => (
                <tr key={d.day}>
                  <td>{niceDate(d.day)}</td>
                  <td>{num(d.lab)}</td>
                  <td>{num(d.exam)}</td>
                  <td>{num(d.desk)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </>
  )
}
