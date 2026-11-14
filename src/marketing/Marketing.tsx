// The public front page, in three designs. The site setting MARKETING_DESIGN (a, b or c) picks which one
// visitors see; see src/routes/index.tsx. All three share the words and pictures in ./content.
import { useMemo, useState, type CSSProperties } from 'react'
import { ArrowRight, Search } from 'lucide-react'
import { findTopics } from '../lib/topics'
import {
  SMALL_PRINT,
  TRY,
  roles,
  school,
  steps,
  subjects,
  type Design,
  type Subject,
} from './content'

const tone = (s: Subject) =>
  ({ '--c': s.colour, '--t': s.tint }) as CSSProperties

function Logo({ dark = false }: { dark?: boolean }) {
  return (
    <a className="mp-logo" href="/" aria-label="tough2simple home">
      <img
        src={dark ? '/brand/icon-dark.svg' : '/favicon.svg'}
        alt=""
        width="34"
        height="34"
      />
      <span>
        tough<b>2</b>simple
      </span>
    </a>
  )
}

function Footer() {
  return (
    <footer className="mp-foot">
      <div className="mp-wrap">
        <span>{SMALL_PRINT}</span>
        <nav aria-label="Footer">
          <a href="/demo">Try the demo</a>
          <a href="/app">Study desk</a>
        </nav>
      </div>
    </footer>
  )
}

const stateClass = (state: string) => (state === 'Ready' ? 'ok' : 'pv')

/* ------------------------------------------------------------------ A: the product is the pitch */
function DesignA() {
  return (
    <div className="mp mp-a">
      <div className="mp-wrap">
        <header className="mp-top">
          <Logo />
          <nav aria-label="Main">
            <a href="#subjects">Subjects</a>
            <a href="#how">How it works</a>
            <a href="#schools">For schools</a>
          </nav>
          <a className="mp-btn pri small" href="/demo">
            Try the demo
          </a>
        </header>
        <main>
          <section className="hero">
            <div>
              <p className="eyebrow">Six subjects · 3D labs · exam practice</p>
              <h1>
                Tough topics, made <i>simple.</i>
              </h1>
              <p className="lead">
                Read the notes, see the idea move in 3D, then test yourself with
                exam-style questions.
              </p>
              <div className="cta">
                <a className="mp-btn pri" href="/demo">
                  Try the demo
                </a>
                <a className="mp-btn sec" href="#subjects">
                  See the subjects
                </a>
              </div>
              <small>No sign-up needed to try it.</small>
            </div>
            <div className="frame">
              <div className="desk">
                <img
                  src="/marketing/home.webp"
                  width="1280"
                  height="800"
                  fetchPriority="high"
                  alt="The tough2simple study desk: a search box, six subject cards and a focus timer"
                />
              </div>
              <div className="phone">
                <img
                  src="/marketing/phone.webp"
                  width="560"
                  height="1120"
                  alt="The same study desk on a phone"
                />
              </div>
            </div>
          </section>
        </main>
      </div>

      <section id="subjects">
        <div className="mp-wrap">
          <div className="head">
            <h2>Six subjects on one desk</h2>
            <p>
              Senior secondary topics, one by one, with a lab for the parts that
              are hard to picture.
            </p>
          </div>
          <div className="subs">
            {subjects.map((s) => (
              <a className="sub" key={s.key} href={s.path} style={tone(s)}>
                <h3>{s.name}</h3>
                <p>{s.facts}</p>
                <span>
                  Open the lab <ArrowRight size={16} aria-hidden="true" />
                </span>
              </a>
            ))}
          </div>
        </div>
      </section>

      <section id="how" className="how">
        <div className="mp-wrap">
          <div className="head">
            <h2>How a topic works</h2>
            <p>The same three steps for every topic, in every subject.</p>
          </div>
          <ol className="steps">
            {steps.map((s, i) => (
              <li key={s.title}>
                <div className="shot">
                  <img
                    src={s.shot}
                    alt={s.shotAlt}
                    loading="lazy"
                    width="1100"
                    height="688"
                  />
                </div>
                <b>{i + 1}</b>
                <h3>{s.title}</h3>
                <p>{s.text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section id="roles">
        <div className="mp-wrap">
          <div className="head">
            <h2>Try it in your own role</h2>
            <p>
              Open the demo as a student, a teacher or a school leader. The
              school roles use a sample school with sample data.
            </p>
          </div>
          <div className="roles">
            {roles.map((r) => (
              <a className="role" key={r.key} href={r.path}>
                <h3>{r.name}</h3>
                <p>{r.does}</p>
                <em>
                  Try as {r.name} <ArrowRight size={15} aria-hidden="true" />
                </em>
              </a>
            ))}
          </div>
        </div>
      </section>

      <section id="schools" className="flush">
        <div className="mp-wrap">
          <div className="school">
            <div>
              <h2>Made for schools where the internet comes and goes</h2>
              <p>
                Students save a lab once and it opens without a connection. A
                campus version that runs on a school’s own server is being
                built.
              </p>
              <a className="mp-btn lime" href="/demo">
                Try the school demo
              </a>
            </div>
            <ul>
              {school.map((x) => (
                <li key={x.title}>
                  <b>
                    {x.title}{' '}
                    <span className={`mp-tag ${stateClass(x.state)}`}>
                      {x.state}
                    </span>
                  </b>
                  <span>{x.text}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>
      <Footer />
    </div>
  )
}

/* ------------------------------------------------------------------ B: tough 2 simple */
function DesignB() {
  const [example, setExample] = useState('physics')
  const [roleKey, setRoleKey] = useState('student')
  const ex = subjects.find((s) => s.key === example)!
  const role = roles.find((r) => r.key === roleKey)!
  return (
    <div className="mp mp-b">
      <div className="mp-wrap">
        <header className="mp-top">
          <Logo dark />
          <nav aria-label="Main">
            <a href="#subjects">Subjects</a>
            <a href="#roles">Pick your role</a>
          </nav>
          <a className="mp-btn lime small" href="/demo">
            Try the demo
          </a>
        </header>
        <main className="hero">
          <h1>
            Every topic, from tough <b>2</b> simple.
          </h1>
          <p className="lead">
            The syllabus tells you what to know. We show it to you: 3D labs,
            plain notes and exam practice for six senior secondary subjects.
          </p>
          <div className="cta">
            <a className="mp-btn lime" href="/demo">
              Try the demo
            </a>
            <a className="mp-btn ghost" href="#roles">
              Pick your role
            </a>
          </div>
          <div className="ba">
            <div>
              <div className="lab">Tough · on paper</div>
              <div className="tough">
                <strong>{ex.topic}</strong>
                {ex.onPaper}
              </div>
            </div>
            <div className="two" aria-hidden="true">
              2
            </div>
            <div>
              <div className="lab">Simple · in the lab</div>
              <a className="simple" href={ex.path}>
                <img
                  src={ex.shot}
                  alt={ex.shotAlt}
                  width="1100"
                  height="688"
                  fetchPriority="high"
                />
              </a>
            </div>
          </div>
          <div className="chips" role="group" aria-label="Choose an example">
            {subjects.map((s) => (
              <button
                type="button"
                key={s.key}
                aria-pressed={s.key === example}
                onClick={() => setExample(s.key)}
              >
                {s.topic}
              </button>
            ))}
          </div>
        </main>
      </div>

      <div className="paper">
        <div className="mp-wrap">
          <section id="roles">
            <h2>Who is trying it today?</h2>
            <div className="who">
              <div className="tabs" role="group" aria-label="Choose a role">
                {roles.map((r) => (
                  <button
                    type="button"
                    key={r.key}
                    aria-pressed={r.key === roleKey}
                    onClick={() => setRoleKey(r.key)}
                  >
                    {r.name}
                  </button>
                ))}
              </div>
              <div className="panel" aria-live="polite">
                <h3>{role.name}</h3>
                <p>{role.does}</p>
                <a className="mp-btn pri" href={role.path}>
                  Open the demo as {role.name}
                </a>
                <small>
                  No sign-up. School roles use a sample school with sample data.
                </small>
              </div>
            </div>
          </section>

          <section id="subjects">
            <h2>Six subjects, topic by topic</h2>
            <div className="rows">
              {subjects.map((s) => (
                <a className="row" key={s.key} href={s.path} style={tone(s)}>
                  <i aria-hidden="true" />
                  <h3>{s.name}</h3>
                  <span>{s.facts}</span>
                  <b>
                    Open <ArrowRight size={16} aria-hidden="true" />
                  </b>
                </a>
              ))}
            </div>
          </section>

          <section id="how">
            <h2>Three steps, every topic</h2>
            <ol className="steps">
              {steps.map((s, i) => (
                <li key={s.title}>
                  <b aria-hidden="true">0{i + 1}</b>
                  <h3>{s.title}</h3>
                  <p>{s.text}</p>
                </li>
              ))}
            </ol>
          </section>
        </div>
        <section className="end">
          <div className="mp-wrap">
            <h2>Pick the topic you have been avoiding.</h2>
            <a className="mp-btn pri" href="/demo">
              Try the demo
            </a>
          </div>
        </section>
        <Footer />
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ C: start with your topic */
function DesignC() {
  const [query, setQuery] = useState('')
  const q = query.trim()
  const hits = useMemo(
    () =>
      q
        ? subjects
            .map((s) => ({ s, topics: findTopics(s.key, q) }))
            .filter(
              ({ s, topics }) =>
                topics.length || s.name.toLowerCase().includes(q.toLowerCase()),
            )
        : [],
    [q],
  )
  return (
    <div className="mp mp-c">
      <div className="mp-wrap">
        <header className="mp-top">
          <Logo />
          <nav aria-label="Main">
            <a href="#subjects">Subjects</a>
            <a href="#schools">For schools</a>
          </nav>
          <a className="mp-btn pri small" href="/demo">
            Try the demo
          </a>
        </header>
        <main className="hero">
          <div>
            <h1>Which topic is giving you trouble?</h1>
            <form
              className="q"
              role="search"
              onSubmit={(e) => e.preventDefault()}
            >
              <Search size={24} aria-hidden="true" />
              <label className="mp-sr" htmlFor="mp-q">
                Search every subject for a topic
              </label>
              <input
                id="mp-q"
                type="search"
                placeholder="Type a topic, e.g. titration"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                autoComplete="off"
              />
            </form>
            <div className="try">
              Try:{' '}
              {TRY.map((t) => (
                <button type="button" key={t} onClick={() => setQuery(t)}>
                  {t}
                </button>
              ))}
            </div>
            <p className="lead">
              One search covers six senior secondary subjects. Every topic has
              plain notes, a lab you can move, and exam practice.
            </p>
          </div>
          <div className="res" aria-live="polite">
            {!q && (
              <>
                <div className="k">Inside a lab</div>
                <a href="/chemistry-simulations">
                  <img
                    src="/marketing/chemistry.webp"
                    width="1100"
                    height="688"
                    fetchPriority="high"
                    alt="The Chemistry lab: a measuring cylinder on a bench that you read at eye level"
                  />
                </a>
                <p className="cap">
                  Chemistry · reading a measuring cylinder. Type a topic to find
                  its lab.
                </p>
              </>
            )}
            {q && (
              <>
                <div className="k">
                  {hits.length
                    ? `${hits.length} subject${hits.length === 1 ? '' : 's'} match “${q}”`
                    : `Nothing matches “${q}”`}
                </div>
                {hits.map(({ s, topics }) => (
                  <a className="hit" key={s.key} href={s.path} style={tone(s)}>
                    <span className="dot" aria-hidden="true">
                      {s.name.slice(0, 2)}
                    </span>
                    <span className="what">
                      <b>{s.name}</b>
                      <small>{topics.join(' · ') || s.facts}</small>
                    </span>
                    <em>
                      Open lab <ArrowRight size={15} aria-hidden="true" />
                    </em>
                  </a>
                ))}
                {!hits.length && (
                  <p className="cap">
                    Try a shorter word, like “cell”, “circle” or “acid”.
                  </p>
                )}
              </>
            )}
          </div>
        </main>
      </div>

      <section id="subjects" aria-label="Subjects">
        {subjects.map((s, i) => (
          <div
            className={`band${i % 2 ? ' flip' : ''}`}
            key={s.key}
            style={tone(s)}
          >
            <div className="mp-wrap">
              <div className="txt">
                <div className="num" aria-hidden="true">
                  0{i + 1}
                </div>
                <h2>{s.name}</h2>
                <p>{s.facts}</p>
                <a className="mp-btn" href={s.path}>
                  Open {s.name} <ArrowRight size={17} aria-hidden="true" />
                </a>
              </div>
              <a className="pic" href={s.path} tabIndex={-1} aria-hidden="true">
                <img
                  src={s.shot}
                  alt=""
                  loading="lazy"
                  width="1100"
                  height="688"
                />
              </a>
            </div>
          </div>
        ))}
      </section>

      <section id="schools" className="schools">
        <div className="mp-wrap">
          <div>
            <h2>For schools where the internet comes and goes</h2>
            <p>
              Students save a lab once and it opens with no connection. Tools
              for teachers and school leaders are in development, and you can
              preview them in the demo.
            </p>
          </div>
          <ul>
            {school.map((x) => (
              <li key={x.title}>
                <span>
                  <b>{x.title}</b>
                  {x.text}
                </span>
                <span className={`mp-tag ${stateClass(x.state)}`}>
                  {x.state}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </section>
      <Footer />
      <nav className="dock" aria-label="Try the demo as">
        <span>Try the demo as</span>
        {roles.map((r) => (
          <a
            key={r.key}
            href={r.path}
            className={r.key === 'student' ? 'on' : ''}
          >
            {r.name}
          </a>
        ))}
      </nav>
    </div>
  )
}

export function Marketing({ design }: { design: Design }) {
  if (design === 'a') return <DesignA />
  if (design === 'b') return <DesignB />
  return <DesignC />
}
