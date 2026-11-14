// Accounts on a school server: invite codes, joining, approval within the seat limit, sign-in.
// Student devices are offline, so there is no email anywhere: an invite is a short code the school admin
// hands out, and the person chooses a password the first time they use it (roles-and-permissions.md).
import { randomInt } from 'node:crypto'
import { iso, type Db } from '../server/db'
import {
  checkPassword,
  hashPassword,
  newToken,
  tokenHash,
} from '../server/secrets'

export const ROLES = ['admin', 'teacher', 'student', 'principal'] as const
export type Role = (typeof ROLES)[number]
export const ROLE_NAME: Record<Role, string> = {
  admin: 'School admin',
  teacher: 'Teacher',
  student: 'Student',
  principal: 'Principal',
}
export const SESSION_HOURS = 12
export const MAX_FAILS = 5
export const LOCK_MINUTES = 15
export const INVITE_DAYS = 30

export type SchoolUser = {
  id: string
  name: string
  role: Role
  username: string
  class: string
}
type Row = {
  id: string
  role: Role
  name: string
  class: string
  username: string | null
  password_hash: string | null
  status: 'invited' | 'pending' | 'active' | 'disabled'
  invite_code: string | null
  invite_expires: unknown
  failed_count: number
  locked_until: unknown
}
export type Fail = { ok: false; error: string }
const fail = (error: string): Fail => ({ ok: false, error })

const log = (
  db: Db,
  userId: string | null,
  action: string,
  target = '',
  detail = '',
) =>
  db.query(
    'INSERT INTO school_audit (user_id, action, target, detail) VALUES ($1, $2, $3, $4)',
    [userId, action, target, detail],
  )

// Codes are read aloud and typed on phones, so they avoid letters and digits that look alike.
const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
export function newInviteCode() {
  let out = ''
  for (let i = 0; i < 8; i++) out += ALPHABET[randomInt(ALPHABET.length)]
  return out.slice(0, 4) + '-' + out.slice(4)
}
const cleanCode = (code: string) => {
  const c = code.toUpperCase().replace(/[^A-Z0-9]/g, '')
  return c.length === 8 ? c.slice(0, 4) + '-' + c.slice(4) : ''
}

// A password a student can remember: at least 8 characters. Staff accounts ask for 10.
export function passwordProblem(password: string, role: Role): string | null {
  const min = role === 'student' ? 8 : 10
  if (password.length < min) return `Use at least ${min} characters.`
  if (password.length > 200) return 'Use fewer than 200 characters.'
  if (/^(.)\1+$/.test(password)) return 'Do not repeat one character.'
  return null
}

export const seatsUsed = async (db: Db) =>
  Number(
    (
      await db.query<{ n: number }>(
        `SELECT count(*) AS n FROM school_users WHERE status = 'active'`,
      )
    )[0].n,
  )
export const userCount = async (db: Db) =>
  Number(
    (await db.query<{ n: number }>('SELECT count(*) AS n FROM school_users'))[0]
      .n,
  )

export type InviteInput = { name: string; role: Role; class?: string }

// One invite. `by` is null only for the first school admin, made by the installer on the server itself.
export async function invite(
  db: Db,
  by: SchoolUser | null,
  input: InviteInput,
  now: Date,
): Promise<{ ok: true; id: string; code: string } | Fail> {
  const name = input.name.trim().replace(/\s+/g, ' ')
  if (name.length < 2) return fail('Enter the person’s name.')
  if (name.length > 80) return fail('That name is too long.')
  if (!ROLES.includes(input.role))
    return fail(
      'Choose what they are: student, teacher, principal or school admin.',
    )
  if (by && by.role !== 'admin')
    return fail('Only the school admin can invite people.')
  if (!by && (await userCount(db)) > 0)
    return fail(
      'This server already has a school admin. Ask them to invite you.',
    )
  const expires = new Date(
    now.getTime() + INVITE_DAYS * 86_400_000,
  ).toISOString()
  for (let attempt = 0; attempt < 5; attempt++) {
    const code = newInviteCode()
    try {
      const [{ id }] = await db.query<{ id: string }>(
        `INSERT INTO school_users (role, name, class, status, invite_code, invite_expires)
         VALUES ($1, $2, $3, 'invited', $4, $5) RETURNING id`,
        [
          input.role,
          name,
          (input.class ?? '').trim().slice(0, 40),
          code,
          expires,
        ],
      )
      await log(db, by?.id ?? null, 'user.invite', name, ROLE_NAME[input.role])
      return { ok: true, id, code }
    } catch (e) {
      if (!/duplicate key|unique/i.test(String(e))) throw e // the code is taken: try another
    }
  }
  return fail('Could not make a code. Try again.')
}

// A whole class at once: one name on each line. Blank lines are skipped.
export async function inviteClass(
  db: Db,
  by: SchoolUser,
  input: { names: string; class: string; role?: Role },
  now: Date,
): Promise<{ ok: true; made: { name: string; code: string }[] } | Fail> {
  const names = input.names
    .split(/\r?\n/)
    .map((n) => n.trim())
    .filter(Boolean)
  if (!names.length) return fail('Paste the class list, one name on each line.')
  if (names.length > 500)
    return fail('That is more than 500 names. Add the class in parts.')
  const made: { name: string; code: string }[] = []
  for (const name of names) {
    const res = await invite(
      db,
      by,
      { name, role: input.role ?? 'student', class: input.class },
      now,
    )
    if (!res.ok) return fail(`“${name}”: ${res.error}`)
    made.push({ name, code: res.code })
  }
  return { ok: true, made }
}

// "Ada Obi" becomes ada.obi, then ada.obi2 if that is taken.
async function freeUsername(db: Db, name: string) {
  const base =
    name
      .normalize('NFKD')
      .replace(/[̀-ͯ]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '.')
      .replace(/^\.+|\.+$/g, '')
      .slice(0, 30) || 'user'
  const taken = new Set(
    (
      await db.query<{ username: string }>(
        'SELECT username FROM school_users WHERE username LIKE $1',
        [base + '%'],
      )
    ).map((r) => r.username),
  )
  if (!taken.has(base)) return base
  for (let n = 2; ; n++) if (!taken.has(base + n)) return base + n
}

// Who a code belongs to, so the join page can greet them before they choose a password.
export async function inviteFor(db: Db, code: string, now: Date) {
  const row = (
    await db.query<Row>('SELECT * FROM school_users WHERE invite_code = $1', [
      cleanCode(code),
    ])
  )[0]
  if (!row || new Date(iso(row.invite_expires)!) < now) return null
  return {
    name: row.name,
    role: row.role,
    class: row.class,
    // true when this is a new-password code for someone who already has an account
    reset: row.status !== 'invited',
  }
}

// The person uses their code and chooses a password. They then wait for the school admin's approval.
// The very first school admin has nobody to approve them, so they become active at once.
export async function join(
  db: Db,
  input: { code: string; password: string },
  now: Date,
): Promise<
  { ok: true; username: string; name: string; waiting: boolean } | Fail
> {
  const code = cleanCode(input.code)
  const row = code
    ? (
        await db.query<Row>(
          'SELECT * FROM school_users WHERE invite_code = $1',
          [code],
        )
      )[0]
    : undefined
  if (!row)
    return fail(
      'That code is not right, or it has already been used. Check it with your school admin.',
    )
  if (new Date(iso(row.invite_expires)!) < now)
    return fail('That code has run out. Ask your school admin for a new one.')
  const problem = passwordProblem(input.password, row.role)
  if (problem) return fail(problem)
  if (row.status !== 'invited') {
    // A password reset: same account, same username, same approval. Only the password changes.
    const reset = await db.query<{ id: string }>(
      `UPDATE school_users SET password_hash = $2, invite_code = NULL, failed_count = 0, locked_until = NULL
       WHERE id = $1 AND invite_code = $3 RETURNING id`,
      [row.id, hashPassword(input.password), code],
    )
    if (!reset.length) return fail('That code has already been used.')
    await log(db, row.id, 'user.new-password', row.name)
    return {
      ok: true,
      username: row.username!,
      name: row.name,
      waiting: row.status === 'pending',
    }
  }
  const first = (
    await db.query<{ n: number }>(
      `SELECT count(*) AS n FROM school_users WHERE status <> 'invited'`,
    )
  )[0]
  const firstAdmin = row.role === 'admin' && Number(first.n) === 0
  const username = await freeUsername(db, row.name)
  const done = await db.query<{ id: string }>(
    `UPDATE school_users SET username = $2, password_hash = $3, invite_code = NULL, status = $4, approved_at = $5
     WHERE id = $1 AND status = 'invited' RETURNING id`,
    [
      row.id,
      username,
      hashPassword(input.password),
      firstAdmin ? 'active' : 'pending',
      firstAdmin ? now.toISOString() : null,
    ],
  )
  if (!done.length) return fail('That code has already been used.')
  await log(db, row.id, 'user.join', row.name, username)
  return { ok: true, username, name: row.name, waiting: !firstAdmin }
}

const adminOnly = (by: SchoolUser) =>
  by.role === 'admin' ? null : fail('Only the school admin can do that.')

// Approves someone who has joined. Refused when every seat on the licence is in use (ADM-5). The count and
// the change are one statement, so two admins approving at the same moment cannot go over the limit.
export async function approve(
  db: Db,
  by: SchoolUser,
  id: string,
  seats: number,
  now: Date,
): Promise<{ ok: true } | Fail> {
  const no = adminOnly(by)
  if (no) return no
  const rows = await db.query<{ name: string }>(
    `UPDATE school_users SET status = 'active', approved_at = $2, disabled_at = NULL
     WHERE id = $1 AND status IN ('pending', 'disabled') AND password_hash IS NOT NULL
       AND (SELECT count(*) FROM school_users WHERE status = 'active') < $3
     RETURNING name`,
    [id, now.toISOString(), seats],
  )
  if (rows.length) {
    await log(db, by.id, 'user.approve', rows[0].name)
    return { ok: true }
  }
  const who = (
    await db
      .query<Row>('SELECT * FROM school_users WHERE id = $1', [id])
      .catch(() => [])
  )[0]
  if (!who) return fail('That person was not found.')
  if (who.status === 'active') return fail(`${who.name} is already approved.`)
  if (who.status === 'invited')
    return fail(`${who.name} has not used their code yet.`)
  return fail(
    `${who.name} was not approved. All ${seats} seats are in use. Disable someone who has left, or ask tough2simple for more seats.`,
  )
}

// Disabling frees the seat and ends their sessions. Nothing they did is deleted (ADM-6).
export async function disable(
  db: Db,
  by: SchoolUser,
  id: string,
  now: Date,
): Promise<{ ok: true } | Fail> {
  const no = adminOnly(by)
  if (no) return no
  if (id === by.id) return fail('You cannot disable your own account.')
  const rows = await db.query<{ name: string }>(
    `UPDATE school_users SET status = 'disabled', disabled_at = $2 WHERE id = $1 AND status IN ('active', 'pending') RETURNING name`,
    [id, now.toISOString()],
  )
  if (!rows.length) return fail('That account is not active.')
  await db.query('DELETE FROM school_sessions WHERE user_id = $1', [id])
  await log(db, by.id, 'user.disable', rows[0].name)
  return { ok: true }
}

// For someone who has forgotten their password: a one-time code to choose a new one. Their old password and
// sessions stop working at once. The account, username, approval and seat stay as they are.
export async function resetCode(
  db: Db,
  by: SchoolUser,
  id: string,
  now: Date,
): Promise<{ ok: true; code: string; name: string } | Fail> {
  const no = adminOnly(by)
  if (no) return no
  const expires = new Date(
    now.getTime() + INVITE_DAYS * 86_400_000,
  ).toISOString()
  for (let attempt = 0; attempt < 5; attempt++) {
    const code = newInviteCode()
    try {
      const rows = await db.query<{ name: string }>(
        `UPDATE school_users SET invite_code = $2, invite_expires = $3, password_hash = NULL
         WHERE id = $1 AND status IN ('active', 'pending') RETURNING name`,
        [id, code, expires],
      )
      if (!rows.length)
        return fail(
          'That person does not have a working account. Invite them instead.',
        )
      await db.query('DELETE FROM school_sessions WHERE user_id = $1', [id])
      await log(db, by.id, 'user.reset-code', rows[0].name)
      return { ok: true, code, name: rows[0].name }
    } catch (e) {
      if (!/duplicate key|unique/i.test(String(e))) throw e
    }
  }
  return fail('Could not make a code. Try again.')
}

// Cancels an invite that has not been used.
export async function cancelInvite(
  db: Db,
  by: SchoolUser,
  id: string,
): Promise<{ ok: true } | Fail> {
  const no = adminOnly(by)
  if (no) return no
  const rows = await db.query<{ name: string }>(
    `DELETE FROM school_users WHERE id = $1 AND status = 'invited' RETURNING name`,
    [id],
  )
  if (!rows.length) return fail('That invite has already been used.')
  await log(db, by.id, 'user.cancel-invite', rows[0].name)
  return { ok: true }
}

export type SignIn =
  { ok: true; token: string; user: SchoolUser; expires: string } | Fail
const DUMMY = hashPassword('not a real password')

export async function signIn(
  db: Db,
  input: { username: string; password: string },
  now: Date,
): Promise<SignIn> {
  const wrong = fail('That username and password do not match.')
  const row = (
    await db.query<Row>('SELECT * FROM school_users WHERE username = $1', [
      input.username.trim().toLowerCase(),
    ])
  )[0]
  if (!row || !row.password_hash) {
    checkPassword(input.password, DUMMY)
    return wrong
  }
  if (row.locked_until && new Date(iso(row.locked_until)!) > now) {
    const mins = Math.ceil(
      (new Date(iso(row.locked_until)!).getTime() - now.getTime()) / 60_000,
    )
    return fail(
      `Too many wrong tries. Wait ${mins} minute${mins === 1 ? '' : 's'}, or ask your school admin.`,
    )
  }
  if (!checkPassword(input.password, row.password_hash)) {
    const count = row.failed_count + 1
    const lock = count >= MAX_FAILS
    await db.query(
      'UPDATE school_users SET failed_count = $2, locked_until = $3 WHERE id = $1',
      [
        row.id,
        lock ? 0 : count,
        lock
          ? new Date(now.getTime() + LOCK_MINUTES * 60_000).toISOString()
          : null,
      ],
    )
    return wrong
  }
  if (row.status === 'pending')
    return fail('Your school admin has not approved your account yet.')
  if (row.status === 'disabled')
    return fail('This account has been switched off. Ask your school admin.')
  const token = newToken()
  const expires = new Date(now.getTime() + SESSION_HOURS * 3_600_000)
  await db.query(
    'UPDATE school_users SET failed_count = 0, locked_until = NULL WHERE id = $1',
    [row.id],
  )
  await db.query(
    'INSERT INTO school_sessions (token_hash, user_id, expires_at) VALUES ($1, $2, $3)',
    [tokenHash(token), row.id, expires.toISOString()],
  )
  return {
    ok: true,
    token,
    expires: expires.toISOString(),
    user: {
      id: row.id,
      name: row.name,
      role: row.role,
      username: row.username!,
      class: row.class,
    },
  }
}

export async function sessionUser(
  db: Db,
  token: string | undefined,
  now: Date,
): Promise<SchoolUser | null> {
  if (!token) return null
  const rows = await db.query<SchoolUser>(
    `SELECT u.id, u.name, u.role, u.username, u.class FROM school_sessions s JOIN school_users u ON u.id = s.user_id
     WHERE s.token_hash = $1 AND s.expires_at > $2 AND u.status = 'active'`,
    [tokenHash(token), now.toISOString()],
  )
  return rows[0] ?? null
}

export async function signOut(db: Db, token: string | undefined) {
  if (token)
    await db.query('DELETE FROM school_sessions WHERE token_hash = $1', [
      tokenHash(token),
    ])
}

export type Person = {
  id: string
  name: string
  role: Role
  class: string
  username: string
  status: Row['status']
  // An unused invite code, or an unused new-password code. Shown to the school admin until it is used.
  code: string
}

export async function listPeople(
  db: Db,
  by: SchoolUser,
): Promise<Person[] | Fail> {
  const no = adminOnly(by)
  if (no) return no
  const rows = await db.query<Row>('SELECT * FROM school_users ORDER BY seq')
  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    role: r.role,
    class: r.class,
    username: r.username ?? '',
    status: r.status,
    code: r.invite_code ?? '',
  }))
}
