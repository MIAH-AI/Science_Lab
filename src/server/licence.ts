// Licences for school servers. A licence is a small record signed by the control service with an Ed25519
// key. The school server holds only the public key, so it can check a licence but cannot make or edit one.
// Format: "T2S1.<payload>.<signature>", both parts base64url. See doc/roadmap/licensing-and-deployment.md.
import { isDate } from '../lib/terms'
import {
  createPrivateKey,
  createPublicKey,
  generateKeyPairSync,
  sign,
  verify,
} from 'node:crypto'

export { DEFAULT_GRACE_DAYS, DEFAULT_TERM_MONTHS, termEnd } from '../lib/terms'

export type Licence = {
  v: 1
  id: string
  school: string
  schoolId: string
  campus: string
  campusId: string
  // trial: a test term. active: a paid or agreed licence. Both end on `ends`.
  kind: 'trial' | 'active'
  // Calendar dates (YYYY-MM-DD). The licence runs from the start of `starts` to the end of `ends`, in UTC.
  starts: string
  ends: string
  // Days after `ends` when the server stays read-only so teachers can export results.
  graceDays: number
  // Most teachers and students who can be approved at once.
  seats: number
  // The server this licence is tied to, or null until that server has enrolled.
  machine: string | null
  issued: string
}

export type LicenceState =
  | 'valid' // everything works
  | 'not-started' // before the start date: locked
  | 'grace' // past the end date: read-only, export still works
  | 'locked' // past the grace period, or suspended
  | 'wrong-machine' // the licence belongs to another server

const PREFIX = 'T2S1'
const b64 = (buf: Buffer) => buf.toString('base64url')
// A new signing key pair, as PEM text. The private key belongs only in the control service's secrets.
export function newKeyPair() {
  const { publicKey, privateKey } = generateKeyPairSync('ed25519')
  return {
    publicKey: publicKey.export({ type: 'spki', format: 'pem' }).toString(),
    privateKey: privateKey.export({ type: 'pkcs8', format: 'pem' }).toString(),
  }
}

export function signLicence(licence: Licence, privateKeyPem: string) {
  const problem = licenceProblem(licence)
  if (problem) throw new Error('Cannot sign this licence: ' + problem)
  const payload = Buffer.from(JSON.stringify(licence), 'utf8')
  const signature = sign(null, payload, createPrivateKey(privateKeyPem))
  return `${PREFIX}.${b64(payload)}.${b64(signature)}`
}

export type Verified =
  { ok: true; licence: Licence } | { ok: false; reason: string }

// Checks the signature first, then the shape. A licence edited by hand fails here.
export function verifyLicence(token: string, publicKeyPem: string): Verified {
  const parts = token.trim().split('.')
  if (parts.length !== 3 || parts[0] !== PREFIX)
    return { ok: false, reason: 'This is not a tough2simple licence.' }
  let payload: Buffer, signature: Buffer
  try {
    payload = Buffer.from(parts[1], 'base64url')
    signature = Buffer.from(parts[2], 'base64url')
    if (!verify(null, payload, createPublicKey(publicKeyPem), signature))
      return {
        ok: false,
        reason:
          'The licence has been changed or was not issued by tough2simple.',
      }
  } catch {
    return { ok: false, reason: 'The licence could not be read.' }
  }
  let licence: Licence
  try {
    licence = JSON.parse(payload.toString('utf8')) as Licence
  } catch {
    return { ok: false, reason: 'The licence could not be read.' }
  }
  const problem = licenceProblem(licence)
  return problem
    ? { ok: false, reason: 'The licence is incomplete: ' + problem }
    : { ok: true, licence }
}

export function licenceProblem(l: Licence): string | null {
  if (l.v !== 1) return 'unknown version'
  for (const k of ['id', 'school', 'schoolId', 'campus', 'campusId'] as const)
    if (typeof l[k] !== 'string' || !l[k]) return `missing ${k}`
  if (l.kind !== 'trial' && l.kind !== 'active') return 'unknown kind'
  if (!isDate(l.starts) || !isDate(l.ends)) return 'bad dates'
  if (l.ends < l.starts) return 'ends before it starts'
  if (!Number.isInteger(l.graceDays) || l.graceDays < 0 || l.graceDays > 365)
    return 'bad grace period'
  if (!Number.isInteger(l.seats) || l.seats < 1) return 'bad seat count'
  if (l.machine !== null && typeof l.machine !== 'string') return 'bad machine'
  return null
}

const DAY = 86_400_000
const startOf = (date: string) => Date.parse(date + 'T00:00:00Z')

export type Standing = {
  state: LicenceState
  // Whole days until the next change: until it starts, ends, or locks. 0 on the last day.
  daysLeft: number
  // When the server stops being fully usable, and when it locks (ISO dates).
  ends: string
  locks: string
  // What the school can do right now.
  canUse: boolean
  canChange: boolean
}

// Where a licence stands at `now`. `machine` is this server's fingerprint; `suspended` comes from the
// control service's last signed answer, when the server has been online.
export function standing(
  l: Licence,
  now: Date,
  opts: { machine?: string | null; suspended?: boolean } = {},
): Standing {
  const t = now.getTime()
  const start = startOf(l.starts)
  const end = startOf(l.ends) + DAY // the end date is included
  const lock = end + l.graceDays * DAY
  const base = {
    ends: l.ends,
    locks: new Date(lock - DAY).toISOString().slice(0, 10),
  }
  const days = (until: number) => Math.max(0, Math.ceil((until - t) / DAY) - 1)
  const closed = { canUse: false, canChange: false }
  if (l.machine && opts.machine && l.machine !== opts.machine)
    return { state: 'wrong-machine', daysLeft: 0, ...base, ...closed }
  if (opts.suspended)
    return { state: 'locked', daysLeft: 0, ...base, ...closed }
  if (t < start)
    return {
      state: 'not-started',
      daysLeft: Math.ceil((start - t) / DAY),
      ...base,
      ...closed,
    }
  if (t < end)
    return {
      state: 'valid',
      daysLeft: days(end),
      ...base,
      canUse: true,
      canChange: true,
    }
  if (t < lock)
    return {
      state: 'grace',
      daysLeft: days(lock),
      ...base,
      canUse: true,
      canChange: false,
    }
  return { state: 'locked', daysLeft: 0, ...base, ...closed }
}

/* Signed status. When a school server reaches the control service, the answer says whether the campus is
   suspended. It is signed with the same key, so a cached answer on the server cannot be edited. */
// `nonce` is the random value the school server sent with this check-in. It proves the answer was made for
// this request, so an old answer recorded off the network cannot be played back.
export type CampusStatus = {
  campusId: string
  suspended: boolean
  at: string
  nonce?: string
}

export function signStatus(status: CampusStatus, privateKeyPem: string) {
  const payload = Buffer.from(JSON.stringify(status), 'utf8')
  const signature = sign(null, payload, createPrivateKey(privateKeyPem))
  return `T2SS1.${b64(payload)}.${b64(signature)}`
}

export function readStatus(
  token: string,
  publicKeyPem: string,
): CampusStatus | null {
  const parts = token.trim().split('.')
  if (parts.length !== 3 || parts[0] !== 'T2SS1') return null
  try {
    const payload = Buffer.from(parts[1], 'base64url')
    const signature = Buffer.from(parts[2], 'base64url')
    if (!verify(null, payload, createPublicKey(publicKeyPem), signature))
      return null
    const s = JSON.parse(payload.toString('utf8')) as CampusStatus
    return typeof s.campusId === 'string' && typeof s.suspended === 'boolean'
      ? s
      : null
  } catch {
    return null
  }
}
