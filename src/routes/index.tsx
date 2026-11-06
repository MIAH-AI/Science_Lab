import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useState, type CSSProperties } from 'react'
import {
  ArrowRight,
  Atom,
  BookOpen,
  Check,
  ChevronRight,
  CircleQuestionMark,
  FlaskConical,
  GraduationCap,
  Grid2x2,
  Menu,
  Moon,
  Pause,
  Play,
  RotateCcw,
  Search,
  Sparkles,
  Sun,
  Timer,
  WavesHorizontal,
  X,
  type LucideIcon,
} from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@/components/ui/dialog'

export const Route = createFileRoute('/')({
  component: Home,
})

type Subject = {
  name: string
  code: string
  category: string
  description: string
  stats: string[]
  path: string
  color: 'violet' | 'peach' | 'mint'
  icon: 'ƒ' | 'atom' | 'flask'
  topics: string
  Icon: LucideIcon
}

const LAB_ORIGIN = ''
const FOCUS_SECONDS = 1500

const subjects: Subject[] = [
  {
    name: 'Core Mathematics',
    code: 'MATH',
    category: 'The language of possibilities',
    description:
      'From numbers and algebra to vectors. Build your understanding, one problem at a time.',
    stats: ['9 topic areas', '52 subtopics', '17 simulations'],
    path: '/waec-maths-dashboard',
    color: 'violet',
    icon: 'ƒ',
    topics: 'Algebra · Geometry · Statistics',
    Icon: BookOpen,
  },
  {
    name: 'Physics',
    code: 'PHYS',
    category: 'Discover the why behind everything',
    description:
      'Explore motion, energy, and the laws of our universe through hands-on experiments.',
    stats: ['Full syllabus', '83+ sim modes', 'Interactive canvas'],
    path: '/physics_lab_full',
    color: 'peach',
    icon: 'atom',
    topics: 'Mechanics · Waves · Electricity',
    Icon: Atom,
  },
  {
    name: 'Chemistry',
    code: 'CHEM',
    category: 'Small particles. Big discoveries.',
    description:
      'Step inside the world of atoms, reactions, and the elements that make up everything.',
    stats: ['46 subtopics', '20 sim modules', 'Virtual lab'],
    path: '/chemistry-simulations',
    color: 'mint',
    icon: 'flask',
    topics: 'Atomic theory · Reactions · Elements',
    Icon: FlaskConical,
  },
]

const navItems: [LucideIcon, string][] = [
  [Grid2x2, 'Overview'],
  [BookOpen, 'My subjects'],
  [Atom, 'Simulations'],
]

function Home() {
  const [night, setNight] = useState(false)
  useEffect(() => {
    setNight(new URLSearchParams(window.location.search).get('appearance') === 'night')
  }, [])
  const labHref = (path: string) =>
    `${LAB_ORIGIN}${path}?appearance=${night ? 'night' : 'default'}`

  const [view, setView] = useState('Overview')
  const [query, setQuery] = useState('')
  const [menuOpen, setMenuOpen] = useState(false)
  const [helpOpen, setHelpOpen] = useState(false)
  const [running, setRunning] = useState(false)
  const [seconds, setSeconds] = useState(FOCUS_SECONDS)

  useEffect(() => {
    if (!running) return
    if (seconds === 0) {
      setRunning(false)
      return
    }
    const id = window.setTimeout(() => setSeconds(seconds - 1), 1000)
    return () => window.clearTimeout(id)
  }, [running, seconds])

  const visible = subjects.filter((s) =>
    (s.name + ' ' + s.topics).toLowerCase().includes(query.toLowerCase()),
  )

  function navigate(next: string) {
    setView(next)
    setMenuOpen(false)
    setQuery('')
  }

  return (
    <div className={`workspace ${night ? 'night' : ''}`}>
      <div className="ambient" aria-hidden="true" />
      <div className="app-shell">
        {menuOpen && (
          <button
            className="mobile-backdrop"
            aria-label="Close navigation"
            onClick={() => setMenuOpen(false)}
          />
        )}
        <aside className={`sidebar glass ${menuOpen ? 'is-open' : ''}`}>
          <a href="/" className="brand">
            <span className="brand-mark">
              <GraduationCap size={25} />
            </span>
            <span>
              learnwith
              <span className="brand-name">
                nehy<span className="brand-dot">.</span>
              </span>
            </span>
          </a>
          <div className="sidebar-label">YOUR LEARNING SPACE</div>
          <nav className="primary-nav" aria-label="Main navigation">
            {navItems.map(([Icon, label]) => (
              <button
                key={label}
                className={view === label ? 'nav-item selected' : 'nav-item'}
                aria-current={view === label ? 'page' : undefined}
                onClick={() => navigate(label)}
              >
                <Icon size={19} />
                <span>{label}</span>
                {label === 'My subjects' && <small>3</small>}
                {view === label && <span className="nav-dot" />}
              </button>
            ))}
          </nav>
          <div className="sidebar-label subject-label">EXPLORE SUBJECTS</div>
          <nav className="subject-nav" aria-label="Subjects">
            {subjects.map((s) => (
              <a key={s.code} href={labHref(s.path)}>
                <span className={`tiny-icon ${s.color}`}>
                  <s.Icon size={15} />
                </span>
                {s.name}
                <ChevronRight size={14} />
              </a>
            ))}
          </nav>
          <div className="sidebar-bottom">
            <div className="little-note">
              <span className="little-spark">
                <Sparkles size={21} />
              </span>
              <h3>
                A little every day.
                <br />A lot over time.
              </h3>
              <p>
                Your next discovery is just
                <br />
                one lesson away.
              </p>
              <a href="#subjects" onClick={() => navigate('My subjects')}>
                Find your next lesson <ArrowRight size={14} />
              </a>
            </div>
            <button className="help-link" onClick={() => setHelpOpen(true)}>
              <CircleQuestionMark size={18} /> A little guidance <ChevronRight size={15} />
            </button>
            <div className="student">
              <div className="avatar">N</div>
              <div>
                <strong>Your learning space</strong>
                <span>WAEC study companion</span>
              </div>
              <span className="online-dot" />
            </div>
          </div>
        </aside>

        <div className="main-shell">
          <header className="topbar">
            <div className="breadcrumb">
              <button
                className="mobile-menu icon-button"
                aria-label="Open navigation"
                onClick={() => setMenuOpen(true)}
              >
                <Menu size={20} />
              </button>
              <span>My workspace</span>
              <ChevronRight size={13} />
              <strong>{view}</strong>
            </div>
            <div className="top-actions">
              <span className="syllabus-pill">
                <span /> WAEC syllabus
              </span>
              <div className="theme-switch" aria-label="Appearance">
                <button
                  className={night ? '' : 'active'}
                  aria-label="Day mode"
                  aria-pressed={!night}
                  onClick={() => setNight(false)}
                >
                  <Sun size={15} />
                  <span>Light</span>
                </button>
                <button
                  className={night ? 'active' : ''}
                  aria-label="Night mode"
                  aria-pressed={night}
                  onClick={() => setNight(true)}
                >
                  <Moon size={15} />
                  <span>Dark</span>
                </button>
              </div>
              <span className="top-avatar">N</span>
            </div>
          </header>

          <div className="page-grid">
            <main>
              <div className="page-heading">
                <div>
                  <div className="eyebrow">A FRESH PAGE, A NEW POSSIBILITY</div>
                  <h1>
                    Your space to <span>grow.</span>
                  </h1>
                  <p>A curious mind is all you need. Let’s learn something today.</p>
                </div>
                <span className="welcome-spark" aria-hidden="true">
                  ✳
                </span>
              </div>

              <section className="hero glass">
                <div className="hero-copy">
                  <div className="hero-tag">
                    <span /> MADE FOR YOUR NEXT AHA! MOMENT
                  </div>
                  <h2>
                    Big ideas.
                    <br />
                    Brighter futures.
                  </h2>
                  <p>
                    Your entire WAEC syllabus, brought to life.
                    <br />
                    Explore, experiment, and make it click.
                  </p>
                  <a
                    className="primary-button"
                    href="#subjects"
                    onClick={() => navigate('My subjects')}
                  >
                    Explore your subjects <ArrowRight size={17} />
                  </a>
                  <div className="hero-caption">
                    <Check size={13} /> No installs. Just possibilities.
                  </div>
                </div>
                <div className="hero-art" aria-hidden="true">
                  <div className="orbit orbit-one" />
                  <div className="orbit orbit-two" />
                  <div className="orb">
                    <GraduationCap size={77} strokeWidth={1.25} />
                  </div>
                  <span className="floating-tile formula">
                    ƒ<span> x</span>
                  </span>
                  <span className="floating-tile atom">
                    <Atom size={33} />
                  </span>
                  <span className="floating-tile flask">
                    <FlaskConical size={29} />
                  </span>
                  <span className="art-dot one" />
                  <span className="art-dot two" />
                  <span className="art-star">✧</span>
                </div>
              </section>

              <div className="quick-stats">
                <div>
                  <span className="stat-icon">
                    <BookOpen size={18} />
                  </span>
                  <strong>3</strong>
                  <span>subjects to explore</span>
                </div>
                <div>
                  <span className="stat-icon">
                    <Atom size={18} />
                  </span>
                  <strong>120+</strong>
                  <span>interactive simulations</span>
                </div>
                <div>
                  <span className="stat-icon">
                    <GraduationCap size={19} />
                  </span>
                  <strong>WAEC</strong>
                  <span>aligned learning</span>
                </div>
              </div>

              <section id="subjects" className="subjects-section">
                <div className="section-header">
                  <div>
                    <h2>
                      {view === 'Simulations' ? 'Your virtual labs' : 'Your subjects'}{' '}
                      <span>03</span>
                    </h2>
                    <p>
                      {view === 'Simulations'
                        ? 'Learn by doing. Open a subject to explore its simulations.'
                        : 'Choose a subject. Follow your curiosity.'}
                    </p>
                  </div>
                  <label className="search">
                    <Search size={16} />
                    <input
                      aria-label="Search subjects"
                      placeholder="Find a subject..."
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                    />
                    {query && (
                      <button aria-label="Clear search" onClick={() => setQuery('')}>
                        <X size={13} />
                      </button>
                    )}
                  </label>
                </div>
                <div className="subject-list">
                  {visible.map((s, i) => (
                    <a
                      key={s.code}
                      className={`subject-card glass ${s.color}`}
                      href={labHref(s.path)}
                      style={{ animationDelay: `${i * 80}ms` }}
                    >
                      <span className="subject-art" aria-hidden="true">
                        {s.icon === 'ƒ' ? (
                          <span className="math-symbol">
                            ƒ<span>x</span>
                          </span>
                        ) : s.icon === 'atom' ? (
                          <Atom size={46} strokeWidth={1.4} />
                        ) : (
                          <FlaskConical size={43} strokeWidth={1.5} />
                        )}
                      </span>
                      <div className="subject-info">
                        <div className="subject-code">
                          {s.code}
                          <span>{s.category}</span>
                        </div>
                        <h3>{s.name}</h3>
                        <p>{s.description}</p>
                        <div className="subject-stats">
                          {s.stats.map((stat) => (
                            <span key={stat}>{stat}</span>
                          ))}
                        </div>
                      </div>
                      <span className="open-subject">
                        <ArrowRight size={20} />
                      </span>
                    </a>
                  ))}
                  {!visible.length && (
                    <div className="empty-state">
                      <Search size={25} />
                      <h3>No subjects found</h3>
                      <p>Try mathematics, physics, chemistry, or a topic like algebra.</p>
                      <button onClick={() => setQuery('')}>Show all subjects</button>
                    </div>
                  )}
                </div>
              </section>

              <footer>
                <span>Built for curious minds. Made for your future.</span>
                <span>Independent study companion · Not affiliated with WAEC</span>
              </footer>
            </main>

            <aside className="right-sidebar" aria-label="Study tools">
              <section className="focus-card glass">
                <div className="panel-title">
                  <span>
                    <Timer size={17} /> A moment to focus
                  </span>
                  <span className="mini-dot" />
                </div>
                <p>Small sessions. Meaningful progress.</p>
                <div
                  className={`timer-ring ${running ? 'is-running' : ''}`}
                  style={
                    { '--progress': `${(seconds / FOCUS_SECONDS) * 100}%` } as CSSProperties
                  }
                >
                  <div>
                    <span className="timer-caption">
                      {seconds === 0
                        ? 'WELL DONE'
                        : running
                          ? 'YOU’VE GOT THIS'
                          : 'YOUR FOCUS TIME'}
                    </span>
                    <strong role="timer" aria-label="Focus time remaining">
                      {String(Math.floor(seconds / 60)).padStart(2, '0')}
                      <span>:</span>
                      {String(seconds % 60).padStart(2, '0')}
                    </strong>
                    <span className="timer-sub">
                      {seconds === 0 ? 'Take a well-earned break' : 'One thing at a time'}
                    </span>
                  </div>
                </div>
                <div className="timer-actions">
                  <button
                    className="focus-button"
                    onClick={() => {
                      if (!seconds) setSeconds(FOCUS_SECONDS)
                      setRunning(!running)
                    }}
                  >
                    {running ? <Pause size={15} /> : <Play size={15} />}{' '}
                    {running ? 'Pause session' : seconds === 0 ? 'Start again' : 'Start focusing'}
                  </button>
                  <button
                    className="reset-button"
                    aria-label="Reset focus timer"
                    onClick={() => {
                      setRunning(false)
                      setSeconds(FOCUS_SECONDS)
                    }}
                  >
                    <RotateCcw size={16} />
                  </button>
                </div>
                <div className="focus-footer">
                  <span />
                  <span>25 min focus</span>
                  <i />
                  <span>5 min break after</span>
                </div>
              </section>

              <section className="path-card glass">
                <div className="panel-title">
                  <span>
                    <BookOpen size={17} /> Your learning toolkit
                  </span>
                </div>
                <div className="tool-row">
                  <span className="tool-icon">
                    <BookOpen size={17} />
                  </span>
                  <div>
                    <strong>Understand the concepts</strong>
                    <p>Clear topics, at your own pace</p>
                  </div>
                </div>
                <div className="tool-row">
                  <span className="tool-icon">
                    <WavesHorizontal size={17} />
                  </span>
                  <div>
                    <strong>See it in action</strong>
                    <p>Try interactive simulations</p>
                  </div>
                </div>
                <div className="tool-row">
                  <span className="tool-icon">
                    <Check size={18} />
                  </span>
                  <div>
                    <strong>Connect the dots</strong>
                    <p>Learn through worked examples</p>
                  </div>
                </div>
                <a href={labHref('/waec-maths-dashboard')}>
                  Start with Mathematics <ArrowRight size={15} />
                </a>
              </section>

              <div className="quote-card">
                <span className="quote-mark">“</span>
                <blockquote>
                  The beautiful thing about learning is that nobody can take it away from
                  you.
                </blockquote>
                <span className="quote-author">— B. B. KING</span>
                <div className="quote-decor" aria-hidden="true">
                  <Sparkles size={25} />
                </div>
              </div>
              <div className="right-foot">
                <span className="live-dot" /> A calmer place to learn.
              </div>
            </aside>
          </div>
        </div>
      </div>

      <Dialog open={helpOpen} onOpenChange={setHelpOpen}>
        <DialogContent className="guidance-dialog">
          <DialogTitle>Make yourself at home.</DialogTitle>
          <DialogDescription>
            Choose Mathematics, Physics, or Chemistry to open its Learn with Nehy study lab.
            Each subject includes syllabus topics and interactive simulations. Use the focus
            timer for a distraction-free 25-minute session, and switch between Light and Dark
            to find your comfortable setting.
          </DialogDescription>
        </DialogContent>
      </Dialog>
    </div>
  )
}
