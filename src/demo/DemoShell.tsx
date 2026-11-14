import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react'
import { LogOut, Moon, RotateCcw, Sun } from 'lucide-react'
import { ROLES, SCHOOL, roleHref, type RoleKey } from './data'

// Day is the default, like the front page; Night comes from ?appearance=night when a page handed it over.
// Switching rewrites the address, so a reload or a shared link keeps the choice. Nothing is stored.
export function useAppearance() {
  const [night, setNightState] = useState(false)
  useEffect(() => {
    const param = new URLSearchParams(window.location.search).get('appearance')
    // Browser-only value, read after hydration so the server and first client render match.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setNightState(param === 'night')
  }, [])
  const setNight = (value: boolean) => {
    setNightState(value)
    const url = new URL(window.location.href)
    url.searchParams.set('appearance', value ? 'night' : 'default')
    window.history.replaceState(window.history.state, '', url)
  }
  return [night, setNight] as const
}

// The screens inside the shell need Day or Night for the lab links they build.
const Night = createContext(false)
export const useDemoNight = () => useContext(Night)

export function SampleTag() {
  return <span className="dm-sample">Sample data</span>
}

// The bar every demo screen carries: it says this is a demo with sample data, names the role,
// and lets the visitor change role, start again or leave.
export function DemoBar({
  role,
  night,
  onRestart,
}: {
  role: RoleKey
  night: boolean
  onRestart: () => void
}) {
  const current = ROLES.find((r) => r.key === role)!
  return (
    <aside className="dm-bar" aria-label="Demo">
      <div className="dm-bar-in">
        <p className="dm-bar-what">
          <strong>Demo · sample data</strong>
          <span>
            You are viewing as <b>{current.label}</b>
            {role === 'student' ? '' : ` at ${SCHOOL.name}`}. Nothing you do
            here is saved.
          </span>
        </p>
        <nav className="dm-roles" aria-label="Demo roles">
          {ROLES.map((r) => (
            <a
              key={r.key}
              href={roleHref(r.key, night)}
              aria-current={r.key === role ? 'page' : undefined}
            >
              {r.label}
            </a>
          ))}
        </nav>
        <div className="dm-bar-acts">
          <button type="button" onClick={onRestart}>
            <RotateCcw size={15} aria-hidden="true" /> Restart demo
          </button>
          <a href="/">
            <LogOut size={15} aria-hidden="true" /> Exit demo
          </a>
        </div>
      </div>
    </aside>
  )
}

// Page frame for the school-role screens, in the Study Desk style.
// "Restart demo" remounts the screen, which puts every change the visitor made back to the sample data.
export function DemoShell({
  role,
  children,
}: {
  role: RoleKey
  children: ReactNode
}) {
  const [night, setNight] = useAppearance()
  const [run, setRun] = useState(0)
  return (
    <div className="sd dm" data-theme={night ? 'night' : 'day'}>
      <header className="sd-top">
        <a className="sd-brand" href="/">
          <img src={night ? '/brand/icon-dark.svg' : '/favicon.svg'} alt="" />
          <span>
            tough<b>2</b>simple
          </span>
        </a>
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
      <DemoBar
        role={role}
        night={night}
        onRestart={() => setRun((n) => n + 1)}
      />
      <Night.Provider value={night}>
        <main className="dm-wrap" key={run}>
          {children}
        </main>
      </Night.Provider>
      <footer className="dm-foot">
        <span>
          This is a demo with a made-up school. The people and figures are
          samples, and nothing is sent anywhere.
        </span>
        <span>Independent study companion. Not affiliated with WAEC.</span>
      </footer>
    </div>
  )
}
