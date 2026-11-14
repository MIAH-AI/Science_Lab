// Where this school server stands: may people use it, may they change things, and why not when not.
import {
  readStatus,
  standing,
  verifyLicence,
  type Licence,
  type Standing,
} from '../server/licence'
import type { Store } from './store'

export type CampusStanding = {
  // 'none' = no licence installed yet; 'invalid' = the file is not a licence we signed.
  state: Standing['state'] | 'none' | 'invalid'
  canUse: boolean
  canChange: boolean
  // One plain sentence for the person looking at the screen.
  message: string
  licence: Licence | null
  daysLeft: number
  ends: string | null
  locks: string | null
  suspended: boolean
}

const closed = {
  canUse: false,
  canChange: false,
  daysLeft: 0,
  ends: null,
  locks: null,
  suspended: false,
}

/* The licence clock. A server that is offline for months has only its own clock, and that clock can be
   set back. So the server remembers the latest time it has seen and never goes earlier than that; and
   while it is running, the remembered time moves forward with real elapsed time even if the wall clock
   is wrong. A trusted time from the control service (a heartbeat) can move it back to the truth. */
export function licenceClock(
  store: Store,
  wall: () => number,
  uptime: () => number,
) {
  let seen = store.clock()
  let lastUptime = uptime()
  let lastSaved = 0
  return {
    now() {
      const up = uptime()
      seen = Math.max(wall(), seen + Math.max(0, up - lastUptime))
      lastUptime = up
      if (seen - lastSaved > 60_000) {
        store.setClock(seen)
        lastSaved = seen
      }
      return new Date(seen)
    },
    // Called with the control service's own time from a signed answer.
    trust(time: number) {
      seen = time
      lastUptime = uptime()
      store.setClock(seen)
      lastSaved = seen
    },
  }
}
export type LicenceClock = ReturnType<typeof licenceClock>

export function campusStanding(
  store: Store,
  opts: { publicKey: string; machine: string; now: Date },
): CampusStanding {
  const token = store.licence()
  if (!token)
    return {
      ...closed,
      state: 'none',
      licence: null,
      message: 'No licence has been installed on this server yet.',
    }
  if (!opts.publicKey)
    return {
      ...closed,
      state: 'invalid',
      licence: null,
      message:
        'This server has no key to check licences with. It was not packaged correctly.',
    }
  const read = verifyLicence(token, opts.publicKey)
  if (!read.ok)
    return { ...closed, state: 'invalid', licence: null, message: read.reason }
  const l = read.licence
  // A full licence must be made for this server. A trial may be installed before the server is tied down.
  if (l.kind === 'active' && !l.machine)
    return {
      ...closed,
      state: 'wrong-machine',
      licence: l,
      message:
        'This full licence is not tied to a server. Ask tough2simple for one made for this server.',
    }
  const status = readStatus(store.status(), opts.publicKey)
  const suspended =
    !!status && status.campusId === l.campusId && status.suspended
  const s = standing(l, opts.now, { machine: opts.machine, suspended })
  const until = (date: string) =>
    new Date(date + 'T00:00:00Z').toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      timeZone: 'UTC',
    })
  const message =
    s.state === 'valid'
      ? `Licensed to ${l.school}, ${l.campus}, until ${until(l.ends)}.`
      : s.state === 'grace'
        ? `The licence ended on ${until(l.ends)}. Everything can still be read and exported until ${until(s.locks)}, but nothing can be changed.`
        : s.state === 'not-started'
          ? `The licence starts on ${until(l.starts)}.`
          : s.state === 'wrong-machine'
            ? 'This licence was made for a different server.'
            : suspended
              ? 'tough2simple has suspended this school’s licence. Contact tough2simple.'
              : `The licence ended on ${until(l.ends)} and the read-only period is over. Ask tough2simple to extend it.`
  return {
    state: s.state,
    canUse: s.canUse,
    canChange: s.canChange,
    message,
    licence: l,
    daysLeft: s.daysLeft,
    ends: s.ends,
    locks: s.locks,
    suspended,
  }
}

// Installs a licence if it is one we signed and it belongs on this server. Returns why not otherwise.
export function installLicence(
  store: Store,
  token: string,
  opts: { publicKey: string; machine: string },
): { ok: true; licence: Licence } | { ok: false; error: string } {
  const read = verifyLicence(token, opts.publicKey)
  if (!read.ok) return { ok: false, error: read.reason }
  const l = read.licence
  if (l.machine && l.machine !== opts.machine)
    return { ok: false, error: 'This licence was made for a different server.' }
  if (l.kind === 'active' && !l.machine)
    return {
      ok: false,
      error:
        'A full licence must be made for this server. Give tough2simple this server’s fingerprint.',
    }
  const current = verifyLicence(store.licence(), opts.publicKey)
  if (current.ok && current.licence.campusId !== l.campusId)
    return {
      ok: false,
      error: `This server is set up for ${current.licence.school}, ${current.licence.campus}. The licence is for a different campus.`,
    }
  if (current.ok && current.licence.issued > l.issued)
    return { ok: false, error: 'A newer licence is already installed.' }
  store.setLicence(token)
  return { ok: true, licence: l }
}
