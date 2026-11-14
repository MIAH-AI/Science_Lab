// Platform admins: the Plysoft Tech Team accounts that run the console. Every account signs in with a
// password and a code from an authenticator app (SEC-7). Repeated failures lock the account for a while (SEC-6).
import { timingSafeEqual } from 'node:crypto'
import { config } from './config'
import { iso, type Db } from './db'
import {
  checkPassword,
  dummyHash,
  checkTotp,
  hashPassword,
  newToken,
  newTotpSecret,
  passwordProblem,
  tokenHash,
  totpUri,
} from './secrets'

export const SESSION_HOURS = 8
export const MAX_FAILS = 5
export const LOCK_MINUTES = 15
export const INVITE_HOURS = 72

export type Admin = { id: string; email: string; name: string }
type AdminRow = Admin & {
  password_hash: string | null
  totp_secret: string | null
  totp_confirmed_at: unknown
  last_totp_step: string | number | null
  failed_count: number
  locked_until: unknown
  disabled_at: unknown
}
export type Fail = { ok: false; error: string }
const fail = (error: string): Fail => ({ ok: false, error })

const cleanEmail = (email: string) => email.trim().toLowerCase()
const emailOk = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
const sameText = (a: string, b: string) => {
  const x = Buffer.from(a)
  const y = Buffer.from(b)
  return x.length === y.length && timingSafeEqual(x, y)
}

export async function audit(
  db: Db,
  adminId: string | null,
  action: string,
  target = '',
  detail = '',
) {
  await db.query(
    'INSERT INTO audit (admin_id, action, target, detail) VALUES ($1, $2, $3, $4)',
    [adminId, action, target, detail],
  )
}

export const adminCount = async (db: Db) =>
  Number(
    (
      await db.query<{ n: number }>('SELECT count(*) AS n FROM platform_admins')
    )[0].n,
  )

const byEmail = async (db: Db, email: string) =>
  (
    await db.query<AdminRow>('SELECT * FROM platform_admins WHERE email = $1', [
      cleanEmail(email),
    ])
  )[0] as AdminRow | undefined

// The very first account. Allowed once, while there are no admins, and only with the setup key that was
// put in the site settings. Afterwards more admins are invited from inside the console.
export async function createFirstAdmin(
  db: Db,
  input: { setupKey: string; email: string; name: string; password: string },
): Promise<{ ok: true; email: string; secret: string; uri: string } | Fail> {
  const key = config.setupKey()
  if (!key) return fail('Setup is switched off. Set CONSOLE_SETUP_KEY first.')
  if (!sameText(input.setupKey.trim(), key))
    return fail('That setup key is not right.')
  const email = cleanEmail(input.email)
  if (!emailOk(email)) return fail('Enter a full email address.')
  if (!input.name.trim()) return fail('Enter your name.')
  const problem = passwordProblem(input.password)
  if (problem) return fail(problem)
  const secret = newTotpSecret()
  const rows = await db.query<{ id: string }>(
    `INSERT INTO platform_admins (email, name, password_hash, totp_secret)
     SELECT $1, $2, $3, $4 WHERE NOT EXISTS (SELECT 1 FROM platform_admins)
     RETURNING id`,
    [email, input.name.trim(), await hashPassword(input.password), secret],
  )
  if (!rows.length)
    return fail('The console already has an admin. Ask them to invite you.')
  await audit(db, rows[0].id, 'admin.first', email)
  return { ok: true, email, secret, uri: totpUri(secret, email) }
}

// Adds another admin. They get a one-time link to choose their own password and set up their authenticator app.
export async function inviteAdmin(
  db: Db,
  by: Admin,
  input: { email: string; name: string },
  now: Date,
): Promise<{ ok: true; token: string; expires: string } | Fail> {
  const email = cleanEmail(input.email)
  if (!emailOk(email)) return fail('Enter a full email address.')
  if (!input.name.trim()) return fail('Enter their name.')
  // Someone whose invite ran out, or whose account was disabled, can be invited again: the same row is
  // reused with its password and authenticator cleared, so they start from scratch.
  const existing = await byEmail(db, email)
  if (existing && existing.totp_confirmed_at && !existing.disabled_at)
    return fail('That person is already an admin.')
  let id: string
  if (existing) {
    id = existing.id
    await db.query(
      `UPDATE platform_admins SET name = $2, password_hash = NULL, totp_secret = NULL, totp_confirmed_at = NULL,
         last_totp_step = NULL, failed_count = 0, locked_until = NULL, disabled_at = NULL WHERE id = $1`,
      [id, input.name.trim()],
    )
    await db.query('DELETE FROM admin_invites WHERE admin_id = $1', [id])
    await db.query('DELETE FROM admin_sessions WHERE admin_id = $1', [id])
  } else {
    id = (
      await db.query<{ id: string }>(
        'INSERT INTO platform_admins (email, name) VALUES ($1, $2) RETURNING id',
        [email, input.name.trim()],
      )
    )[0].id
  }
  const token = newToken()
  const expires = new Date(now.getTime() + INVITE_HOURS * 3_600_000)
  await db.query(
    'INSERT INTO admin_invites (token_hash, admin_id, expires_at) VALUES ($1, $2, $3)',
    [tokenHash(token), id, expires.toISOString()],
  )
  await audit(db, by.id, 'admin.invite', email)
  return { ok: true, token, expires: expires.toISOString() }
}

export async function acceptInvite(
  db: Db,
  input: { token: string; password: string },
  now: Date,
): Promise<{ ok: true; email: string; secret: string; uri: string } | Fail> {
  const problem = passwordProblem(input.password)
  if (problem) return fail(problem)
  const secret = newTotpSecret()
  const used = await db.query<{ admin_id: string }>(
    `UPDATE admin_invites SET used_at = $2
     WHERE token_hash = $1 AND used_at IS NULL AND expires_at > $2 RETURNING admin_id`,
    [tokenHash(input.token), now.toISOString()],
  )
  if (!used.length)
    return fail(
      'This invite link has been used or has run out. Ask for a new one.',
    )
  const [admin] = await db.query<{ email: string }>(
    'UPDATE platform_admins SET password_hash = $2, totp_secret = $3 WHERE id = $1 RETURNING email',
    [used[0].admin_id, await hashPassword(input.password), secret],
  )
  await audit(db, used[0].admin_id, 'admin.accept', admin.email)
  return {
    ok: true,
    email: admin.email,
    secret,
    uri: totpUri(secret, admin.email),
  }
}

export type SignIn =
  | { ok: true; token: string; admin: Admin; expires: string }
  // need: 'code' = password was right, now send the 6-digit code.
  // need: 'setup' = password was right but the authenticator app is not set up yet; finish that first.
  | { ok: false; need: 'code' }
  | { ok: false; need: 'setup'; secret: string; uri: string }
  | Fail

// One call does both steps: send email and password, and when asked, send them again with the code.
// A first correct code also finishes authenticator setup.
export async function signIn(
  db: Db,
  input: {
    email: string
    password: string
    code?: string
    ip?: string
    userAgent?: string
  },
  now: Date,
): Promise<SignIn> {
  const wrong = fail('That email and password do not match.')
  const admin = await byEmail(db, input.email)
  if (!admin || admin.disabled_at || !admin.password_hash) {
    await checkPassword(input.password, await dummyHash())
    return wrong
  }
  if (admin.locked_until && new Date(iso(admin.locked_until)!) > now) {
    const mins = Math.ceil(
      (new Date(iso(admin.locked_until)!).getTime() - now.getTime()) / 60_000,
    )
    return fail(
      `Too many wrong tries. This account is locked for ${mins} more minute${mins === 1 ? '' : 's'}.`,
    )
  }
  // Count this try before checking anything, in one statement. A burst of guesses sent at the same moment
  // then cannot all read the same count and slip under the limit.
  const [{ n }] = await db.query<{ n: number }>(
    'UPDATE platform_admins SET failed_count = failed_count + 1 WHERE id = $1 RETURNING failed_count AS n',
    [admin.id],
  )
  const tries = Number(n)
  const failed = async (what: string) => {
    const lock = tries >= MAX_FAILS
    if (lock)
      await db.query(
        'UPDATE platform_admins SET failed_count = 0, locked_until = $2 WHERE id = $1',
        [
          admin.id,
          new Date(now.getTime() + LOCK_MINUTES * 60_000).toISOString(),
        ],
      )
    await audit(
      db,
      admin.id,
      lock ? 'signin.locked' : 'signin.failed',
      admin.email,
      what,
    )
  }
  if (tries > MAX_FAILS) {
    await failed('burst')
    return fail(
      `Too many wrong tries. This account is locked for ${LOCK_MINUTES} more minutes.`,
    )
  }
  if (!(await checkPassword(input.password, admin.password_hash))) {
    await failed('password')
    return wrong
  }
  const secret = admin.totp_secret!
  const code = input.code?.trim()
  if (!code) {
    // The password was right and the code has not been asked for yet: not a failed try.
    await db.query(
      'UPDATE platform_admins SET failed_count = GREATEST(failed_count - 1, 0) WHERE id = $1',
      [admin.id],
    )
    return admin.totp_confirmed_at
      ? { ok: false, need: 'code' }
      : { ok: false, need: 'setup', secret, uri: totpUri(secret, admin.email) }
  }
  const step = checkTotp(secret, code, now.getTime())
  // Claim the code's 30-second step in one statement, so the same code cannot sign in twice, even at once.
  const claimed =
    step === null
      ? []
      : await db.query(
          `UPDATE platform_admins SET last_totp_step = $2
           WHERE id = $1 AND (last_totp_step IS NULL OR last_totp_step < $2) RETURNING id`,
          [admin.id, step],
        )
  if (!claimed.length) {
    await failed('code')
    return fail(
      'That code is not right, or it has been used. Wait for the next one.',
    )
  }
  const token = newToken()
  const expires = new Date(now.getTime() + SESSION_HOURS * 3_600_000)
  await db.query(
    `UPDATE platform_admins SET failed_count = 0, locked_until = NULL,
       totp_confirmed_at = COALESCE(totp_confirmed_at, $2) WHERE id = $1`,
    [admin.id, now.toISOString()],
  )
  await db.query('DELETE FROM admin_sessions WHERE expires_at <= $1', [
    now.toISOString(),
  ])
  await db.query(
    'INSERT INTO admin_sessions (token_hash, admin_id, expires_at, ip, user_agent) VALUES ($1, $2, $3, $4, $5)',
    [
      tokenHash(token),
      admin.id,
      expires.toISOString(),
      input.ip ?? null,
      (input.userAgent ?? '').slice(0, 300),
    ],
  )
  await audit(db, admin.id, 'signin.ok', admin.email)
  return {
    ok: true,
    token,
    expires: expires.toISOString(),
    admin: { id: admin.id, email: admin.email, name: admin.name },
  }
}

export async function sessionAdmin(
  db: Db,
  token: string | undefined,
  now: Date,
): Promise<Admin | null> {
  if (!token) return null
  const rows = await db.query<Admin>(
    `SELECT a.id, a.email, a.name FROM admin_sessions s JOIN platform_admins a ON a.id = s.admin_id
     WHERE s.token_hash = $1 AND s.expires_at > $2 AND a.disabled_at IS NULL`,
    [tokenHash(token), now.toISOString()],
  )
  return rows[0] ?? null
}

export async function signOut(db: Db, token: string | undefined) {
  if (token)
    await db.query('DELETE FROM admin_sessions WHERE token_hash = $1', [
      tokenHash(token),
    ])
}

export async function listAdmins(db: Db) {
  const rows = await db.query<AdminRow>(
    'SELECT * FROM platform_admins ORDER BY created_at',
  )
  return rows.map((a) => ({
    id: a.id,
    email: a.email,
    name: a.name,
    state: a.disabled_at
      ? ('disabled' as const)
      : a.totp_confirmed_at
        ? ('active' as const)
        : ('invited' as const),
  }))
}

// Disabling ends that person's sessions at once. The last working admin cannot be disabled.
export async function disableAdmin(db: Db, by: Admin, id: string, now: Date) {
  if (id === by.id) return fail('You cannot disable your own account.')
  const rows = await db.query<{ email: string }>(
    'UPDATE platform_admins SET disabled_at = $2 WHERE id = $1 AND disabled_at IS NULL RETURNING email',
    [id, now.toISOString()],
  )
  if (!rows.length) return fail('That account is already disabled.')
  await db.query('DELETE FROM admin_sessions WHERE admin_id = $1', [id])
  await audit(db, by.id, 'admin.disable', rows[0].email)
  return { ok: true as const }
}

export async function listAudit(db: Db, limit = 100) {
  const rows = await db.query<{
    id: string
    at: unknown
    name: string | null
    action: string
    target: string
    detail: string
  }>(
    `SELECT u.id, u.at, a.name, u.action, u.target, u.detail FROM audit u
     LEFT JOIN platform_admins a ON a.id = u.admin_id ORDER BY u.id DESC LIMIT $1`,
    [limit],
  )
  return rows.map((r) => ({
    id: String(r.id),
    at: iso(r.at)!,
    by: r.name ?? 'system',
    action: r.action,
    target: r.target,
    detail: r.detail,
  }))
}
