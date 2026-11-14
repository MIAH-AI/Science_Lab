import { useState } from 'react'
import { ClipboardList } from 'lucide-react'
import type { SubjectKey } from '../lib/topics'
import { SampleTag } from './DemoShell'
import { STUDENT_TASKS, dueText, subject } from './data'
import { subjectVars } from './subject-style'

// "Your tasks" on the Study Desk, shown only in the student demo. Ticks are kept for this visit only.
export function StudentTasks({
  labHref,
}: {
  labHref: (path: string, hash?: string) => string
}) {
  const [done, setDone] = useState<string[]>([])
  const left = STUDENT_TASKS.length - done.length
  return (
    <section className="sd-card dm-mytasks" aria-labelledby="dm-mytasks-h">
      <div className="dm-list-h">
        <h2 id="dm-mytasks-h">
          <ClipboardList size={19} aria-hidden="true" /> Your tasks
        </h2>
        <SampleTag />
      </div>
      <p className="dm-fine" aria-live="polite">
        {left === 0
          ? 'All done. Well done.'
          : `${left} to do, set by your teacher.`}
      </p>
      <ul>
        {STUDENT_TASKS.map((t) => {
          const ticked = done.includes(t.id)
          const s = subject(t.subject as SubjectKey)
          return (
            <li
              key={t.id}
              className={ticked ? 'done' : undefined}
              style={subjectVars(t.subject)}
            >
              <label>
                <input
                  type="checkbox"
                  checked={ticked}
                  onChange={() =>
                    setDone((d) =>
                      ticked ? d.filter((id) => id !== t.id) : [...d, t.id],
                    )
                  }
                />
                <span className="sd-sr">Mark as done: </span>
                <span className="what">
                  <b>{t.topic}</b>
                  <span>
                    {s.name} · from {t.from} · due {dueText(t.due)}
                  </span>
                </span>
              </label>
              <a href={labHref(s.path)}>Open lab</a>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
