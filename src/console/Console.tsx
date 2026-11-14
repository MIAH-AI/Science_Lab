// The platform admin console's screens. Data comes in as props from the route loaders; every action
// calls a server function in ./api, which checks the caller on the server.
import { useRouter } from '@tanstack/react-router'
import { useId, useMemo, useState, type FormEvent, type ReactNode } from 'react'
import qrcode from 'qrcode-generator'
import {
  Ban,
  Building2,
  Check,
  Copy,
  Download,
  KeyRound,
  LogOut,
  Play,
  Plus,
  Server,
  ShieldCheck,
} from 'lucide-react'
import {
  DEFAULT_GRACE_DAYS,
  DEFAULT_TERM_MONTHS,
  addDays,
  isDate,
  lastGraceDay,
  niceDate,
  termEnd,
  today,
} from '../lib/terms'
import type { CampusView, SchoolView } from '../server/control'
import type { Standing } from '../server/licence'
import {
  acceptAdminInvite,
  adminDisable,
  adminInvite,
  campusAdd,
  campusEnrolCode,
  campusSuspend,
  campusTie,
  consoleSignIn,
  consoleSignOut,
  licenceIssue,
  schoolCreate,
  schoolTerms,
  setupFirstAdmin,
  type ConsoleState,
} from './api'

type Result = { ok: true } | { ok: false; error: string }
const plural = (n: number, one: string, many = one + 's') =>
  `${n} ${n === 1 ? one : many}`

// Runs an action, shows its plain-language error if it fails, and refreshes the page's data if it works.
function useAction() {
  const router = useRouter()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  async function run<T extends { ok: boolean; error?: string }>(
    call: () => Promise<T>,
    done?: (res: T & { ok: true }) => void,
  ) {
    setBusy(true)
    setError('')
    try {
      const res = await call()
      if (!res.ok) setError(res.error ?? 'That did not work. Try again.')
      else {
        done?.(res as T & { ok: true })
        await router.invalidate()
      }
    } catch (e) {
      if (String(e).includes('signed-out'))
        window.location.href = '/console/signin'
      else setError('That did not work. Check your connection and try again.')
    } finally {
      setBusy(false)
    }
  }
  return { busy, error, setError, run }
}

const Problem = ({ text }: { text: string }) =>
  text ? (
    <p className="cs-error" role="alert">
      {text}
    </p>
  ) : null

function CopyButton({ text, label }: { text: string; label: string }) {
  const [copied, setCopied] = useState(false)
  return (
    <button
      type="button"
      className="sd-btn ghost"
      onClick={() =>
        navigator.clipboard.writeText(text).then(() => {
          setCopied(true)
          window.setTimeout(() => setCopied(false), 1800)
        })
      }
    >
      {copied ? (
        <Check size={16} aria-hidden="true" />
      ) : (
        <Copy size={16} aria-hidden="true" />
      )}
      {copied ? 'Copied' : label}
    </button>
  )
}

/* ------------------------------------------------------------------ frame */
export function ConsoleFrame({
  state,
  path,
  children,
}: {
  state: ConsoleState
  path: string
  children: ReactNode
}) {
  const tabs = [
    ['/console', 'Schools'],
    ['/console/admins', 'Admins'],
    ['/console/audit', 'Audit trail'],
  ]
  return (
    <div className="sd cs" data-theme="day">
      <header className="sd-top">
        <a className="sd-brand" href={state.me ? '/console' : '/'}>
          <img src="/favicon.svg" alt="" />
          <span>
            tough<b>2</b>simple
          </span>
        </a>
        <span className="cs-badge">Console</span>
        {state.me && (
          <>
            <nav className="sd-nav" aria-label="Console">
              {tabs.map(([href, label]) => (
                <a
                  key={href}
                  href={href}
                  aria-current={
                    (
                      href === '/console'
                        ? path === '/console' ||
                          path.startsWith('/console/schools')
                        : path.startsWith(href)
                    )
                      ? 'page'
                      : undefined
                  }
                >
                  {label}
                </a>
              ))}
            </nav>
            <span className="cs-me">{state.me.name}</span>
            <button
              type="button"
              className="sd-btn ghost"
              onClick={() =>
                consoleSignOut().then(() => {
                  window.location.href = '/console/signin'
                })
              }
            >
              <LogOut size={16} aria-hidden="true" /> Sign out
            </button>
          </>
        )}
      </header>
      <main className="cs-main">{children}</main>
    </div>
  )
}

/* ------------------------------------------------------------------ signing in */
// Shown the first time: add the key to an authenticator app, then prove it with a code.
function Authenticator({
  secret,
  uri,
  children,
}: {
  secret: string
  uri: string
  children: ReactNode
}) {
  const svg = useMemo(() => {
    const qr = qrcode(0, 'M')
    qr.addData(uri)
    qr.make()
    return qr.createSvgTag({ cellSize: 4, margin: 2, scalable: true })
  }, [uri])
  return (
    <div className="cs-auth">
      <h2>Set up your authenticator app</h2>
      <p>
        The console asks for a 6-digit code every time you sign in. Scan this
        with Google Authenticator, Microsoft Authenticator or a similar app, or
        type the key in by hand.
      </p>
      <div className="cs-qr">
        <div
          role="img"
          aria-label="QR code for your authenticator app"
          dangerouslySetInnerHTML={{ __html: svg }}
        />
        <div>
          <span className="cs-label">Key</span>
          <code>{secret.match(/.{1,4}/g)?.join(' ')}</code>
          <CopyButton text={secret} label="Copy key" />
        </div>
      </div>
      {children}
    </div>
  )
}

function CodeField({
  value,
  onChange,
}: {
  value: string
  onChange: (v: string) => void
}) {
  return (
    <label className="cs-field">
      <span>6-digit code from your app</span>
      <input
        inputMode="numeric"
        autoComplete="one-time-code"
        pattern="[0-9 ]*"
        maxLength={7}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required
        autoFocus
      />
    </label>
  )
}

// Email and password, then the code. Used on its own and after the setup and invite forms.
export function SignIn({
  start,
}: {
  start?: { email: string; password: string; secret: string; uri: string }
}) {
  const [email, setEmail] = useState(start?.email ?? '')
  const [password, setPassword] = useState(start?.password ?? '')
  const [code, setCode] = useState('')
  const [step, setStep] = useState<'password' | 'code' | 'setup'>(
    start ? 'setup' : 'password',
  )
  const [setup, setSetup] = useState(
    start ? { secret: start.secret, uri: start.uri } : null,
  )
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function submit(e: FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError('')
    try {
      const res = await consoleSignIn({
        data: { email, password, code: step === 'password' ? undefined : code },
      })
      if (res.ok) window.location.href = '/console'
      else if ('need' in res) {
        if (res.need === 'setup') setSetup({ secret: res.secret, uri: res.uri })
        setStep(res.need)
        setCode('')
      } else setError(res.error)
    } catch {
      setError('That did not work. Check your connection and try again.')
    } finally {
      setBusy(false)
    }
  }

  const codeForm = (
    <>
      <CodeField value={code} onChange={setCode} />
      <Problem text={error} />
      <button className="sd-btn primary" disabled={busy}>
        <ShieldCheck size={18} aria-hidden="true" /> Sign in
      </button>
    </>
  )
  return (
    <form className="sd-card cs-narrow" onSubmit={submit}>
      {step === 'password' && (
        <>
          <h1>Sign in to the console</h1>
          <p className="cs-sub">For the tough2simple platform team.</p>
          <label className="cs-field">
            <span>Email</span>
            <input
              type="email"
              autoComplete="username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
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
            Continue
          </button>
        </>
      )}
      {step === 'code' && (
        <>
          <h1>Enter your code</h1>
          <p className="cs-sub">
            Open your authenticator app and type the code for tough2simple
            console.
          </p>
          {codeForm}
        </>
      )}
      {step === 'setup' && setup && (
        <Authenticator secret={setup.secret} uri={setup.uri}>
          {codeForm}
        </Authenticator>
      )}
    </form>
  )
}

function NewPassword({
  value,
  onChange,
}: {
  value: string
  onChange: (v: string) => void
}) {
  const hint = useId()
  return (
    <div className="cs-field">
      <label>
        <span>Choose a password</span>
        <input
          type="password"
          autoComplete="new-password"
          minLength={12}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          aria-describedby={hint}
          required
        />
      </label>
      <small id={hint}>
        At least 12 characters. A short sentence works well.
      </small>
    </div>
  )
}

// The very first admin account, created with the setup key from the site settings.
export function Setup() {
  const [f, setF] = useState({
    setupKey: '',
    name: '',
    email: '',
    password: '',
  })
  const [next, setNext] = useState<{ secret: string; uri: string } | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  if (next)
    return <SignIn start={{ email: f.email, password: f.password, ...next }} />
  const set = (k: keyof typeof f) => (v: string) => setF({ ...f, [k]: v })
  return (
    <form
      className="sd-card cs-narrow"
      onSubmit={async (e) => {
        e.preventDefault()
        setBusy(true)
        setError('')
        const res = await setupFirstAdmin({ data: f }).catch(() => ({
          ok: false as const,
          error: 'That did not work. Try again.',
        }))
        setBusy(false)
        if (res.ok) setNext({ secret: res.secret, uri: res.uri })
        else setError(res.error)
      }}
    >
      <h1>Set up the console</h1>
      <p className="cs-sub">
        This creates the first platform admin. It works once. The setup key is
        the value of CONSOLE_SETUP_KEY in the site settings.
      </p>
      <label className="cs-field">
        <span>Setup key</span>
        <input
          type="password"
          autoComplete="off"
          value={f.setupKey}
          onChange={(e) => set('setupKey')(e.target.value)}
          required
          autoFocus
        />
      </label>
      <label className="cs-field">
        <span>Your name</span>
        <input
          autoComplete="name"
          value={f.name}
          onChange={(e) => set('name')(e.target.value)}
          required
        />
      </label>
      <label className="cs-field">
        <span>Email</span>
        <input
          type="email"
          autoComplete="username"
          value={f.email}
          onChange={(e) => set('email')(e.target.value)}
          required
        />
      </label>
      <NewPassword value={f.password} onChange={set('password')} />
      <Problem text={error} />
      <button className="sd-btn primary" disabled={busy}>
        Create my account
      </button>
    </form>
  )
}

// A second or later admin opening their one-time invite link.
export function AcceptInvite({ token }: { token: string }) {
  const [password, setPassword] = useState('')
  const [next, setNext] = useState<{
    email: string
    secret: string
    uri: string
  } | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  if (next) return <SignIn start={{ password, ...next }} />
  return (
    <form
      className="sd-card cs-narrow"
      onSubmit={async (e) => {
        e.preventDefault()
        setBusy(true)
        setError('')
        const res = await acceptAdminInvite({
          data: { token, password },
        }).catch(() => ({
          ok: false as const,
          error: 'That did not work. Try again.',
        }))
        setBusy(false)
        if (res.ok) setNext(res)
        else setError(res.error)
      }}
    >
      <h1>Join the console</h1>
      <p className="cs-sub">
        You have been invited as a platform admin. Choose your password, then
        set up your authenticator app.
      </p>
      <NewPassword value={password} onChange={setPassword} />
      <Problem text={error} />
      <button className="sd-btn primary" disabled={busy}>
        Continue
      </button>
    </form>
  )
}

/* ------------------------------------------------------------------ schools */
const STATE: Record<Standing['state'] | 'none', [string, string]> = {
  valid: ['ok', 'Licensed'],
  grace: ['warn', 'Read-only'],
  locked: ['bad', 'Locked'],
  'not-started': ['idle', 'Not started'],
  'wrong-machine': ['bad', 'Wrong server'],
  none: ['idle', 'No licence'],
}

function Pill({ campus }: { campus: CampusView }) {
  const s = campus.standing
  const [tone, word] = campus.suspended
    ? ['bad', 'Suspended']
    : STATE[s?.state ?? 'none']
  const more =
    !s || campus.suspended
      ? ''
      : s.state === 'valid'
        ? ` · ${plural(s.daysLeft, 'day')} left`
        : s.state === 'grace'
          ? ` · locks after ${niceDate(s.locks)}`
          : s.state === 'not-started'
            ? ` · starts in ${plural(s.daysLeft, 'day')}`
            : ''
  return (
    <span className={`cs-pill ${tone}`}>
      {word}
      {more}
    </span>
  )
}

function TermFields({
  termMonths,
  graceDays,
  onChange,
}: {
  termMonths: number
  graceDays: number
  onChange: (v: { termMonths: number; graceDays: number }) => void
}) {
  const term = useId()
  const grace = useId()
  return (
    <>
      <div className="cs-field">
        <label htmlFor={term}>One term is</label>
        <span className="cs-unit">
          <input
            id={term}
            type="number"
            min={1}
            max={12}
            value={termMonths}
            onChange={(e) =>
              onChange({ termMonths: Number(e.target.value), graceDays })
            }
            aria-describedby={term + 'u'}
            required
          />
          <span id={term + 'u'}>months</span>
        </span>
      </div>
      <div className="cs-field">
        <label htmlFor={grace}>Read-only period after a licence ends</label>
        <span className="cs-unit">
          <input
            id={grace}
            type="number"
            min={0}
            max={90}
            value={graceDays}
            onChange={(e) =>
              onChange({ termMonths, graceDays: Number(e.target.value) })
            }
            aria-describedby={grace + 'u'}
            required
          />
          <span id={grace + 'u'}>days</span>
        </span>
      </div>
    </>
  )
}

export function Schools({
  schools,
  state,
}: {
  schools: SchoolView[]
  state: ConsoleState
}) {
  const [name, setName] = useState('')
  const [terms, setTerms] = useState({
    termMonths: DEFAULT_TERM_MONTHS,
    graceDays: DEFAULT_GRACE_DAYS,
  })
  const act = useAction()
  return (
    <>
      <div className="cs-head">
        <h1>Schools</h1>
        <p>
          {schools.length
            ? plural(schools.length, 'school')
            : 'No schools yet. Add the first one below.'}
        </p>
      </div>
      {!state.canSign && (
        <p className="cs-note bad" role="status">
          Licences cannot be issued yet. The signing key (LICENCE_SIGNING_KEY)
          is not in the site settings.
        </p>
      )}
      <ul className="cs-schools" aria-label="Schools">
        {schools.map((s) => (
          <li key={s.id} className="sd-card">
            <a href={`/console/schools/${s.id}`}>
              <Building2 size={20} aria-hidden="true" />
              <h2>{s.name}</h2>
              <span>
                {plural(s.campuses.length, 'campus', 'campuses')} ·{' '}
                {plural(s.termMonths, 'month')} per term ·{' '}
                {plural(s.graceDays, 'day')} read-only
              </span>
            </a>
            {s.campuses.map((c) => (
              <div className="cs-line" key={c.id}>
                <b>{c.name}</b>
                <Pill campus={c} />
                <span>
                  {c.licence
                    ? `to ${niceDate(c.licence.ends)} · ${plural(c.licence.seats, 'seat')}`
                    : ''}
                </span>
              </div>
            ))}
          </li>
        ))}
      </ul>
      <form
        className="sd-card cs-form"
        aria-label="Add a school"
        onSubmit={(e) => {
          e.preventDefault()
          act.run(
            () => schoolCreate({ data: { name, ...terms } }),
            () => setName(''),
          )
        }}
      >
        <h2>
          <Plus size={18} aria-hidden="true" /> Add a school
        </h2>
        <div className="cs-row">
          <label className="cs-field grow">
            <span>School name</span>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </label>
          <TermFields {...terms} onChange={setTerms} />
          <button className="sd-btn primary" disabled={act.busy}>
            Add school
          </button>
        </div>
        <Problem text={act.error} />
      </form>
    </>
  )
}

/* ------------------------------------------------------------------ one school */
function LicenceForm({
  school,
  campus,
}: {
  school: SchoolView
  campus: CampusView
}) {
  const current = campus.licence
  const [kind, setKind] = useState<'trial' | 'active'>(
    current ? 'active' : 'trial',
  )
  const [starts, setStarts] = useState(
    current && campus.standing?.state === 'valid' ? current.starts : today(),
  )
  const [length, setLength] = useState<'1' | '2' | 'date'>('1')
  const [endDate, setEndDate] = useState('')
  const [seats, setSeats] = useState(current?.seats ?? 100)
  const [graceDays, setGraceDays] = useState(school.graceDays)
  const [note, setNote] = useState('')
  const act = useAction()
  const ends = !isDate(starts)
    ? ''
    : length === 'date'
      ? endDate
      : termEnd(starts, Number(length), school.termMonths)
  const ok = isDate(starts) && isDate(ends) && ends >= starts
  return (
    <form
      className="cs-form"
      aria-label={`Licence for ${campus.name}`}
      onSubmit={(e) => {
        e.preventDefault()
        act.run(
          () =>
            licenceIssue({
              data: {
                campusId: campus.id,
                kind,
                starts,
                seats,
                graceDays,
                note,
                ...(length === 'date'
                  ? { ends: endDate }
                  : { terms: Number(length) }),
              },
            }),
          () => setNote(''),
        )
      }}
    >
      <h3>{current ? 'Extend or replace the licence' : 'Issue a licence'}</h3>
      <div className="cs-row">
        <label className="cs-field">
          <span>Type</span>
          <select
            value={kind}
            onChange={(e) => setKind(e.target.value as 'trial' | 'active')}
          >
            <option value="trial">Trial</option>
            <option value="active">Full licence</option>
          </select>
        </label>
        <label className="cs-field">
          <span>Starts</span>
          <input
            type="date"
            value={starts}
            onChange={(e) => setStarts(e.target.value)}
            required
          />
        </label>
        <label className="cs-field">
          <span>Length</span>
          <select
            value={length}
            onChange={(e) => setLength(e.target.value as '1' | '2' | 'date')}
          >
            <option value="1">
              1 term ({plural(school.termMonths, 'month')})
            </option>
            <option value="2">
              2 terms ({plural(school.termMonths * 2, 'month')})
            </option>
            <option value="date">Choose the end date</option>
          </select>
        </label>
        {length === 'date' && (
          <label className="cs-field">
            <span>Ends</span>
            <input
              type="date"
              value={endDate}
              min={starts}
              onChange={(e) => setEndDate(e.target.value)}
              required
            />
          </label>
        )}
        <label className="cs-field">
          <span>Seats</span>
          <input
            type="number"
            min={1}
            value={seats}
            onChange={(e) => setSeats(Number(e.target.value))}
            required
          />
        </label>
        <label className="cs-field">
          <span>Read-only days after</span>
          <input
            type="number"
            min={0}
            max={90}
            value={graceDays}
            onChange={(e) => setGraceDays(Number(e.target.value))}
            required
          />
        </label>
        <label className="cs-field grow">
          <span>Note (optional)</span>
          <input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="e.g. Paid for two terms"
          />
        </label>
      </div>
      {ok && (
        <p className="cs-preview" aria-live="polite">
          Runs {niceDate(starts)} to {niceDate(ends)} with{' '}
          {plural(seats, 'seat')}.{' '}
          {graceDays > 0
            ? `Then read-only until ${niceDate(lastGraceDay(ends, graceDays))}, and locked from ${niceDate(addDays(lastGraceDay(ends, graceDays), 1))}.`
            : `Locked from ${niceDate(addDays(ends, 1))}.`}
        </p>
      )}
      <Problem text={act.error} />
      <button className="sd-btn primary" disabled={act.busy || !ok}>
        <KeyRound size={17} aria-hidden="true" />{' '}
        {current ? 'Issue the new licence' : 'Issue licence'}
      </button>
    </form>
  )
}

function Campus({
  school,
  campus,
}: {
  school: SchoolView
  campus: CampusView
}) {
  const [reason, setReason] = useState('')
  const [code, setCode] = useState<{ token: string; expires: string } | null>(
    null,
  )
  const [machine, setMachine] = useState('')
  const tie = useAction()
  const act = useAction()
  const l = campus.licence
  const file = l
    ? `data:text/plain;charset=utf-8,${encodeURIComponent(l.token)}`
    : ''
  return (
    <section className="sd-card cs-campus" aria-label={campus.name}>
      <div className="cs-campus-head">
        <h2>{campus.name}</h2>
        <Pill campus={campus} />
      </div>
      {campus.suspended && (
        <p className="cs-note bad">Suspended: {campus.suspendedReason}</p>
      )}

      <dl className="cs-facts">
        {l ? (
          <>
            <div>
              <dt>Licence</dt>
              <dd>{l.kind === 'trial' ? 'Trial' : 'Full licence'}</dd>
            </div>
            <div>
              <dt>Runs</dt>
              <dd>
                {niceDate(l.starts)} to {niceDate(l.ends)}
              </dd>
            </div>
            <div>
              <dt>Read-only until</dt>
              <dd>
                {l.graceDays
                  ? niceDate(lastGraceDay(l.ends, l.graceDays))
                  : 'No read-only period'}
              </dd>
            </div>
            <div>
              <dt>Seats</dt>
              <dd>
                {campus.seatsUsed != null
                  ? `${campus.seatsUsed} of ${l.seats} in use`
                  : l.seats}
              </dd>
            </div>
            <div>
              <dt>Issued</dt>
              <dd>
                {niceDate(l.issued)} by {l.issuedBy}
              </dd>
            </div>
          </>
        ) : (
          <div>
            <dt>Licence</dt>
            <dd>None yet</dd>
          </div>
        )}
        <div>
          <dt>Server</dt>
          <dd>
            {campus.enrolled
              ? `Enrolled${campus.version ? ` · version ${campus.version}` : ''}${campus.lastHeartbeat ? ` · last seen ${new Date(campus.lastHeartbeat).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' })}` : ''}`
              : campus.machine
                ? `Tied to ${campus.machine.slice(0, 12)}… (offline server)`
                : 'No server enrolled yet'}
          </dd>
        </div>
      </dl>

      {l && (
        <div className="cs-acts">
          <CopyButton text={l.token} label="Copy licence" />
          <a
            className="sd-btn ghost"
            href={file}
            download={`${school.name} - ${campus.name}.t2s-licence`.replace(
              /[^\w .-]+/g,
              '',
            )}
          >
            <Download size={16} aria-hidden="true" /> Download licence file
          </a>
        </div>
      )}

      <LicenceForm school={school} campus={campus} />

      <div className="cs-split">
        <div className="cs-form">
          <h3>
            <Server size={17} aria-hidden="true" /> School server
          </h3>
          <p className="cs-sub">
            An enrolment code ties this campus to one server. It works once and
            runs out after 24 hours.
          </p>
          {code && (
            <p className="cs-code" role="status">
              <code>{code.token}</code>
              <CopyButton text={code.token} label="Copy code" />
              <small>
                Shown once. Runs out{' '}
                {new Date(code.expires).toLocaleString('en-GB', {
                  dateStyle: 'medium',
                  timeStyle: 'short',
                })}
                .
              </small>
            </p>
          )}
          <button
            type="button"
            className="sd-btn ghost"
            disabled={act.busy}
            onClick={() =>
              act.run(
                () => campusEnrolCode({ data: { campusId: campus.id } }),
                (r) => setCode(r),
              )
            }
          >
            <KeyRound size={16} aria-hidden="true" />{' '}
            {campus.enrolled
              ? 'Make a code for a replacement server'
              : 'Make an enrolment code'}
          </button>
          <form
            className="cs-form cs-tie"
            aria-label={`Tie ${campus.name} to a server`}
            onSubmit={(e) => {
              e.preventDefault()
              tie.run(
                () =>
                  campusTie({
                    data: { campusId: campus.id, machine },
                  }) as Promise<Result>,
                () => setMachine(''),
              )
            }}
          >
            <p className="cs-sub">
              For a server that stays offline: paste the fingerprint from its
              licence page. The licence is then made for that one machine, to
              download and copy across.
              {campus.machine
                ? ` Tied now to ${campus.machine.slice(0, 12)}…`
                : ''}
            </p>
            <div className="cs-row">
              <label className="cs-field grow">
                <span>Server fingerprint</span>
                <input
                  value={machine}
                  onChange={(e) => setMachine(e.target.value)}
                  required
                  minLength={64}
                  maxLength={64}
                  spellCheck={false}
                />
              </label>
              <button className="sd-btn ghost" disabled={tie.busy}>
                Tie to this server
              </button>
            </div>
            <Problem text={tie.error} />
          </form>
        </div>
        <form
          className="cs-form"
          aria-label={`Suspend ${campus.name}`}
          onSubmit={(e) => {
            e.preventDefault()
            act.run(
              () =>
                campusSuspend({
                  data: {
                    campusId: campus.id,
                    suspended: !campus.suspended,
                    reason,
                  },
                }) as Promise<Result>,
              () => setReason(''),
            )
          }}
        >
          <h3>
            {campus.suspended ? 'Lift the suspension' : 'Suspend this campus'}
          </h3>
          {campus.suspended ? (
            <p className="cs-sub">
              The server unlocks the next time it reaches the internet.
            </p>
          ) : (
            <>
              <p className="cs-sub">
                The server locks the next time it reaches the internet. A server
                that stays offline keeps running until its licence ends.
              </p>
              <label className="cs-field">
                <span>Reason</span>
                <input
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  required
                  minLength={3}
                />
              </label>
            </>
          )}
          <button
            className={`sd-btn ${campus.suspended ? 'primary' : 'cs-danger'}`}
            disabled={act.busy}
          >
            {campus.suspended ? (
              <Play size={16} aria-hidden="true" />
            ) : (
              <Ban size={16} aria-hidden="true" />
            )}
            {campus.suspended ? 'Lift suspension' : 'Suspend'}
          </button>
        </form>
      </div>
      <Problem text={act.error} />

      {campus.history.length > 1 && (
        <details className="cs-history">
          <summary>Earlier licences ({campus.history.length - 1})</summary>
          <ul>
            {campus.history.slice(1).map((h) => (
              <li key={h.id}>
                {h.kind === 'trial' ? 'Trial' : 'Full licence'} ·{' '}
                {niceDate(h.starts)} to {niceDate(h.ends)} ·{' '}
                {plural(h.seats, 'seat')} · issued {niceDate(h.issued)} by{' '}
                {h.issuedBy}
                {h.note ? ` · ${h.note}` : ''}
              </li>
            ))}
          </ul>
        </details>
      )}
    </section>
  )
}

export function School({ school }: { school: SchoolView }) {
  const [terms, setTerms] = useState({
    termMonths: school.termMonths,
    graceDays: school.graceDays,
  })
  const [campus, setCampus] = useState('')
  const act = useAction()
  const add = useAction()
  return (
    <>
      <div className="cs-head">
        <a className="cs-back" href="/console">
          ← All schools
        </a>
        <h1>{school.name}</h1>
      </div>
      <form
        className="sd-card cs-form"
        aria-label="Term settings"
        onSubmit={(e) => {
          e.preventDefault()
          act.run(() => schoolTerms({ data: { id: school.id, ...terms } }))
        }}
      >
        <h2>Term settings for this school</h2>
        <p className="cs-sub">
          Used as the starting values for this school’s next licence. Licences
          already issued do not change.
        </p>
        <div className="cs-row">
          <TermFields {...terms} onChange={setTerms} />
          <button className="sd-btn ghost" disabled={act.busy}>
            Save
          </button>
        </div>
        <Problem text={act.error} />
      </form>
      {school.campuses.map((c) => (
        <Campus key={c.id} school={school} campus={c} />
      ))}
      <form
        className="sd-card cs-form"
        aria-label="Add a campus"
        onSubmit={(e) => {
          e.preventDefault()
          add.run(
            () => campusAdd({ data: { schoolId: school.id, name: campus } }),
            () => setCampus(''),
          )
        }}
      >
        <h2>
          <Plus size={18} aria-hidden="true" /> Add a campus
        </h2>
        <p className="cs-sub">
          Each campus has its own server, licence and seats.
        </p>
        <div className="cs-row">
          <label className="cs-field grow">
            <span>Campus name</span>
            <input
              value={campus}
              onChange={(e) => setCampus(e.target.value)}
              required
              placeholder="e.g. Main Campus"
            />
          </label>
          <button className="sd-btn primary" disabled={add.busy}>
            Add campus
          </button>
        </div>
        <Problem text={add.error} />
      </form>
    </>
  )
}

/* ------------------------------------------------------------------ admins and audit */
export function Admins({
  admins,
  me,
}: {
  admins: {
    id: string
    email: string
    name: string
    state: 'active' | 'invited' | 'disabled'
  }[]
  me: string
}) {
  const [f, setF] = useState({ name: '', email: '' })
  const [link, setLink] = useState('')
  const act = useAction()
  return (
    <>
      <div className="cs-head">
        <h1>Platform admins</h1>
        <p>
          People who can create schools and issue licences. Each signs in with a
          password and an authenticator code.
        </p>
      </div>
      <ul className="cs-list" aria-label="Admins">
        {admins.map((a) => (
          <li key={a.id} className="sd-card">
            <div>
              <b>{a.name}</b>
              <span>{a.email}</span>
            </div>
            <span
              className={`cs-pill ${a.state === 'active' ? 'ok' : a.state === 'invited' ? 'idle' : 'bad'}`}
            >
              {a.state === 'active'
                ? 'Active'
                : a.state === 'invited'
                  ? 'Invited'
                  : 'Disabled'}
            </span>
            {a.id !== me && a.state !== 'disabled' && (
              <button
                type="button"
                className="sd-btn ghost"
                disabled={act.busy}
                aria-label={`Disable ${a.name}`}
                onClick={() =>
                  act.run(
                    () =>
                      adminDisable({ data: { id: a.id } }) as Promise<Result>,
                  )
                }
              >
                Disable
              </button>
            )}
          </li>
        ))}
      </ul>
      <form
        className="sd-card cs-form"
        aria-label="Invite an admin"
        onSubmit={(e) => {
          e.preventDefault()
          act.run(
            () => adminInvite({ data: f }),
            (r) => {
              setLink(`${window.location.origin}/console/invite/${r.token}`)
              setF({ name: '', email: '' })
            },
          )
        }}
      >
        <h2>
          <Plus size={18} aria-hidden="true" /> Invite an admin
        </h2>
        <div className="cs-row">
          <label className="cs-field grow">
            <span>Name</span>
            <input
              value={f.name}
              onChange={(e) => setF({ ...f, name: e.target.value })}
              required
            />
          </label>
          <label className="cs-field grow">
            <span>Email</span>
            <input
              type="email"
              value={f.email}
              onChange={(e) => setF({ ...f, email: e.target.value })}
              required
            />
          </label>
          <button className="sd-btn primary" disabled={act.busy}>
            Make invite link
          </button>
        </div>
        {link && (
          <p className="cs-code" role="status">
            <code>{link}</code>
            <CopyButton text={link} label="Copy link" />
            <small>
              Send this to them yourself. It works once and runs out after 72
              hours.
            </small>
          </p>
        )}
        <Problem text={act.error} />
      </form>
    </>
  )
}

const ACTIONS: Record<string, string> = {
  'admin.first': 'Created the first admin',
  'admin.invite': 'Invited an admin',
  'admin.accept': 'Accepted an invite',
  'admin.disable': 'Disabled an admin',
  'signin.ok': 'Signed in',
  'signin.failed': 'Failed sign-in',
  'signin.locked': 'Account locked after failed sign-ins',
  'school.create': 'Added a school',
  'school.terms': 'Changed term settings',
  'campus.create': 'Added a campus',
  'campus.suspend': 'Suspended a campus',
  'campus.resume': 'Lifted a suspension',
  'campus.enrol-token': 'Made an enrolment code',
  'campus.enrolled': 'A server enrolled',
  'campus.tie': 'Tied a campus to a server',
  'licence.issue': 'Issued a licence',
}

export function Audit({
  entries,
}: {
  entries: {
    id: string
    at: string
    by: string
    action: string
    target: string
    detail: string
  }[]
}) {
  return (
    <>
      <div className="cs-head">
        <h1>Audit trail</h1>
        <p>
          The last {entries.length} things done in the console, newest first.
          Entries cannot be edited.
        </p>
      </div>
      <div className="sd-card cs-table">
        <table>
          <thead>
            <tr>
              <th>When</th>
              <th>Who</th>
              <th>What</th>
              <th>On</th>
              <th>Detail</th>
            </tr>
          </thead>
          <tbody>
            {entries.map((e) => (
              <tr key={e.id}>
                <td>
                  {new Date(e.at).toLocaleString('en-GB', {
                    dateStyle: 'medium',
                    timeStyle: 'short',
                  })}
                </td>
                <td>{e.by}</td>
                <td>{ACTIONS[e.action] ?? e.action}</td>
                <td>{e.target}</td>
                <td>{e.detail}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  )
}
