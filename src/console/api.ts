// Everything the console's screens can ask the server to do. Each function checks, on the server, that the
// console is switched on and that the caller is a signed-in platform admin (SEC-9): hiding a button is not
// a permission check.
import { notFound } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import {
  deleteCookie,
  getCookie,
  getRequestHeader,
  getRequestHost,
  getRequestIP,
  setCookie,
} from '@tanstack/react-start/server'
import {
  SESSION_HOURS,
  acceptInvite,
  adminCount,
  createFirstAdmin,
  disableAdmin,
  inviteAdmin,
  listAdmins,
  listAudit,
  sessionAdmin,
  signIn,
  signOut,
  type Admin,
} from '../server/admins'
import { config } from '../server/config'
import {
  addCampus,
  createSchool,
  getSchool,
  issueLicence,
  listSchools,
  newEnrolToken,
  setSuspended,
  updateSchoolTerms,
  type IssueInput,
} from '../server/control'
import { getDb } from '../server/db'

const COOKIE = 't2s_console'

function mustBeOn() {
  if (!config.consoleEnabled()) throw notFound()
}

// Changes must come from the console's own pages, not from a form on another site.
function sameSite() {
  const origin = getRequestHeader('origin')
  if (origin && new URL(origin).host !== getRequestHost())
    throw new Error('This request did not come from the console.')
}

async function me(): Promise<Admin | null> {
  return sessionAdmin(await getDb(), getCookie(COOKIE), new Date())
}

// For every call except signing in: the console is on, the request is ours, and the caller is an admin.
async function admin(): Promise<Admin> {
  mustBeOn()
  sameSite()
  const who = await me()
  if (!who) throw new Error('signed-out')
  return who
}

export type ConsoleState = {
  enabled: boolean
  hasAdmins: boolean
  me: Admin | null
  // False when licences cannot be issued yet because the signing key is missing from the settings.
  canSign: boolean
}

export const consoleState = createServerFn({ method: 'GET' }).handler(
  async (): Promise<ConsoleState> => {
    if (!config.consoleEnabled())
      return { enabled: false, hasAdmins: false, me: null, canSign: false }
    const db = await getDb()
    return {
      enabled: true,
      hasAdmins: (await adminCount(db)) > 0,
      me: await me(),
      canSign: !!config.signingKey(),
    }
  },
)

export const setupFirstAdmin = createServerFn({ method: 'POST' })
  .validator(
    (d: { setupKey: string; email: string; name: string; password: string }) =>
      d,
  )
  .handler(async ({ data }) => {
    mustBeOn()
    sameSite()
    return createFirstAdmin(await getDb(), data)
  })

export const acceptAdminInvite = createServerFn({ method: 'POST' })
  .validator((d: { token: string; password: string }) => d)
  .handler(async ({ data }) => {
    mustBeOn()
    sameSite()
    return acceptInvite(await getDb(), data, new Date())
  })

export const consoleSignIn = createServerFn({ method: 'POST' })
  .validator((d: { email: string; password: string; code?: string }) => d)
  .handler(async ({ data }) => {
    mustBeOn()
    sameSite()
    const res = await signIn(
      await getDb(),
      {
        ...data,
        ip: getRequestIP({ xForwardedFor: true }),
        userAgent: getRequestHeader('user-agent'),
      },
      new Date(),
    )
    if (!res.ok) return res
    const host = getRequestHost()
    setCookie(COOKIE, res.token, {
      httpOnly: true,
      sameSite: 'strict',
      // Browsers accept plain http only on this computer, which is what local work and tests use.
      secure: !/^(localhost|127\.0\.0\.1)(:|$)/.test(host),
      path: '/',
      maxAge: SESSION_HOURS * 3600,
    })
    return { ok: true as const, name: res.admin.name }
  })

export const consoleSignOut = createServerFn({ method: 'POST' }).handler(
  async () => {
    mustBeOn()
    await signOut(await getDb(), getCookie(COOKIE))
    deleteCookie(COOKIE, { path: '/' })
    return { ok: true as const }
  },
)

export const schoolsList = createServerFn({ method: 'GET' }).handler(
  async () => {
    await admin()
    return listSchools(await getDb(), new Date())
  },
)

export const schoolDetail = createServerFn({ method: 'GET' })
  .validator((d: { id: string }) => d)
  .handler(async ({ data }) => {
    await admin()
    if (!/^[0-9a-f-]{36}$/.test(data.id)) return null
    return getSchool(await getDb(), data.id, new Date())
  })

export const schoolCreate = createServerFn({ method: 'POST' })
  .validator((d: { name: string; termMonths: number; graceDays: number }) => d)
  .handler(async ({ data }) => createSchool(await getDb(), await admin(), data))

export const schoolTerms = createServerFn({ method: 'POST' })
  .validator((d: { id: string; termMonths: number; graceDays: number }) => d)
  .handler(async ({ data }) =>
    updateSchoolTerms(await getDb(), await admin(), data.id, data),
  )

export const campusAdd = createServerFn({ method: 'POST' })
  .validator((d: { schoolId: string; name: string }) => d)
  .handler(async ({ data }) =>
    addCampus(await getDb(), await admin(), data.schoolId, data.name),
  )

export const licenceIssue = createServerFn({ method: 'POST' })
  .validator((d: IssueInput) => d)
  .handler(async ({ data }) => {
    const res = await issueLicence(
      await getDb(),
      await admin(),
      data,
      new Date(),
    )
    return res.ok ? { ok: true as const, id: res.id } : res
  })

export const campusSuspend = createServerFn({ method: 'POST' })
  .validator((d: { campusId: string; suspended: boolean; reason: string }) => d)
  .handler(async ({ data }) =>
    setSuspended(
      await getDb(),
      await admin(),
      data.campusId,
      data.suspended,
      data.reason,
      new Date(),
    ),
  )

export const campusEnrolCode = createServerFn({ method: 'POST' })
  .validator((d: { campusId: string }) => d)
  .handler(async ({ data }) =>
    newEnrolToken(await getDb(), await admin(), data.campusId, new Date()),
  )

export const adminsList = createServerFn({ method: 'GET' }).handler(
  async () => {
    await admin()
    return listAdmins(await getDb())
  },
)

export const adminInvite = createServerFn({ method: 'POST' })
  .validator((d: { email: string; name: string }) => d)
  .handler(async ({ data }) =>
    inviteAdmin(await getDb(), await admin(), data, new Date()),
  )

export const adminDisable = createServerFn({ method: 'POST' })
  .validator((d: { id: string }) => d)
  .handler(async ({ data }) =>
    disableAdmin(await getDb(), await admin(), data.id, new Date()),
  )

export const auditList = createServerFn({ method: 'GET' }).handler(async () => {
  await admin()
  return listAudit(await getDb(), 200)
})
