import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useMemo, useState, type CSSProperties } from 'react'
import {
  Atom,
  BookOpen,
  Clock,
  FlaskConical,
  Globe,
  House,
  Leaf,
  PenLine,
  Pause,
  Play,
  RotateCcw,
  Search,
  Sigma,
  Sprout,
  Sun,
  Moon,
  X,
  type LucideIcon,
} from 'lucide-react'
import deskCss from '../desk.css?url'
import { formatFocus, parseFocus } from '../lib/focus'
import { findTopics, type SubjectKey } from '../lib/topics'

export const Route = createFileRoute('/')({
  head: () => ({ links: [{ rel: 'stylesheet', href: deskCss }] }),
  component: Home,
})

type Subject = {
  key: SubjectKey
  name: string
  facts: string[]
  path: string
  Icon: LucideIcon
}

const subjects: Subject[] = [
  {
    key: 'maths',
    name: 'Mathematics',
    facts: ['Core + Further', '94 simulations'],
    path: '/waec-maths-dashboard',
    Icon: Sigma,
  },
  {
    key: 'physics',
    name: 'Physics',
    facts: ['41 topics', '163 3D sim modes'],
    path: '/physics_lab_full',
    Icon: Atom,
  },
  {
    key: 'chemistry',
    name: 'Chemistry',
    facts: ['148 subtopics', '97 3D modules'],
    path: '/chemistry-simulations',
    Icon: FlaskConical,
  },
  {
    key: 'biology',
    name: 'Biology',
    facts: ['99 subtopics', '92 3D labs'],
    path: '/waec-biology-lab',
    Icon: Leaf,
  },
  {
    key: 'geography',
    name: 'Geography',
    facts: ['144 subtopics', '3D maps'],
    path: '/waec-geography-lab',
    Icon: Globe,
  },
  {
    key: 'agric',
    name: 'Agricultural Science',
    facts: ['274 subtopics', '196 3D farm labs'],
    path: '/waec-agric-lab',
    Icon: Sprout,
  },
]

const TRY = [
  'Photosynthesis',
  'Logarithms',
  'Refraction',
  'Titration',
  'Map work',
]
const LENGTHS = [15, 25, 45]

function Highlight({ text, q }: { text: string; q: string }) {
  const words = q.trim().split(/\s+/).filter(Boolean)
  if (!words.length) return <>{text}</>
  const re = new RegExp(
    `(${words.map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})`,
    'i',
  )
  // split() with one capture group puts the matched words at the odd positions
  return (
    <>
      {text
        .split(re)
        .map((part, i) => (i % 2 ? <mark key={i}>{part}</mark> : part))}
    </>
  )
}

function Home() {
  const [night, setNight] = useState(false)
  const [query, setQuery] = useState('')
  const [examSubject, setExamSubject] = useState<SubjectKey>('biology')
  const [minutes, setMinutes] = useState(25)
  const [seconds, setSeconds] = useState(25 * 60)
  // When the timer is running, the moment it reaches 0:00 (epoch ms); null when paused or stopped.
  const [endAt, setEndAt] = useState<number | null>(null)

  // Appearance and the focus timer follow the ?appearance= and ?focus= hand-off from the labs,
  // otherwise the device setting. Nothing is stored.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const param = params.get('appearance')
    // Browser-only values, read after hydration so the server and first client render match.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setNight(
      param
        ? param === 'night'
        : window.matchMedia('(prefers-color-scheme: dark)').matches,
    )
    const focus = parseFocus(params.get('focus'), Date.now())
    if (focus) {
      setMinutes(focus.minutes)
      setSeconds(focus.seconds)
      setEndAt(focus.endAt)
    }
  }, [])

  // While running, the display is worked out from the end time, so it stays right across page changes.
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

  // Keep the address bar in step, so a reload or the Back button picks the timer up again.
  const focus = formatFocus({ minutes, seconds, endAt })
  useEffect(() => {
    const url = new URL(window.location.href)
    if (focus) url.searchParams.set('focus', focus)
    else url.searchParams.delete('focus')
    if (url.href !== window.location.href)
      window.history.replaceState(window.history.state, '', url)
  }, [focus])

  const labHref = (path: string, hash = '') =>
    `${path}?appearance=${night ? 'night' : 'default'}${focus ? `&focus=${focus}` : ''}${hash}`

  const q = query.trim()
  const results = useMemo(
    () =>
      subjects
        .map((s) => ({ s, hits: q ? findTopics(s.key, q) : [] }))
        .filter(
          ({ s, hits }) =>
            !q || hits.length || s.name.toLowerCase().includes(q.toLowerCase()),
        ),
    [q],
  )

  const exam = subjects.find((s) => s.key === examSubject)!
  const mm = String(Math.floor(seconds / 60)).padStart(2, '0')
  const ss = String(seconds % 60).padStart(2, '0')

  function chooseLength(m: number) {
    setMinutes(m)
    setSeconds(m * 60)
    setEndAt(null)
  }

  return (
    <div className="sd" data-theme={night ? 'night' : 'day'}>
      <header className="sd-top">
        <a className="sd-brand" href={labHref('/')}>
          <img src="/favicon.svg" alt="" />
          <span>
            learnwith<b>nehy.</b>
          </span>
        </a>
        <nav className="sd-nav" aria-label="Main">
          <a href="#top" aria-current="page">
            Home
          </a>
          <a href="#subjects">Subjects</a>
          <a href="#practice">Exam practice</a>
          <a href="#focus">Focus timer</a>
        </nav>
        <div className="sd-theme" role="group" aria-label="Appearance">
          <button
            type="button"
            aria-label="Day"
            aria-pressed={!night}
            onClick={() => setNight(false)}
          >
            <Sun size={17} aria-hidden="true" />
            <span>Day</span>
          </button>
          <button
            type="button"
            aria-label="Night"
            aria-pressed={night}
            onClick={() => setNight(true)}
          >
            <Moon size={17} aria-hidden="true" />
            <span>Night</span>
          </button>
        </div>
      </header>

      <main className="sd-wrap" id="top">
        <div>
          <section className="sd-hello">
            <h1>What are you studying today?</h1>
            <p>
              Search any topic across six WAEC subjects, then learn it, see it
              in 3D and test yourself.
            </p>
            <form
              className="sd-search"
              role="search"
              onSubmit={(e) => {
                e.preventDefault()
                document.getElementById('subjects')?.scrollIntoView()
              }}
            >
              <Search size={22} aria-hidden="true" />
              <label className="sd-sr" htmlFor="sd-q">
                Search topics
              </label>
              <input
                id="sd-q"
                type="search"
                placeholder="Search a topic, e.g. photosynthesis, logarithms, refraction"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                autoComplete="off"
              />
              {query && (
                <button
                  type="button"
                  className="clear"
                  aria-label="Clear search"
                  onClick={() => setQuery('')}
                >
                  <X size={18} />
                </button>
              )}
            </form>
            <div className="sd-chips">
              Try:{' '}
              {TRY.map((t) => (
                <button type="button" key={t} onClick={() => setQuery(t)}>
                  {t}
                </button>
              ))}
            </div>
          </section>

          <div className="sd-sec-h" id="subjects">
            <h2>{q ? `Topics matching “${q}”` : 'Your subjects'}</h2>
            <span aria-live="polite">
              {q
                ? `${results.length} subject${results.length === 1 ? '' : 's'}`
                : 'Open a lab or go straight to exam practice'}
            </span>
          </div>
          <section className="sd-subjects">
            {results.map(({ s, hits }) => (
              <article
                key={s.key}
                className="sd-card sd-subj"
                style={
                  {
                    '--c': `var(--${s.key})`,
                    '--t': `var(--${s.key}-t)`,
                  } as CSSProperties
                }
              >
                <div className="row">
                  <span className="badge">
                    <s.Icon size={26} aria-hidden="true" />
                  </span>
                  <div>
                    <h3>{s.name}</h3>
                    <div className="facts">{s.facts.join(' · ')}</div>
                  </div>
                </div>
                {hits.length > 0 && (
                  <div className="topics">
                    {hits.map((h, i) => (
                      <span key={h}>
                        {i > 0 && ' · '}
                        <Highlight text={h} q={q} />
                      </span>
                    ))}
                  </div>
                )}
                <div className="acts">
                  <a className="open" href={labHref(s.path)}>
                    Open lab
                  </a>
                  <a className="exam" href={labHref(s.path, '#exam')}>
                    Practise
                  </a>
                </div>
              </article>
            ))}
            {!results.length && (
              <div className="sd-card sd-empty">
                <h3>No topics found</h3>
                <p>Try a shorter word, like “cell”, “circle” or “acid”.</p>
                <button
                  type="button"
                  className="sd-btn ghost"
                  onClick={() => setQuery('')}
                >
                  Show all subjects
                </button>
              </div>
            )}
          </section>

          <div className="sd-sec-h" id="practice">
            <h2>Quick exam practice</h2>
            <span>WAEC-style, timed, with worked solutions</span>
          </div>
          <form
            className="sd-card sd-quick"
            onSubmit={(e) => {
              e.preventDefault()
              window.location.href = labHref(exam.path, '#exam')
            }}
          >
            <div className="grow">
              <label htmlFor="sd-subject">Subject</label>
              <select
                id="sd-subject"
                value={examSubject}
                onChange={(e) => setExamSubject(e.target.value as SubjectKey)}
              >
                {subjects.map((s) => (
                  <option key={s.key} value={s.key}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
            <button type="submit" className="sd-btn primary">
              <Play size={18} aria-hidden="true" /> Start practice
            </button>
            <p>
              Choose Paper 1 or Paper 2 and the number of questions on the next
              screen. Your score stays on that page only.
            </p>
          </form>
        </div>

        <aside className="sd-side" aria-label="Study tools">
          <section className="sd-card" id="focus">
            <h2>
              <Clock size={18} aria-hidden="true" /> Focus timer
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
                  ? 'Well done. Take a 5 minute break.'
                  : ticking
                    ? 'Keeps running when you open a lab.'
                    : 'One topic, no distractions.'}
              </small>
            </div>
            <div className="sd-len" role="group" aria-label="Session length">
              {LENGTHS.map((m) => (
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
                {ticking
                  ? 'Pause'
                  : seconds === 0
                    ? 'Start again'
                    : seconds < minutes * 60
                      ? 'Resume'
                      : 'Start a session'}
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
          <section className="sd-card">
            <h2>How to use a topic</h2>
            <ol className="sd-steps">
              <li>
                <span className="n">1</span>
                <div>
                  <b>Read the notes</b>Syllabus points and examiner’s tips
                </div>
              </li>
              <li>
                <span className="n">2</span>
                <div>
                  <b>Try the 3D lab</b>Move the sliders and watch it change
                </div>
              </li>
              <li>
                <span className="n">3</span>
                <div>
                  <b>Test yourself</b>Fresh questions every time
                </div>
              </li>
            </ol>
          </section>
        </aside>

        <footer className="sd-foot">
          <span>Independent study companion. Not affiliated with WAEC.</span>
          <span>Six subjects · full WAEC syllabus</span>
        </footer>
      </main>

      <nav className="sd-tabbar" aria-label="Main">
        <a href="#top" aria-current="page">
          <House size={22} aria-hidden="true" />
          Home
        </a>
        <a href="#subjects">
          <BookOpen size={22} aria-hidden="true" />
          Subjects
        </a>
        <a href="#practice">
          <PenLine size={22} aria-hidden="true" />
          Practice
        </a>
        <a href="#focus">
          <Clock size={22} aria-hidden="true" />
          Timer
        </a>
      </nav>
    </div>
  )
}
