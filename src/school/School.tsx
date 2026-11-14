// Screens that exist only on a school server: sign in, join with an invite code, and the school admin's
// People page. Every action calls a server function in ./api, which checks the caller on the server.
import { useRouter } from '@tanstack/react-router'
import { useEffect, useState, type FormEvent, type ReactNode } from 'react'
import {
  KeyRound,
  LogIn,
  LogOut,
  Plus,
  Printer,
  UserCheck,
  Users,
} from 'lucide-react'
import type { Person, Role, SchoolUser } from './accounts'
import {
  classInvite,
  inviteCancel,
  inviteLookup,
  personApprove,
  personDisable,
  personInvite,
  personResetCode,
  schoolJoin,
  schoolMe,
  schoolSignIn,
  schoolSignOut,
  type SchoolMe,
} from './api'

const ROLE_NAME: Record<Role, string> = {
  admin: 'School admin',
  teacher: 'Teacher',
  student: 'Student',
  principal: 'Principal',
}
const plural = (n: number, one: string, many = one + 's') =>
  `${n} ${n === 1 ? one : many}`

function Frame({ school, children }: { school?: string; children: ReactNode }) {
  return (
    <div className="sd cs" data-theme="day">
      <header className="sd-top">
        <a className="sd-brand" href="/app">
          <img src="/favicon.svg" alt="" />
          <span>
            tough<b>2</b>simple
          </span>
        </a>
        {school && <span className="cs-me">{school}</span>}
      </header>
      <main className="cs-main">{children}</main>
    </div>
  )
}

const Problem = ({ text }: { text: string }) =>
  text ? (
    <p className="cs-error" role="alert">
      {text}
    </p>
  ) : null

export function SignInPage({
  me,
}: {
  me: Extract<SchoolMe, { campus: true }>
}) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  async function submit(e: FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError('')
    const res = await schoolSignIn({ data: { username, password } }).catch(
      () => ({
        ok: false as const,
        error: 'The school server did not answer. Try again.',
      }),
    )
    setBusy(false)
    if (res.ok)
      window.location.assign(res.role === 'admin' ? '/app/people' : '/app')
    else setError(res.error)
  }
  return (
    <Frame school={me.school}>
      <form className="sd-card cs-narrow" onSubmit={submit}>
        <h1>Sign in</h1>
        <p className="cs-sub">
          {me.school ? `${me.school}, ${me.campusName}. ` : ''}You can use the
          labs without signing in. Sign in to see the work your teachers set.
        </p>
        <label className="cs-field">
          <span>Username</span>
          <input
            autoComplete="username"
            autoCapitalize="none"
            spellCheck={false}
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            autoFocus
          />
        </label>
        <label className="cs-field">
          <span>Password</span>
          <input
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </label>
        <Problem text={error} />
        <button className="sd-btn primary" disabled={busy}>
          <LogIn size={18} aria-hidden="true" /> Sign in
        </button>
        <p className="cs-sub">
          New here? <a href="/join">Use your invite code</a>. Forgotten your
          password? Ask your school admin.
        </p>
      </form>
    </Frame>
  )
}

export function JoinPage({ me }: { me: Extract<SchoolMe, { campus: true }> }) {
  const [code, setCode] = useState('')
  const [who, setWho] = useState<{
    name: string
    role: Role
    class: string
    reset: boolean
  } | null>(null)
  const [password, setPassword] = useState('')
  const [done, setDone] = useState<{
    username: string
    waiting: boolean
  } | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function check(e: FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError('')
    const res = await inviteLookup({ data: { code } }).catch(() => null)
    setBusy(false)
    if (res) setWho(res)
    else
      setError(
        'That code is not right, or it has already been used. Check it with your school admin.',
      )
  }
  async function finish(e: FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError('')
    const res = await schoolJoin({ data: { code, password } }).catch(() => ({
      ok: false as const,
      error: 'The school server did not answer. Try again.',
    }))
    setBusy(false)
    if (res.ok) setDone(res)
    else setError(res.error)
  }

  return (
    <Frame school={me.school}>
      {done ? (
        <div className="sd-card cs-narrow" role="status">
          <h1>
            {done.waiting
              ? 'You have joined. One more step'
              : 'Your account is ready'}
          </h1>
          <p className="cs-sub">Your username is</p>
          <p className="cs-code">
            <code>{done.username}</code>
          </p>
          <p className="cs-sub">
            Write it down.{' '}
            {done.waiting
              ? 'Your school admin now needs to approve you. After that you can sign in with this username and the password you chose.'
              : 'Sign in with it and the password you chose.'}
          </p>
          <a className="sd-btn primary" href="/signin">
            Go to sign in
          </a>
        </div>
      ) : !who ? (
        <form className="sd-card cs-narrow" onSubmit={check}>
          <h1>Join with your invite code</h1>
          <p className="cs-sub">
            Your school admin or teacher gave you a code like ABCD-2345.
          </p>
          <label className="cs-field">
            <span>Invite code</span>
            <input
              autoCapitalize="characters"
              spellCheck={false}
              autoComplete="off"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              required
              autoFocus
            />
          </label>
          <Problem text={error} />
          <button className="sd-btn primary" disabled={busy}>
            Continue
          </button>
          <p className="cs-sub">
            Already joined? <a href="/signin">Sign in</a>.
          </p>
        </form>
      ) : (
        <form className="sd-card cs-narrow" onSubmit={finish}>
          <h1>Hello, {who.name}</h1>
          <p className="cs-sub">
            {who.reset
              ? 'Choose a new password for your account'
              : `You are joining as a ${ROLE_NAME[who.role].toLowerCase()}${who.class ? ` in ${who.class}` : ''}`}
            . Not you? <a href="/join">Use a different code</a>.
          </p>
          <div className="cs-field">
            <label>
              <span>Choose a password</span>
              <input
                type="password"
                autoComplete="new-password"
                minLength={who.role === 'student' ? 8 : 10}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                aria-describedby="join-hint"
                required
                autoFocus
              />
            </label>
            <small id="join-hint">
              At least {who.role === 'student' ? 8 : 10} characters. Choose one
              you will remember: there is no email to reset it.
            </small>
          </div>
          <Problem text={error} />
          <button className="sd-btn primary" disabled={busy}>
            <KeyRound size={18} aria-hidden="true" />{' '}
            {who.reset ? 'Save my new password' : 'Create my account'}
          </button>
        </form>
      )}
    </Frame>
  )
}

type PeopleData = {
  people: Person[]
  used: number
  seats: number
  canChange: boolean
  school: string
  campusName: string
  me: SchoolUser
}

export function PeoplePage({ data }: { data: PeopleData }) {
  const router = useRouter()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [one, setOne] = useState<{ name: string; role: Role; class: string }>({
    name: '',
    role: 'student',
    class: '',
  })
  const [list, setList] = useState({ names: '', class: '' })
  const { people, used, seats, canChange } = data
  const waiting = people.filter((p) => p.status === 'pending')
  const invited = people.filter((p) => p.status === 'invited')
  const rest = people.filter(
    (p) => p.status === 'active' || p.status === 'disabled',
  )
  const free = seats - used

  async function run(
    call: () => Promise<{ ok: boolean; error?: string }>,
    after?: () => void,
  ) {
    setBusy(true)
    setError('')
    try {
      const res = await call()
      if (!res.ok) {
        if (res.error === 'signed-out') window.location.assign('/signin')
        else setError(res.error ?? 'That did not work. Try again.')
      } else {
        after?.()
        await router.invalidate()
      }
    } catch {
      setError('The school server did not answer. Try again.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <Frame school={`${data.school}, ${data.campusName}`}>
      <div className="cs-head sc-head">
        <div>
          <h1>People</h1>
          <p>
            Add teachers and students, approve them when they join, and stay
            within the seats on your licence.
          </p>
        </div>
        <button
          type="button"
          className="sd-btn ghost"
          onClick={() =>
            schoolSignOut().then(() => window.location.assign('/app'))
          }
        >
          <LogOut size={16} aria-hidden="true" /> Sign out {data.me.name}
        </button>
      </div>
      {!canChange && (
        <p className="cs-note bad" role="status">
          The school’s licence has ended, so nothing here can be changed. Ask
          tough2simple to extend it.
        </p>
      )}
      <Problem text={error} />

      <section className="sd-card cs-form" aria-label="Seats">
        <h2>
          <Users size={18} aria-hidden="true" /> Seats
        </h2>
        <p className="sc-big">
          <b>{used}</b> of {seats} seats in use
        </p>
        <progress
          max={seats || 1}
          value={used}
          aria-label={`${used} of ${seats} seats in use`}
          className={free <= 0 ? 'full' : undefined}
        />
        <p className="cs-sub">
          {free > 0 ? `${plural(free, 'seat')} free. ` : 'No seats free. '}Each
          approved person uses one seat. Disabling someone who has left frees
          theirs.
        </p>
      </section>

      <section aria-label="Waiting for approval">
        <h2>
          <UserCheck size={18} aria-hidden="true" /> Waiting for your approval (
          {waiting.length})
        </h2>
        {waiting.length === 0 && (
          <p className="cs-sub">
            Nobody is waiting. People appear here after they use their invite
            code.
          </p>
        )}
        <ul className="cs-list" aria-label="Waiting for approval">
          {waiting.map((p) => (
            <li key={p.id} className="sd-card">
              <div>
                <b>{p.name}</b>
                <span>
                  {ROLE_NAME[p.role]}
                  {p.class ? ` · ${p.class}` : ''} · username {p.username}
                </span>
              </div>
              <button
                type="button"
                className="sd-btn primary"
                disabled={busy || !canChange}
                aria-label={`Approve ${p.name}`}
                onClick={() => run(() => personApprove({ data: { id: p.id } }))}
              >
                Approve
              </button>
              <button
                type="button"
                className="sd-btn ghost"
                disabled={busy || !canChange}
                aria-label={`Turn away ${p.name}`}
                onClick={() => run(() => personDisable({ data: { id: p.id } }))}
              >
                Turn away
              </button>
            </li>
          ))}
        </ul>
      </section>

      <section aria-label="Invites not used yet">
        <div className="sc-row">
          <h2>
            <KeyRound size={18} aria-hidden="true" /> Invites not used yet (
            {invited.length})
          </h2>
          {invited.length > 0 && (
            <button
              type="button"
              className="sd-btn ghost"
              onClick={() => window.print()}
            >
              <Printer size={16} aria-hidden="true" /> Print the codes
            </button>
          )}
        </div>
        <ul className="cs-list sc-codes" aria-label="Invites not used yet">
          {invited.map((p) => (
            <li key={p.id} className="sd-card">
              <div>
                <b>{p.name}</b>
                <span>
                  {ROLE_NAME[p.role]}
                  {p.class ? ` · ${p.class}` : ''}
                </span>
              </div>
              <code>{p.code}</code>
              <button
                type="button"
                className="sd-btn ghost"
                disabled={busy || !canChange}
                aria-label={`Cancel the invite for ${p.name}`}
                onClick={() => run(() => inviteCancel({ data: { id: p.id } }))}
              >
                Cancel
              </button>
            </li>
          ))}
        </ul>
      </section>

      <div className="cs-split sc-invite">
        <form
          className="sd-card cs-form"
          aria-label="Invite one person"
          onSubmit={(e) => {
            e.preventDefault()
            run(
              () => personInvite({ data: one }),
              () => setOne({ ...one, name: '' }),
            )
          }}
        >
          <h2>
            <Plus size={18} aria-hidden="true" /> Invite one person
          </h2>
          <label className="cs-field">
            <span>Their name</span>
            <input
              value={one.name}
              onChange={(e) => setOne({ ...one, name: e.target.value })}
              required
            />
          </label>
          <label className="cs-field">
            <span>They are a</span>
            <select
              value={one.role}
              onChange={(e) => setOne({ ...one, role: e.target.value as Role })}
            >
              <option value="student">Student</option>
              <option value="teacher">Teacher</option>
              <option value="principal">Principal</option>
              <option value="admin">School admin</option>
            </select>
          </label>
          <label className="cs-field">
            <span>Class (optional)</span>
            <input
              value={one.class}
              onChange={(e) => setOne({ ...one, class: e.target.value })}
              placeholder="e.g. SS2 Science"
            />
          </label>
          <button className="sd-btn primary" disabled={busy || !canChange}>
            Make an invite code
          </button>
        </form>
        <form
          className="sd-card cs-form"
          aria-label="Invite a whole class"
          onSubmit={(e) => {
            e.preventDefault()
            run(
              () => classInvite({ data: list }),
              () => setList({ ...list, names: '' }),
            )
          }}
        >
          <h2>
            <Plus size={18} aria-hidden="true" /> Invite a whole class
          </h2>
          <label className="cs-field">
            <span>Class</span>
            <input
              value={list.class}
              onChange={(e) => setList({ ...list, class: e.target.value })}
              required
              placeholder="e.g. SS2 Science"
            />
          </label>
          <label className="cs-field">
            <span>Class list, one name on each line</span>
            <textarea
              rows={6}
              value={list.names}
              onChange={(e) => setList({ ...list, names: e.target.value })}
              required
            />
          </label>
          <button className="sd-btn primary" disabled={busy || !canChange}>
            Make a code for each student
          </button>
        </form>
      </div>

      <section aria-label="Teachers and students">
        <h2>
          <Users size={18} aria-hidden="true" /> Approved and disabled (
          {rest.length})
        </h2>
        <ul className="cs-list" aria-label="Teachers and students">
          {rest.map((p) => (
            <li key={p.id} className="sd-card">
              <div>
                <b>{p.name}</b>
                <span>
                  {ROLE_NAME[p.role]}
                  {p.class ? ` · ${p.class}` : ''} · username {p.username}
                </span>
              </div>
              {p.code && (
                <code className="sc-reset" title="New password code">
                  {p.code}
                </code>
              )}
              <span
                className={`cs-pill ${p.status === 'active' ? 'ok' : 'bad'}`}
              >
                {p.status === 'active' ? 'Approved' : 'Disabled'}
              </span>
              {p.id !== data.me.id &&
                (p.status === 'active' ? (
                  <>
                    <button
                      type="button"
                      className="sd-btn ghost"
                      disabled={busy || !canChange}
                      aria-label={`New password code for ${p.name}`}
                      onClick={() =>
                        run(() => personResetCode({ data: { id: p.id } }))
                      }
                    >
                      New password
                    </button>
                    <button
                      type="button"
                      className="sd-btn ghost"
                      disabled={busy || !canChange}
                      aria-label={`Disable ${p.name}`}
                      onClick={() =>
                        run(() => personDisable({ data: { id: p.id } }))
                      }
                    >
                      Disable
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    className="sd-btn ghost"
                    disabled={busy || !canChange}
                    aria-label={`Enable ${p.name} again`}
                    onClick={() =>
                      run(() => personApprove({ data: { id: p.id } }))
                    }
                  >
                    Enable again
                  </button>
                ))}
            </li>
          ))}
        </ul>
      </section>
    </Frame>
  )
}

// On the Study Desk of a school server: who is signed in, with the way in or out. Renders nothing on the
// hosted site, and asks the server only when the school server has marked the browser with its cookie.
export function SchoolChip() {
  const [me, setMe] = useState<Extract<SchoolMe, { campus: true }> | null>(null)
  useEffect(() => {
    if (!document.cookie.includes('t2s_campus=1')) return
    schoolMe()
      .then((res) => {
        if (res.campus) setMe(res)
      })
      .catch(() => {})
  }, [])
  if (!me) return null
  if (!me.user)
    return (
      <a className="sc-chip" href="/signin">
        <LogIn size={16} aria-hidden="true" /> Sign in
      </a>
    )
  return (
    <span className="sc-chip">
      {me.user.role === 'admin' ? <a href="/app/people">People</a> : null}
      <span>{me.user.name}</span>
      <button
        type="button"
        aria-label="Sign out"
        onClick={() => schoolSignOut().then(() => window.location.reload())}
      >
        <LogOut size={16} aria-hidden="true" />
      </button>
    </span>
  )
}
