// What the app knows about the licence when it runs on a school server. The school server (server.ts)
// works it out and passes it in with every request; on the hosted site there is none.
import { createServerFn } from '@tanstack/react-start'
import { getRequestHeader } from '@tanstack/react-start/server'

export type PublicStatus = {
  state:
    | 'valid'
    | 'grace'
    | 'locked'
    | 'not-started'
    | 'wrong-machine'
    | 'none'
    | 'invalid'
  canUse: boolean
  canChange: boolean
  message: string
  suspended: boolean
  school: string | null
  campus: string | null
  kind: 'trial' | 'active' | null
  starts: string | null
  ends: string | null
  locks: string | null
  daysLeft: number
  seats: number | null
  fingerprint: string
  fingerprintSource: 'system' | 'stored'
  enrolled: boolean
  version: string
}

export function readCampusHeader(
  value: string | undefined,
): PublicStatus | null {
  if (!value) return null
  try {
    return JSON.parse(decodeURIComponent(value)) as PublicStatus
  } catch {
    return null
  }
}

export const campusStatus = createServerFn({ method: 'GET' }).handler(
  async (): Promise<PublicStatus | null> =>
    process.env.APP_MODE === 'campus'
      ? readCampusHeader(getRequestHeader('x-t2s-campus'))
      : null,
)
