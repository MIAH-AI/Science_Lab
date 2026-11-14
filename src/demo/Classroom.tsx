import { useEffect, useState } from 'react'
import {
  ChevronDown,
  Clock,
  ListChecks,
  MonitorPlay,
  Pause,
  PenLine,
  Play,
  Plus,
  RotateCcw,
} from 'lucide-react'
import { formatFocus } from '../lib/focus'
import type { SubjectKey } from '../lib/topics'
import { DemoShell, SampleTag, useDemoNight } from './DemoShell'
import {
  CLASS_NAMES,
  DEMO_CLASS,
  DUE_OPTIONS,
  STUDENTS,
  SUBJECTS,
  TASKS,
  dueText,
  subject as subjectOf,
  topicsOf,
  type Task,
} from './data'
import { SUBJECT_ICON, subjectVars } from './subject-style'

const LESSON_LENGTHS = [5, 10, 15, 20]

export function Classroom() {
  return (
    <DemoShell role="teacher">
      <ClassroomBody />
    </DemoShell>
  )
}

function ClassroomBody() {
  const night = useDemoNight()
  const [subject, setSubject] = useState<SubjectKey>('biology')
  const [topic, setTopic] = useState(topicsOf('biology')[0])
  const [paperSubject, setPaperSubject] = useState<SubjectKey>('biology')

  // Lesson timer: the same hand-off as the Study Desk focus timer, so a running timer shows in the lab's bar.
  const [minutes, setMinutes] = useState(15)
  const [seconds, setSeconds] = useState(15 * 60)
  const [endAt, setEndAt] = useState<number | null>(null)
  const ticking = endAt !== null && seconds > 0
  useEffect(() => {
    if (endAt === null) return
    const tick = () => {
      const left = Math.max(0, Math.ceil((endAt - Date.now()) / 1000))
      setSeconds(left)
      if (left === 0) setEndAt(null)
    }
    const id = window.setInterval(tick, 1000)
    return () => window.clearInterval(id)
  }, [endAt])
  const mm = String(Math.floor(seconds / 60)).padStart(2, '0')
  const ss = String(seconds % 60).padStart(2, '0')
  function chooseLength(m: number) {
    setMinutes(m)
    setSeconds(m * 60)
    setEndAt(null)
  }

  const focus = formatFocus({ minutes, seconds, endAt })
  const labHref = (key: SubjectKey, hash = '') =>
    `${subjectOf(key).path}?appearance=${night ? 'night' : 'default'}${focus ? `&focus=${focus}` : ''}${hash}`

  function chooseSubject(key: SubjectKey) {
    setSubject(key)
    setTopic(topicsOf(key)[0])
  }
  const chosen = subjectOf(subject)

  return (
    <>
      <div className="dm-head">
        <h1>Teach a topic</h1>
        <p>
          Three steps to put a live lab on the board. Use Night with a projector
          in a bright room: the text is large and the contrast is strong, so the
          back row can read it.
        </p>
      </div>

      <div className="dm-cols">
        <div>
          <section className="dm-step" aria-labelledby="dm-s1">
            <h2 id="dm-s1">
              <span className="n">1</span> Choose a subject
            </h2>
            <div className="dm-subjects" role="group" aria-label="Subject">
              {SUBJECTS.map((s) => {
                const Icon = SUBJECT_ICON[s.key]
                return (
                  <button
                    type="button"
                    key={s.key}
                    aria-pressed={s.key === subject}
                    style={subjectVars(s.key)}
                    onClick={() => chooseSubject(s.key)}
                  >
                    <Icon size={30} aria-hidden="true" />
                    {s.name}
                  </button>
                )
              })}
            </div>
          </section>

          <section className="dm-step" aria-labelledby="dm-s2">
            <h2 id="dm-s2">
              <span className="n">2</span> Choose a topic
              <small>
                {topicsOf(subject).length} topics in {chosen.name}
              </small>
            </h2>
            <div
              className="dm-topics"
              role="group"
              aria-label="Topic"
              style={subjectVars(subject)}
            >
              {topicsOf(subject).map((t, i) => (
                <button
                  type="button"
                  key={t}
                  aria-pressed={t === topic}
                  onClick={() => setTopic(t)}
                >
                  <span className="k">{i + 1}</span>
                  {t}
                </button>
              ))}
            </div>
          </section>

          <section className="dm-step" aria-labelledby="dm-s3">
            <h2 id="dm-s3">
              <span className="n">3</span> Show it to the class
            </h2>
            <div className="dm-show">
              <a
                className="dm-board"
                href={labHref(subject)}
                target="_blank"
                rel="noopener"
              >
                <MonitorPlay size={22} aria-hidden="true" />
                Open {chosen.name} on the board
              </a>
              <p>
                The lab opens in a new tab. Choose <b>{topic}</b> from its topic
                list, then use the lab’s full screen button.
                {ticking
                  ? ' The lesson timer is running, so it shows in the lab’s top bar too.'
                  : ' Start the lesson timer first if you want it on the board as well.'}
              </p>
            </div>
          </section>
        </div>

        <aside className="dm-side" aria-label="Lesson tools">
          <section className="sd-card dm-card">
            <h2>
              <PenLine size={18} aria-hidden="true" /> Class practice paper
            </h2>
            <p>
              The same exam-style questions for everyone, shown on the board.
              Choose Paper 1 or Paper 2 and the number of questions on the next
              screen.
            </p>
            <label htmlFor="dm-paper">Subject</label>
            <div className="sd-select dm-select">
              <select
                id="dm-paper"
                value={paperSubject}
                onChange={(e) => setPaperSubject(e.target.value as SubjectKey)}
              >
                {SUBJECTS.map((s) => (
                  <option key={s.key} value={s.key}>
                    {s.name}
                  </option>
                ))}
              </select>
              <ChevronDown size={18} aria-hidden="true" />
            </div>
            <a
              className="sd-btn"
              href={labHref(paperSubject, '#exam')}
              target="_blank"
              rel="noopener"
            >
              <MonitorPlay size={18} aria-hidden="true" /> Project the paper
            </a>
            <p className="dm-later">
              Later, with accounts: students answer on their own phones and you
              see the class score.
            </p>
          </section>

          <section className="sd-card dm-card">
            <h2>
              <Clock size={18} aria-hidden="true" /> Lesson timer
            </h2>
            <div className="sd-timer">
              <strong
                className="sd-num"
                role="timer"
                aria-label={`${mm} minutes ${ss} seconds left`}
              >
                {mm}:{ss}
              </strong>
              <small>
                {seconds === 0
                  ? 'Time is up.'
                  : ticking
                    ? 'Shows on the board when you open a lab.'
                    : 'For an activity or a quick test.'}
              </small>
            </div>
            <div className="sd-len" role="group" aria-label="Timer length">
              {LESSON_LENGTHS.map((m) => (
                <button
                  type="button"
                  key={m}
                  aria-pressed={minutes === m}
                  disabled={ticking}
                  onClick={() => chooseLength(m)}
                >
                  {m} min
                </button>
              ))}
            </div>
            <div className="sd-timer-acts">
              <button
                type="button"
                className="sd-btn"
                onClick={() => {
                  if (ticking) setEndAt(null)
                  else {
                    const left = seconds === 0 ? minutes * 60 : seconds
                    setSeconds(left)
                    setEndAt(Date.now() + left * 1000)
                  }
                }}
              >
                {ticking ? (
                  <Pause size={18} aria-hidden="true" />
                ) : (
                  <Play size={18} aria-hidden="true" />
                )}
                {ticking ? 'Pause' : 'Start the timer'}
              </button>
              <button
                type="button"
                className="sd-btn ghost"
                aria-label="Reset timer"
                onClick={() => chooseLength(minutes)}
              >
                <RotateCcw size={18} />
              </button>
            </div>
          </section>
        </aside>
      </div>

      <Tasks />
    </>
  )
}

// Set a task on a syllabus topic and see who has done it. Changes last until "Restart demo".
function Tasks() {
  const [tasks, setTasks] = useState<Task[]>(TASKS)
  const [open, setOpen] = useState<string | null>(null)
  const [subject, setSubject] = useState<SubjectKey>('physics')
  const [topic, setTopic] = useState(topicsOf('physics')[0])
  const [className, setClassName] = useState(DEMO_CLASS)
  const [due, setDue] = useState(DUE_OPTIONS[1])

  return (
    <section className="dm-tasks" aria-labelledby="dm-tasks-h">
      <div className="sd-sec-h">
        <h2 id="dm-tasks-h">
          <ListChecks size={20} aria-hidden="true" /> Tasks
        </h2>
        <span>Set work on a syllabus topic and see who has done it</span>
      </div>

      <form
        className="sd-card dm-form"
        aria-label="Set a task"
        onSubmit={(e) => {
          e.preventDefault()
          setTasks((list) => [
            {
              id: `new-${list.length + 1}`,
              subject,
              topic,
              className,
              due,
              done: [],
            },
            ...list,
          ])
        }}
      >
        <div>
          <label htmlFor="dm-t-subject">Subject</label>
          <div className="sd-select dm-select">
            <select
              id="dm-t-subject"
              value={subject}
              onChange={(e) => {
                const key = e.target.value as SubjectKey
                setSubject(key)
                setTopic(topicsOf(key)[0])
              }}
            >
              {SUBJECTS.map((s) => (
                <option key={s.key} value={s.key}>
                  {s.name}
                </option>
              ))}
            </select>
            <ChevronDown size={18} aria-hidden="true" />
          </div>
        </div>
        <div className="wide">
          <label htmlFor="dm-t-topic">Topic</label>
          <div className="sd-select dm-select">
            <select
              id="dm-t-topic"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
            >
              {topicsOf(subject).map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
            <ChevronDown size={18} aria-hidden="true" />
          </div>
        </div>
        <div>
          <label htmlFor="dm-t-class">Class</label>
          <div className="sd-select dm-select">
            <select
              id="dm-t-class"
              value={className}
              onChange={(e) => setClassName(e.target.value)}
            >
              {CLASS_NAMES.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
            <ChevronDown size={18} aria-hidden="true" />
          </div>
        </div>
        <div>
          <label htmlFor="dm-t-due">Due</label>
          <div className="sd-select dm-select">
            <select
              id="dm-t-due"
              value={due}
              onChange={(e) => setDue(e.target.value)}
            >
              {DUE_OPTIONS.map((d) => (
                <option key={d}>{d}</option>
              ))}
            </select>
            <ChevronDown size={18} aria-hidden="true" />
          </div>
        </div>
        <button type="submit" className="sd-btn primary">
          <Plus size={18} aria-hidden="true" /> Set task
        </button>
      </form>

      <div className="dm-list-h">
        <h3>Tasks you have set</h3>
        <SampleTag />
      </div>
      <ul className="dm-tasklist" aria-label="Tasks you have set">
        {tasks.map((t) => {
          const total = STUDENTS.length
          const isOpen = open === t.id
          return (
            <li key={t.id} className="sd-card" style={subjectVars(t.subject)}>
              <div className="row">
                <div className="what">
                  <b>{t.topic}</b>
                  <span>
                    {subjectOf(t.subject).name} · {t.className} · due{' '}
                    {dueText(t.due)}
                  </span>
                </div>
                <div className="prog">
                  <span>
                    {t.done.length} of {total} done
                  </span>
                  <progress
                    max={total}
                    value={t.done.length}
                    aria-label={`${t.done.length} of ${total} students have done ${t.topic}`}
                  />
                </div>
                <button
                  type="button"
                  className="sd-btn ghost"
                  aria-expanded={isOpen}
                  onClick={() => setOpen(isOpen ? null : t.id)}
                >
                  {isOpen ? 'Hide the class' : 'See who has done it'}
                </button>
              </div>
              {isOpen && (
                <ul className="who" aria-label={`Class list for ${t.topic}`}>
                  {STUDENTS.map((s) => {
                    const done = t.done.includes(s.id)
                    return (
                      <li key={s.id} className={done ? 'done' : undefined}>
                        {s.name}
                        <span>{done ? 'Done' : 'Not yet'}</span>
                      </li>
                    )
                  })}
                </ul>
              )}
            </li>
          )
        })}
      </ul>
    </section>
  )
}
