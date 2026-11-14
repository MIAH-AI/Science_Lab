// What the school screens can ask a school server to do. Every function runs only on a school server,
// checks the caller's session and role there (SEC-9), and refuses changes while the licence is read-only.
import { notFound } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import {
  deleteCookie,
  getCookie,
  getRequestHeader,
  getRequestHost,
  setCookie,
} from '@tanstack/react-start/server'
import { readCampusHeader, type PublicStatus } from '../campus/status'
import { getDb } from '../server/db'
import {
  SESSION_HOURS,
  approve,
  cancelInvite,
  disable,
  invite,
  inviteClass,
  inviteFor,
  join,
  listPeople,
  resetCode,
  seatsUsed,
  sessionUser,
  signIn,
  signOut,
  userCount,
  type Fail,
  type Role,
  type SchoolUser,
} from './accounts'

const COOKIE = 't2s_school'
const isCampus = () => process.env.APP_MODE === 'campus'

function standing(): PublicStatus {
  const s = isCampus()
    ? readCampusHeader(getRequestHeader('x-t2s-campus'))
    : null
  if (!s) throw notFound()
  return s
}
function sameSite() {
  const origin = getRequestHeader('origin')
  if (origin && new URL(origin).host !== getRequestHost())
    throw new Error('This request did not come from this server.')
}
const READ_ONLY: Fail = {
  ok: false,
  error:
    'The school’s licence has ended, so nothing can be changed. Ask tough2simple to extend it.',
}
const me = async () => sessionUser(await getDb(), getCookie(COOKIE), new Date())

// For changes by a signed-in person: a school server, our own page, a usable licence, a session.
async function changer(): Promise<{ user: SchoolUser; seats: number } | Fail> {
  const s = standing()
  sameSite()
  if (!s.canChange) return READ_ONLY
  const user = await me()
  if (!user) return { ok: false, error: 'signed-out' }
  return { user, seats: s.seats ?? 0 }
}

export type SchoolMe =
  | { campus: false }
  | {
      campus: true
      user: SchoolUser | null
      school: string
      campusName: string
      canChange: boolean
      hasUsers: boolean
    }

// Who is looking at the page. On the hosted site the answer is simply "not a school server".
export const schoolMe = createServerFn({ method: 'GET' }).handler(
  async (): Promise<SchoolMe> => {
    const s = isCampus()
      ? readCampusHeader(getRequestHeader('x-t2s-campus'))
      : null
    if (!s) return { campus: false }
    const db = await getDb()
    return {
      campus: true,
      user: await me(),
      school: s.school ?? '',
      campusName: s.campus ?? '',
      canChange: s.canChange,
      hasUsers: (await userCount(db)) > 0,
    }
  },
)

export const schoolSignIn = createServerFn({ method: 'POST' })
  .validator((d: { username: string; password: string }) => d)
  .handler(async ({ data }) => {
    standing()
    sameSite()
    const res = await signIn(await getDb(), data, new Date())
    if (!res.ok) return res
    // School servers are plain http on the school's own network, so the cookie cannot be marked Secure.
    setCookie(COOKIE, res.token, {
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
      maxAge: SESSION_HOURS * 3600,
    })
    return { ok: true as const, role: res.user.role }
  })

export const schoolSignOut = createServerFn({ method: 'POST' }).handler(
  async () => {
    standing()
    await signOut(await getDb(), getCookie(COOKIE))
    deleteCookie(COOKIE, { path: '/' })
    return { ok: true as const }
  },
)

export const inviteLookup = createServerFn({ method: 'POST' })
  .validator((d: { code: string }) => d)
  .handler(async ({ data }) => {
    standing()
    return inviteFor(await getDb(), data.code, new Date())
  })

export const schoolJoin = createServerFn({ method: 'POST' })
  .validator((d: { code: string; password: string }) => d)
  .handler(async ({ data }) => {
    const s = standing()
    sameSite()
    if (!s.canChange) return READ_ONLY
    return join(await getDb(), data, new Date())
  })

export const peopleList = createServerFn({ method: 'GET' }).handler(
  async () => {
    const s = standing()
    const user = await me()
    if (!user) return { ok: false as const, error: 'signed-out' }
    const db = await getDb()
    const people = await listPeople(db, user)
    if (!Array.isArray(people)) return people
    return {
      ok: true as const,
      people,
      used: await seatsUsed(db),
      seats: s.seats ?? 0,
      canChange: s.canChange,
      school: s.school ?? '',
      campusName: s.campus ?? '',
      me: user,
    }
  },
)

export const personInvite = createServerFn({ method: 'POST' })
  .validator((d: { name: string; role: Role; class: string }) => d)
  .handler(async ({ data }) => {
    const c = await changer()
    return 'user' in c ? invite(await getDb(), c.user, data, new Date()) : c
  })

export const classInvite = createServerFn({ method: 'POST' })
  .validator((d: { names: string; class: string }) => d)
  .handler(async ({ data }) => {
    const c = await changer()
    return 'user' in c
      ? inviteClass(await getDb(), c.user, data, new Date())
      : c
  })

export const personApprove = createServerFn({ method: 'POST' })
  .validator((d: { id: string }) => d)
  .handler(async ({ data }) => {
    const c = await changer()
    return 'user' in c
      ? approve(await getDb(), c.user, data.id, c.seats, new Date())
      : c
  })

export const personDisable = createServerFn({ method: 'POST' })
  .validator((d: { id: string }) => d)
  .handler(async ({ data }) => {
    const c = await changer()
    return 'user' in c ? disable(await getDb(), c.user, data.id, new Date()) : c
  })

export const personResetCode = createServerFn({ method: 'POST' })
  .validator((d: { id: string }) => d)
  .handler(async ({ data }) => {
    const c = await changer()
    return 'user' in c
      ? resetCode(await getDb(), c.user, data.id, new Date())
      : c
  })

export const inviteCancel = createServerFn({ method: 'POST' })
  .validator((d: { id: string }) => d)
  .handler(async ({ data }) => {
    const c = await changer()
    return 'user' in c ? cancelInvite(await getDb(), c.user, data.id) : c
  })
