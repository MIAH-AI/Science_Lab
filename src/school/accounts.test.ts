// @vitest-environment node
// School accounts against a real embedded database with the school server's own tables.
import { beforeEach, describe, expect, it } from 'vitest'
import { memoryDb, type Db } from '../server/db'
import {
  LOCK_MINUTES,
  MAX_FAILS,
  approve,
  cancelInvite,
  disable,
  invite,
  inviteClass,
  inviteFor,
  join,
  listPeople,
  newInviteCode,
  resetCode,
  seatsUsed,
  sessionUser,
  signIn,
  signOut,
  type Person,
  type SchoolUser,
} from './accounts'
import { SCHOOL_MIGRATIONS } from './schema'

let db: Db
let now: Date
let admin: SchoolUser
const later = (minutes: number) => new Date(now.getTime() + minutes * 60_000)
const PASS = 'a staff password',
  KID = 'kidpass8'

async function firstAdmin() {
  const inv = await invite(
    db,
    null,
    { name: 'Ngozi Admin', role: 'admin' },
    now,
  )
  if (!inv.ok) throw new Error(inv.error)
  const j = await join(db, { code: inv.code, password: PASS }, now)
  if (!j.ok) throw new Error(j.error)
  const s = await signIn(db, { username: j.username, password: PASS }, now)
  if (!s.ok) throw new Error(s.error)
  return s.user
}
// Invite a student and have them join; they are then waiting for approval.
async function joined(name: string, klass = 'SS2 Science') {
  const inv = await invite(
    db,
    admin,
    { name, role: 'student', class: klass },
    now,
  )
  if (!inv.ok) throw new Error(inv.error)
  const j = await join(db, { code: inv.code, password: KID }, now)
  if (!j.ok) throw new Error(j.error)
  return { id: inv.id, username: j.username }
}
const people = async () => (await listPeople(db, admin)) as Person[]

beforeEach(async () => {
  db = await memoryDb(SCHOOL_MIGRATIONS)
  now = new Date('2027-01-11T08:00:00Z')
  admin = await firstAdmin()
})

describe('the first school admin', () => {
  it('is made by the installer, becomes active at once and uses a seat', async () => {
    expect(admin).toMatchObject({
      name: 'Ngozi Admin',
      role: 'admin',
      username: 'ngozi.admin',
    })
    expect(await seatsUsed(db)).toBe(1)
  })
  it('can only be made once that way', async () => {
    expect(
      await invite(db, null, { name: 'Someone Else', role: 'admin' }, now),
    ).toMatchObject({
      ok: false,
      error: expect.stringMatching(/already has a school admin/),
    })
  })
})

describe('invites and joining', () => {
  it('codes are 8 easy-to-read characters, all different', () => {
    const codes = new Set(Array.from({ length: 200 }, newInviteCode))
    expect(codes.size).toBe(200)
    for (const c of codes)
      expect(c).toMatch(/^[A-HJ-NP-Z2-9]{4}-[A-HJ-NP-Z2-9]{4}$/)
  })

  it('a student types the code (in any case, with or without the dash), sets a password and waits', async () => {
    const inv = await invite(
      db,
      admin,
      { name: 'Tunde Bello', role: 'student', class: 'SS2 Science' },
      now,
    )
    if (!inv.ok) throw new Error()
    expect(
      await inviteFor(db, inv.code.toLowerCase().replace('-', ' '), now),
    ).toEqual({
      name: 'Tunde Bello',
      role: 'student',
      class: 'SS2 Science',
      reset: false,
    })
    expect(
      await join(db, { code: inv.code, password: 'short' }, now),
    ).toMatchObject({ ok: false, error: 'Use at least 8 characters.' })
    const j = await join(
      db,
      { code: inv.code.toLowerCase().replace('-', ''), password: KID },
      now,
    )
    expect(j).toEqual({
      ok: true,
      username: 'tunde.bello',
      name: 'Tunde Bello',
      waiting: true,
    })
    expect(
      await join(db, { code: inv.code, password: KID }, now),
    ).toMatchObject({ ok: false })
    expect(
      await signIn(db, { username: 'tunde.bello', password: KID }, now),
    ).toMatchObject({
      ok: false,
      error: expect.stringMatching(/not approved your account yet/),
    })
    expect(await seatsUsed(db)).toBe(1)
  })

  it('two people with the same name get different usernames', async () => {
    const a = await joined('Ada Obi')
    const b = await joined('Ada Obi')
    expect([a.username, b.username]).toEqual(['ada.obi', 'ada.obi2'])
  })

  it('a code runs out after 30 days, and a wrong code says nothing about who exists', async () => {
    const inv = await invite(
      db,
      admin,
      { name: 'Late Joiner', role: 'student' },
      now,
    )
    if (!inv.ok) throw new Error()
    expect(
      await join(db, { code: inv.code, password: KID }, later(31 * 24 * 60)),
    ).toMatchObject({ ok: false, error: expect.stringMatching(/run out/) })
    expect(
      await join(db, { code: 'AAAA-BBBB', password: KID }, now),
    ).toMatchObject({
      ok: false,
      error: expect.stringMatching(/not right, or it has already been used/),
    })
    expect(await inviteFor(db, 'AAAA-BBBB', now)).toBeNull()
  })

  it('a pasted class list makes one code for each name and skips blank lines', async () => {
    const res = await inviteClass(
      db,
      admin,
      {
        names: 'Student One\n\n  Student Two \nStudent Three\n',
        class: 'SS1 Science',
      },
      now,
    )
    if (!res.ok) throw new Error(res.error)
    expect(res.made.map((m) => m.name)).toEqual([
      'Student One',
      'Student Two',
      'Student Three',
    ])
    expect(new Set(res.made.map((m) => m.code)).size).toBe(3)
    const invited = (await people()).filter((p) => p.status === 'invited')
    expect(invited).toHaveLength(3)
    expect(invited[0]).toMatchObject({
      class: 'SS1 Science',
      role: 'student',
      code: res.made[0].code,
    })
  })

  it('an unused invite can be cancelled; a used one cannot', async () => {
    const inv = await invite(
      db,
      admin,
      { name: 'Wrong Person', role: 'teacher' },
      now,
    )
    if (!inv.ok) throw new Error()
    expect(await cancelInvite(db, admin, inv.id)).toEqual({ ok: true })
    expect(
      await join(db, { code: inv.code, password: PASS }, now),
    ).toMatchObject({ ok: false })
    const j = await joined('Real Student')
    expect(await cancelInvite(db, admin, j.id)).toMatchObject({ ok: false })
  })
})

describe('approval and seats', () => {
  it('approving lets them sign in and uses a seat', async () => {
    const s = await joined('Tunde Bello')
    expect(await approve(db, admin, s.id, 10, now)).toEqual({ ok: true })
    expect(await seatsUsed(db)).toBe(2)
    const res = await signIn(db, { username: s.username, password: KID }, now)
    expect(res).toMatchObject({
      ok: true,
      user: { role: 'student', class: 'SS2 Science' },
    })
    expect(await approve(db, admin, s.id, 10, now)).toMatchObject({
      ok: false,
      error: 'Tunde Bello is already approved.',
    })
  })

  it('is refused when every seat is in use, and the person stays waiting', async () => {
    const a = await joined('Student A')
    const b = await joined('Student B')
    expect(await approve(db, admin, a.id, 2, now)).toEqual({ ok: true }) // admin + A = 2 of 2
    const res = await approve(db, admin, b.id, 2, now)
    expect(res).toMatchObject({
      ok: false,
      error: expect.stringMatching(
        /Student B was not approved\. All 2 seats are in use/,
      ),
    })
    expect((await people()).find((p) => p.id === b.id)!.status).toBe('pending')
    expect(await seatsUsed(db)).toBe(2)
  })

  it('two approvals at the same moment cannot go over the limit', async () => {
    const a = await joined('Student A')
    const b = await joined('Student B')
    const both = await Promise.all([
      approve(db, admin, a.id, 2, now),
      approve(db, admin, b.id, 2, now),
    ])
    expect(both.filter((r) => r.ok)).toHaveLength(1)
    expect(await seatsUsed(db)).toBe(2)
  })

  it('disabling frees the seat, ends their session and keeps the account; re-enabling needs a free seat', async () => {
    const a = await joined('Student A')
    const b = await joined('Student B')
    await approve(db, admin, a.id, 2, now)
    const session = await signIn(
      db,
      { username: a.username, password: KID },
      now,
    )
    if (!session.ok) throw new Error()
    expect(await disable(db, admin, admin.id, now)).toMatchObject({ ok: false })
    expect(await disable(db, admin, a.id, now)).toEqual({ ok: true })
    expect(await sessionUser(db, session.token, now)).toBeNull()
    expect(
      await signIn(db, { username: a.username, password: KID }, now),
    ).toMatchObject({ ok: false, error: expect.stringMatching(/switched off/) })
    expect(await seatsUsed(db)).toBe(1)
    expect((await people()).find((p) => p.id === a.id)).toMatchObject({
      status: 'disabled',
      username: 'student.a',
    })
    expect(await approve(db, admin, b.id, 2, now)).toEqual({ ok: true })
    expect(await approve(db, admin, a.id, 2, now)).toMatchObject({
      ok: false,
      error: expect.stringMatching(/All 2 seats are in use/),
    })
  })

  it('only the school admin can invite, approve, disable or see the list', async () => {
    const t = await invite(
      db,
      admin,
      { name: 'Teacher T', role: 'teacher' },
      now,
    )
    if (!t.ok) throw new Error()
    await join(db, { code: t.code, password: PASS }, now)
    await approve(db, admin, t.id, 10, now)
    const teacher = (
      (await signIn(db, { username: 'teacher.t', password: PASS }, now)) as {
        user: SchoolUser
      }
    ).user
    const s = await joined('Student A')
    expect(
      await invite(db, teacher, { name: 'X Y', role: 'student' }, now),
    ).toMatchObject({ ok: false })
    expect(await approve(db, teacher, s.id, 10, now)).toMatchObject({
      ok: false,
    })
    expect(await disable(db, teacher, s.id, now)).toMatchObject({ ok: false })
    expect(await listPeople(db, teacher)).toMatchObject({ ok: false })
  })
})

describe('a forgotten password', () => {
  it('the admin gives a one-time code; the old password and session stop, the account and seat stay', async () => {
    const s = await joined('Tunde Bello')
    await approve(db, admin, s.id, 10, now)
    const session = await signIn(
      db,
      { username: s.username, password: KID },
      now,
    )
    if (!session.ok) throw new Error()
    const reset = await resetCode(db, admin, s.id, now)
    if (!reset.ok) throw new Error(reset.error)
    expect(await sessionUser(db, session.token, now)).toBeNull()
    expect(
      await signIn(db, { username: s.username, password: KID }, now),
    ).toMatchObject({ ok: false })
    expect(await seatsUsed(db)).toBe(2)
    expect((await people()).find((p) => p.id === s.id)).toMatchObject({
      status: 'active',
      code: reset.code,
    })
    expect(await inviteFor(db, reset.code, now)).toMatchObject({
      name: 'Tunde Bello',
      reset: true,
    })
    expect(
      await join(db, { code: reset.code, password: 'newpass88' }, now),
    ).toEqual({
      ok: true,
      username: 'tunde.bello',
      name: 'Tunde Bello',
      waiting: false,
    })
    expect(
      (
        await signIn(
          db,
          { username: 'tunde.bello', password: 'newpass88' },
          now,
        )
      ).ok,
    ).toBe(true)
    expect(
      await join(db, { code: reset.code, password: 'another88' }, now),
    ).toMatchObject({ ok: false })
    // a new-password code lasts one day
    const again = await resetCode(db, admin, s.id, now)
    if (!again.ok) throw new Error()
    expect(
      await join(
        db,
        { code: again.code, password: 'another88' },
        later(25 * 60),
      ),
    ).toMatchObject({ ok: false, error: expect.stringMatching(/run out/) })
    expect(
      (await join(db, { code: again.code, password: 'another88' }, later(60)))
        .ok,
    ).toBe(true)
    expect((await people()).find((p) => p.id === s.id)!.code).toBe('')
  })
  it('only the admin can do it, and not for someone who has not joined or is disabled', async () => {
    const s = await joined('Tunde Bello')
    await approve(db, admin, s.id, 10, now)
    const student = (
      (await signIn(db, { username: s.username, password: KID }, now)) as {
        user: SchoolUser
      }
    ).user
    expect(await resetCode(db, student, admin.id, now)).toMatchObject({
      ok: false,
    })
    const inv = await invite(
      db,
      admin,
      { name: 'Not Joined', role: 'student' },
      now,
    )
    expect(
      await resetCode(db, admin, (inv as { id: string }).id, now),
    ).toMatchObject({ ok: false })
    await disable(db, admin, s.id, now)
    expect(await resetCode(db, admin, s.id, now)).toMatchObject({ ok: false })
  })
})

describe('signing in', () => {
  it('gives the same answer for a wrong password and an unknown username', async () => {
    const a = await signIn(
      db,
      { username: 'ngozi.admin', password: 'wrong password' },
      now,
    )
    const b = await signIn(db, { username: 'nobody', password: PASS }, now)
    expect(a).toEqual(b)
  })
  it(`locks for ${LOCK_MINUTES} minutes after ${MAX_FAILS} wrong tries`, async () => {
    for (let i = 0; i < MAX_FAILS; i++)
      await signIn(
        db,
        { username: 'ngozi.admin', password: 'wrong password' },
        now,
      )
    expect(
      await signIn(db, { username: 'ngozi.admin', password: PASS }, later(1)),
    ).toMatchObject({
      ok: false,
      error: expect.stringMatching(/Wait 14 minutes/),
    })
    expect(
      (
        await signIn(
          db,
          { username: 'ngozi.admin', password: PASS },
          later(LOCK_MINUTES + 1),
        )
      ).ok,
    ).toBe(true)
  })
  it('counts tries for each device: guessing from one phone does not lock the admin out on theirs', async () => {
    for (let i = 0; i < MAX_FAILS + 3; i++)
      await signIn(
        db,
        {
          username: 'ngozi.admin',
          password: 'wrong password',
          ip: '10.0.0.66',
        },
        now,
      )
    expect(
      await signIn(
        db,
        { username: 'ngozi.admin', password: PASS, ip: '10.0.0.66' },
        later(1),
      ),
    ).toMatchObject({
      ok: false,
      error: expect.stringMatching(/Too many wrong tries/),
    })
    expect(
      (
        await signIn(
          db,
          { username: 'ngozi.admin', password: PASS, ip: '10.0.0.5' },
          later(1),
        )
      ).ok,
    ).toBe(true)
  })
  it('a burst of guesses sent at the same moment still stops at the limit', async () => {
    const burst = await Promise.all(
      Array.from({ length: 12 }, (_, i) =>
        signIn(
          db,
          { username: 'ngozi.admin', password: 'guess ' + i, ip: '10.0.0.66' },
          now,
        ),
      ),
    )
    expect(
      burst.filter((r) => !r.ok && /do not match/.test(r.error)),
    ).toHaveLength(MAX_FAILS)
    expect(
      burst.filter((r) => !r.ok && /Too many wrong tries/.test(r.error)),
    ).toHaveLength(12 - MAX_FAILS)
    expect(
      await signIn(
        db,
        { username: 'ngozi.admin', password: PASS, ip: '10.0.0.66' },
        later(1),
      ),
    ).toMatchObject({ ok: false })
  })
  it('treats a username that does not exist exactly like one that does', async () => {
    const tries = async (username: string) => {
      const out: string[] = []
      for (let i = 0; i < MAX_FAILS + 1; i++) {
        const r = await signIn(
          db,
          { username, password: 'wrong password', ip: '10.0.0.7' },
          now,
        )
        out.push(r.ok ? 'ok' : r.error)
      }
      return out
    }
    expect(await tries('nobody.here')).toEqual(await tries('ngozi.admin'))
  })
  it('a session lasts 12 hours and signing out ends it', async () => {
    const s = await signIn(
      db,
      { username: 'Ngozi.Admin ', password: PASS },
      now,
    )
    if (!s.ok) throw new Error()
    expect(await sessionUser(db, s.token, later(11 * 60))).toMatchObject({
      username: 'ngozi.admin',
    })
    expect(await sessionUser(db, s.token, later(12 * 60 + 1))).toBeNull()
    await signOut(db, s.token)
    expect(await sessionUser(db, s.token, later(1))).toBeNull()
  })
})
