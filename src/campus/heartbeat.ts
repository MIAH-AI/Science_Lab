// The only part of a school server that talks to the internet. It reports in to the control service and
// brings back the current licence and the signed suspension note. Failing quietly is correct: most
// school servers are offline most of the time.
import { randomBytes } from 'node:crypto'
import { readStatus } from '../server/licence'
import { installLicence, type LicenceClock } from './standing'
import type { Store } from './store'

// The server's secret travels with each check-in, so the control service must be reached over https.
// Plain http is allowed only to this same computer, which is how it is tested.
const NEEDS_HTTPS = 'The control service address must start with https://'
export const safeAddress = (url: string) => {
  try {
    const u = new URL(url)
    return (
      u.protocol === 'https:' ||
      (u.protocol === 'http:' &&
        ['localhost', '127.0.0.1', '[::1]'].includes(u.hostname))
    )
  } catch {
    return false
  }
}

export type Beat =
  | { ok: true; licenceChanged: boolean; suspended: boolean }
  | { ok: false; error: string }

export async function beat(
  store: Store,
  opts: {
    publicKey: string
    machine: string
    version: string
    seatsUsed?: number
    clock?: LicenceClock
    fetch?: typeof fetch
  },
): Promise<Beat> {
  const link = store.link()
  if (!link) return { ok: false, error: 'This server is not enrolled.' }
  let body: {
    ok: boolean
    error?: string
    licence?: string | null
    status?: string
  }
  if (!safeAddress(link.url)) return { ok: false, error: NEEDS_HTTPS }
  const nonce = randomBytes(16).toString('hex')
  try {
    const res = await (opts.fetch ?? fetch)(
      link.url.replace(/\/$/, '') + '/api/campus/heartbeat',
      {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          campusId: link.campusId,
          secret: link.secret,
          machine: opts.machine,
          version: opts.version,
          seatsUsed: opts.seatsUsed,
          nonce,
        }),
        signal: AbortSignal.timeout(15_000),
      },
    )
    body = (await res.json()) as typeof body
  } catch {
    return { ok: false, error: 'The control service could not be reached.' }
  }
  if (!body.ok)
    return {
      ok: false,
      error: body.error ?? 'The control service refused the heartbeat.',
    }
  // Trust nothing that is not signed with our key.
  const status = body.status ? readStatus(body.status, opts.publicKey) : null
  if (!status || status.campusId !== link.campusId)
    return { ok: false, error: 'The answer was not signed by tough2simple.' }
  // The answer must be the one made for this request, and never older than the note already held.
  // Otherwise someone on the network path could play back an old "not suspended" answer.
  const held = readStatus(store.status(), opts.publicKey)
  if (status.nonce !== nonce || (held && held.at > status.at))
    return { ok: false, error: 'The answer was not made for this check-in.' }
  store.setStatus(body.status!)
  opts.clock?.trust(Date.parse(status.at))
  let licenceChanged = false
  if (body.licence && body.licence.trim() !== store.licence()) {
    const res = installLicence(store, body.licence, opts)
    licenceChanged = res.ok
  }
  return { ok: true, licenceChanged, suspended: status.suspended }
}

// First contact: swap the one-time enrolment code for this server's secret and its licence.
export async function enrol(
  store: Store,
  opts: {
    url: string
    code: string
    publicKey: string
    machine: string
    version: string
    fetch?: typeof fetch
  },
): Promise<
  | { ok: true; school: string; campus: string; licensed: boolean }
  | { ok: false; error: string }
> {
  let body: {
    ok: boolean
    error?: string
    campusId?: string
    secret?: string
    school?: string
    campus?: string
    licence?: string | null
  }
  if (!safeAddress(opts.url)) return { ok: false, error: NEEDS_HTTPS }
  try {
    const res = await (opts.fetch ?? fetch)(
      opts.url.replace(/\/$/, '') + '/api/campus/enrol',
      {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          token: opts.code,
          machine: opts.machine,
          version: opts.version,
        }),
        signal: AbortSignal.timeout(20_000),
      },
    )
    body = (await res.json()) as typeof body
  } catch {
    return {
      ok: false,
      error:
        'The control service could not be reached. Check the address and the internet connection.',
    }
  }
  if (!body.ok || !body.campusId || !body.secret)
    return { ok: false, error: body.error ?? 'Enrolment was refused.' }
  store.setLink({ url: opts.url, campusId: body.campusId, secret: body.secret })
  let licensed = false
  if (body.licence) {
    const res = installLicence(store, body.licence, opts)
    if (!res.ok)
      return {
        ok: false,
        error: 'Enrolled, but the licence could not be installed: ' + res.error,
      }
    licensed = true
  }
  return {
    ok: true,
    school: body.school ?? '',
    campus: body.campus ?? '',
    licensed,
  }
}
