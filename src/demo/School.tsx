import { EyeOff } from 'lucide-react'
import { Stat, Usage } from './Campus'
import { DemoShell, SampleTag } from './DemoShell'
import { ACTIVITY, CAMPUSES, SCHOOL, subject } from './data'
import { subjectVars } from './subject-style'

// Director: every campus of the school, side by side, plus recent activity without names.
export function School() {
  return (
    <DemoShell role="director">
      <SchoolBody />
    </DemoShell>
  )
}

function SchoolBody() {
  const sum = (pick: (c: (typeof CAMPUSES)[number]) => number) =>
    CAMPUSES.reduce((n, c) => n + pick(c), 0)
  const campusName = (id: string) =>
    SCHOOL.campuses.find((c) => c.id === id)!.name
  return (
    <>
      <div className="dm-head">
        <h1>{SCHOOL.name}</h1>
        <p>
          Every campus of your school in one place. Each campus sends its
          figures when it has a connection.
        </p>
      </div>

      <div className="dm-list-h">
        <h2>The whole school this week</h2>
        <SampleTag />
      </div>
      <div className="dm-stats">
        <Stat n={CAMPUSES.length} label="campuses" />
        <Stat n={sum((c) => c.students)} label="students" />
        <Stat n={sum((c) => c.teachers)} label="teachers" />
        <Stat n={sum((c) => c.labSessions)} label="lab sessions" />
      </div>

      <div className="dm-campuses">
        {CAMPUSES.map((c) => (
          <section
            key={c.id}
            className="sd-card dm-card dm-campus"
            aria-label={c.name}
          >
            <div className="dm-list-h">
              <h2>{c.name}</h2>
              <SampleTag />
            </div>
            <p className="dm-fine">Last update: {c.lastUpdate}</p>
            <dl>
              <div>
                <dt>Students</dt>
                <dd>{c.students}</dd>
              </div>
              <div>
                <dt>Teachers</dt>
                <dd>{c.teachers}</dd>
              </div>
              <div>
                <dt>Seats in use</dt>
                <dd>
                  {c.seatsUsed} of {c.seatCap}
                </dd>
              </div>
              <div>
                <dt>Set tasks handed in</dt>
                <dd>{c.completion}%</dd>
              </div>
            </dl>
            <h3>Lab sessions by subject</h3>
            <Usage campus={c} />
          </section>
        ))}
      </div>

      <section aria-labelledby="dm-activity-h">
        <div className="dm-list-h">
          <h2 id="dm-activity-h">Recent activity</h2>
          <SampleTag />
        </div>
        <p className="dm-notice">
          <EyeOff size={17} aria-hidden="true" /> Names are hidden here. Each
          person shows as a code, such as “Learner 4F2”. To see a named record,
          open it on that campus’s own app.
        </p>
        <ul className="dm-activity" aria-label="Recent activity">
          {ACTIVITY.map((a) => (
            <li
              key={a.who + a.when}
              className="sd-card"
              style={subjectVars(a.subject)}
            >
              <span className="dot" aria-hidden="true" />
              <div className="what">
                <b>
                  {a.who} {a.what}
                </b>
                <span>
                  {subject(a.subject).name} · {a.topic} · {campusName(a.campus)}
                </span>
              </div>
              <time>{a.when}</time>
            </li>
          ))}
        </ul>
      </section>
    </>
  )
}
