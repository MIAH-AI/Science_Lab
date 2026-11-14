import { ArrowRight, Moon, Sun } from 'lucide-react'
import { useAppearance } from './DemoShell'
import { ROLES, SCHOOL, roleHref } from './data'

// /demo: choose the role to try. No sign-up; the role travels in the address.
export function Chooser() {
  const [night, setNight] = useAppearance()
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
      <main className="dm-wrap dm-choose">
        <div className="dm-head">
          <h1>Who is trying it today?</h1>
          <p>
            Choose a role and look around. There is no sign-up. The student view
            is the real study desk and labs. The school views use a made-up
            school, {SCHOOL.name}, with sample people and figures.
          </p>
        </div>
        <ul className="dm-rolecards" aria-label="Roles">
          {ROLES.map((r) => (
            <li key={r.key}>
              <a className="sd-card" href={roleHref(r.key, night)}>
                <span className="dm-sample">
                  {r.key === 'student' ? 'The real app' : 'Sample school'}
                </span>
                <h2>{r.label}</h2>
                <p>{r.does}</p>
                <span className="go">
                  Try as {r.label} <ArrowRight size={17} aria-hidden="true" />
                </span>
              </a>
            </li>
          ))}
        </ul>
        <p className="dm-fine">
          Nothing you do in the demo is saved or sent anywhere. You can change
          role at any time from the bar at the top of each demo screen.
        </p>
      </main>
    </div>
  )
}
