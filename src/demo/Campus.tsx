import { DemoShell, SampleTag } from './DemoShell'
import { CAMPUSES, SCHOOL, subject, type CampusSummary } from './data'
import { SUBJECT_ICON, subjectVars } from './subject-style'

// Principal: one campus only (the roadmap's scope rule), here the Main Campus.
export function Campus() {
  return (
    <DemoShell role="principal">
      <CampusBody campus={CAMPUSES[0]} />
    </DemoShell>
  )
}

export function Stat({ n, label }: { n: string | number; label: string }) {
  return (
    <div className="sd-card dm-stat">
      <strong className="sd-num">{n}</strong>
      <span>{label}</span>
    </div>
  )
}

// Lab sessions by subject, one bar per subject in that subject's colour.
export function Usage({ campus }: { campus: CampusSummary }) {
  const most = Math.max(...campus.usage.map((u) => u.sessions))
  return (
    <ul
      className="dm-usage"
      aria-label={`Lab sessions by subject, ${campus.name}`}
    >
      {campus.usage.map((u) => {
        const Icon = SUBJECT_ICON[u.subject]
        return (
          <li key={u.subject} style={subjectVars(u.subject)}>
            <span className="name">
              <Icon size={16} aria-hidden="true" />
              {subject(u.subject).name}
            </span>
            <span className="bar" aria-hidden="true">
              <i style={{ width: `${(u.sessions / most) * 100}%` }} />
            </span>
            <span className="num">{u.sessions}</span>
          </li>
        )
      })}
    </ul>
  )
}

function CampusBody({ campus }: { campus: CampusSummary }) {
  const tasks = campus.classes.reduce((n, c) => n + c.tasksSet, 0)
  return (
    <>
      <div className="dm-head">
        <h1>{campus.name}</h1>
        <p>
          How your campus of {SCHOOL.name} is using the labs this week. You see
          your own campus only.
        </p>
      </div>

      <div className="dm-list-h">
        <h2>This week</h2>
        <SampleTag />
      </div>
      <div className="dm-stats">
        <Stat n={campus.students} label="students" />
        <Stat n={campus.teachers} label="teachers" />
        <Stat n={tasks} label="tasks set" />
        <Stat n={`${campus.completion}%`} label="of set tasks handed in" />
        <Stat n={campus.labSessions} label="lab sessions" />
      </div>

      <div className="dm-cols even">
        <section aria-labelledby="dm-classes-h">
          <div className="dm-list-h">
            <h2 id="dm-classes-h">Classes and task completion</h2>
            <SampleTag />
          </div>
          <div className="sd-card dm-table">
            <table>
              <thead>
                <tr>
                  <th scope="col">Class</th>
                  <th scope="col">Teacher</th>
                  <th scope="col">Students</th>
                  <th scope="col">Tasks set</th>
                  <th scope="col">Handed in</th>
                </tr>
              </thead>
              <tbody>
                {campus.classes.map((c) => (
                  <tr key={c.name}>
                    <th scope="row">{c.name}</th>
                    <td>{c.teacher}</td>
                    <td>{c.students}</td>
                    <td>{c.tasksSet}</td>
                    <td>
                      <span className="pct">
                        <progress
                          max={100}
                          value={c.completion}
                          aria-label={`${c.name}: ${c.completion} per cent of set tasks handed in`}
                        />
                        {c.completion}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section aria-labelledby="dm-usage-h">
          <div className="dm-list-h">
            <h2 id="dm-usage-h">Lab sessions by subject</h2>
            <SampleTag />
          </div>
          <div className="sd-card dm-card">
            <Usage campus={campus} />
            <p className="dm-fine">
              A lab session is one student opening a lab. Counts are for this
              week.
            </p>
          </div>
        </section>
      </div>
    </>
  )
}
