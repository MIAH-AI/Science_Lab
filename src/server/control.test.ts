// @vitest-environment node
// The control service against a real (embedded) Postgres: nothing here is mocked.
import { beforeAll, beforeEach, describe, expect, it } from 'vitest'
import {
  LOCK_MINUTES,
  MAX_FAILS,
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
} from './admins'
import {
  addCampus,
  createSchool,
  enrolCampus,
  getSchool,
  heartbeat,
  issueLicence,
  listSchools,
  newEnrolToken,
  setSuspended,
  tieToMachine,
  updateSchoolTerms,
} from './control'
import { memoryDb, type Db } from './db'
import { newKeyPair, readStatus, verifyLicence } from './licence'
import { totpCode } from './secrets'

const keys = newKeyPair()
const PASSWORD = 'a long enough password'
const MACHINE = 'a'.repeat(64)
let db: Db
let now: Date
const later = (minutes: number) => new Date(now.getTime() + minutes * 60_000)

beforeAll(() => {
  process.env.CONSOLE_SETUP_KEY = 'setup-key-for-tests'
  process.env.LICENCE_SIGNING_KEY = keys.privateKey
  process.env.LICENCE_PUBLIC_KEY = keys.publicKey
})
beforeEach(async () => {
  db = await memoryDb()
  now = new Date('2027-01-04T09:00:00Z')
})

async function firstAdmin(): Promise<{
  admin: Admin
  token: string
  secret: string
}> {
  const made = await createFirstAdmin(db, {
    setupKey: 'setup-key-for-tests',
    email: 'Ada@Example.org ',
    name: 'Ada',
    password: PASSWORD,
  })
  if (!made.ok) throw new Error(made.error)
  const res = await signIn(
    db,
    {
      email: 'ada@example.org',
      password: PASSWORD,
      code: totpCode(made.secret, now.getTime()),
    },
    now,
  )
  if (!res.ok) throw new Error('sign-in failed')
  return { admin: res.admin, token: res.token, secret: made.secret }
}

describe('the first platform admin', () => {
  it('needs the setup key, and can only be created once', async () => {
    const input = { email: 'ada@example.org', name: 'Ada', password: PASSWORD }
    expect(
      await createFirstAdmin(db, { ...input, setupKey: 'guess' }),
    ).toMatchObject({ ok: false })
    expect(
      await createFirstAdmin(db, {
        ...input,
        setupKey: 'setup-key-for-tests',
        password: 'short',
      }),
    ).toMatchObject({ ok: false })
    expect(await adminCount(db)).toBe(0)
    const made = await createFirstAdmin(db, {
      ...input,
      setupKey: 'setup-key-for-tests',
    })
    expect(made).toMatchObject({ ok: true, email: 'ada@example.org' })
    const again = await createFirstAdmin(db, {
      ...input,
      email: 'eve@example.org',
      setupKey: 'setup-key-for-tests',
    })
    expect(again).toMatchObject({
      ok: false,
      error: expect.stringMatching(/already has an admin/),
    })
    expect(await adminCount(db)).toBe(1)
  })

  it('is refused when no setup key has been configured', async () => {
    process.env.CONSOLE_SETUP_KEY = ''
    const res = await createFirstAdmin(db, {
      setupKey: '',
      email: 'a@b.co',
      name: 'A',
      password: PASSWORD,
    })
    process.env.CONSOLE_SETUP_KEY = 'setup-key-for-tests'
    expect(res.ok).toBe(false)
  })
})

describe('signing in to the console', () => {
  it('takes a password and then a code; the first code finishes authenticator setup', async () => {
    const made = await createFirstAdmin(db, {
      setupKey: 'setup-key-for-tests',
      email: 'ada@example.org',
      name: 'Ada',
      password: PASSWORD,
    })
    if (!made.ok) throw new Error()
    expect(
      await signIn(db, { email: 'ada@example.org', password: PASSWORD }, now),
    ).toMatchObject({ ok: false, need: 'setup', secret: made.secret })
    const ok = await signIn(
      db,
      {
        email: 'ada@example.org',
        password: PASSWORD,
        code: totpCode(made.secret, now.getTime()),
      },
      now,
    )
    expect(ok.ok).toBe(true)
    // from now on a correct password alone only asks for the code
    expect(
      await signIn(
        db,
        { email: 'ada@example.org', password: PASSWORD },
        later(1),
      ),
    ).toEqual({ ok: false, need: 'code' })
    expect((await listAdmins(db))[0].state).toBe('active')
  })

  it('gives the same answer for a wrong password and an unknown email', async () => {
    await firstAdmin()
    const a = await signIn(
      db,
      { email: 'ada@example.org', password: 'wrong password here' },
      now,
    )
    const b = await signIn(
      db,
      { email: 'nobody@example.org', password: PASSWORD },
      now,
    )
    expect(a).toEqual(b)
  })

  it('refuses a code that has already been used', async () => {
    const { secret } = await firstAdmin()
    const code = totpCode(secret, now.getTime())
    expect(
      await signIn(
        db,
        { email: 'ada@example.org', password: PASSWORD, code },
        now,
      ),
    ).toMatchObject({ ok: false })
    const next = later(1)
    expect(
      (
        await signIn(
          db,
          {
            email: 'ada@example.org',
            password: PASSWORD,
            code: totpCode(secret, next.getTime()),
          },
          next,
        )
      ).ok,
    ).toBe(true)
  })

  it(`locks the account for ${LOCK_MINUTES} minutes after ${MAX_FAILS} wrong tries`, async () => {
    const { secret } = await firstAdmin()
    for (let i = 0; i < MAX_FAILS; i++)
      await signIn(
        db,
        { email: 'ada@example.org', password: 'wrong password here' },
        now,
      )
    const t = later(2)
    const locked = await signIn(
      db,
      {
        email: 'ada@example.org',
        password: PASSWORD,
        code: totpCode(secret, t.getTime()),
      },
      t,
    )
    expect(locked).toMatchObject({
      ok: false,
      error: expect.stringMatching(/locked for 13 more minutes/),
    })
    const after = later(LOCK_MINUTES + 1)
    expect(
      (
        await signIn(
          db,
          {
            email: 'ada@example.org',
            password: PASSWORD,
            code: totpCode(secret, after.getTime()),
          },
          after,
        )
      ).ok,
    ).toBe(true)
    expect((await listAudit(db)).map((a) => a.action)).toContain(
      'signin.locked',
    )
  })

  it('a session lasts 8 hours, and signing out ends it', async () => {
    const { token } = await firstAdmin()
    expect(await sessionAdmin(db, token, later(7 * 60))).toMatchObject({
      email: 'ada@example.org',
    })
    expect(await sessionAdmin(db, token, later(8 * 60 + 1))).toBeNull()
    expect(await sessionAdmin(db, 'not-a-token', now)).toBeNull()
    await signOut(db, token)
    expect(await sessionAdmin(db, token, later(1))).toBeNull()
  })

  it('invites a second admin with a one-time link, and disabling them ends their session', async () => {
    const { admin } = await firstAdmin()
    const inv = await inviteAdmin(
      db,
      admin,
      { email: 'bola@example.org', name: 'Bola' },
      now,
    )
    if (!inv.ok) throw new Error()
    expect(
      await inviteAdmin(
        db,
        admin,
        { email: 'bola@example.org', name: 'Bola' },
        now,
      ),
    ).toMatchObject({ ok: false })
    expect(
      await acceptInvite(
        db,
        { token: inv.token, password: PASSWORD },
        later(73 * 60),
      ),
    ).toMatchObject({ ok: false })
    const acc = await acceptInvite(
      db,
      { token: inv.token, password: PASSWORD },
      later(5),
    )
    if (!acc.ok) throw new Error(acc.error)
    expect(
      await acceptInvite(
        db,
        { token: inv.token, password: PASSWORD },
        later(6),
      ),
    ).toMatchObject({ ok: false })
    const t = later(10)
    const res = await signIn(
      db,
      {
        email: 'bola@example.org',
        password: PASSWORD,
        code: totpCode(acc.secret, t.getTime()),
      },
      t,
    )
    if (!res.ok) throw new Error()
    expect(await disableAdmin(db, admin, admin.id, t)).toMatchObject({
      ok: false,
    })
    expect(await disableAdmin(db, admin, res.admin.id, t)).toEqual({ ok: true })
    expect(await sessionAdmin(db, res.token, t)).toBeNull()
    expect(
      await signIn(db, { email: 'bola@example.org', password: PASSWORD }, t),
    ).toMatchObject({ ok: false, error: expect.any(String) })
  })
})

describe('schools and licences', () => {
  async function school() {
    const { admin } = await firstAdmin()
    const s = await createSchool(db, admin, { name: 'Demo Secondary School' })
    if (!s.ok) throw new Error(s.error)
    const c = await addCampus(db, admin, s.id, 'Main Campus')
    if (!c.ok) throw new Error(c.error)
    return { admin, schoolId: s.id, campusId: c.id }
  }

  it('a school starts with 3 month terms and 14 days grace, and names must be unique', async () => {
    const { admin, schoolId } = await school()
    expect(await getSchool(db, schoolId, now)).toMatchObject({
      termMonths: 3,
      graceDays: 14,
      campuses: [
        { name: 'Main Campus', licence: null, standing: null, enrolled: false },
      ],
    })
    expect(
      await createSchool(db, admin, { name: 'demo secondary school' }),
    ).toMatchObject({ ok: false })
    expect(await addCampus(db, admin, schoolId, 'main campus')).toMatchObject({
      ok: false,
    })
  })

  it('issues a one-term trial that verifies with the public key', async () => {
    const { admin, campusId, schoolId } = await school()
    const res = await issueLicence(
      db,
      admin,
      { campusId, kind: 'trial', starts: '2027-01-05', terms: 1, seats: 120 },
      now,
    )
    if (!res.ok) throw new Error(res.error)
    const read = verifyLicence(res.token, keys.publicKey)
    expect(read).toMatchObject({
      ok: true,
      licence: {
        school: 'Demo Secondary School',
        campus: 'Main Campus',
        kind: 'trial',
        starts: '2027-01-05',
        ends: '2027-04-04',
        graceDays: 14,
        seats: 120,
        machine: null,
      },
    })
    const view = (await getSchool(
      db,
      schoolId,
      new Date('2027-02-01T00:00:00Z'),
    ))!.campuses[0]
    expect(view.standing).toMatchObject({ state: 'valid' })
    expect(view.licence).toMatchObject({ issuedBy: 'Ada', ends: '2027-04-04' })
  })

  it('uses the school’s own term length and grace period, and an exact end date when given', async () => {
    const { admin, campusId, schoolId } = await school()
    expect(
      await updateSchoolTerms(db, admin, schoolId, {
        termMonths: 4,
        graceDays: 7,
      }),
    ).toEqual({ ok: true })
    const two = await issueLicence(
      db,
      admin,
      { campusId, kind: 'active', starts: '2027-01-05', terms: 2, seats: 50 },
      now,
    )
    expect(two).toMatchObject({
      ok: true,
      licence: { ends: '2027-09-04', graceDays: 7 },
    })
    const exact = await issueLicence(
      db,
      admin,
      {
        campusId,
        kind: 'active',
        starts: '2027-01-05',
        ends: '2027-03-20',
        seats: 50,
        graceDays: 0,
      },
      later(1),
    )
    expect(exact).toMatchObject({
      ok: true,
      licence: { ends: '2027-03-20', graceDays: 0 },
    })
    expect(
      await updateSchoolTerms(db, admin, schoolId, {
        termMonths: 0,
        graceDays: 7,
      }),
    ).toMatchObject({ ok: false })
  })

  it('extending issues a new licence and keeps the old one in the history', async () => {
    const { admin, campusId, schoolId } = await school()
    await issueLicence(
      db,
      admin,
      { campusId, kind: 'trial', starts: '2027-01-05', terms: 1, seats: 120 },
      now,
    )
    await issueLicence(
      db,
      admin,
      {
        campusId,
        kind: 'active',
        starts: '2027-01-05',
        terms: 2,
        seats: 150,
        note: 'Paid for two terms',
      },
      later(60),
    )
    const campus = (await getSchool(db, schoolId, now))!.campuses[0]
    expect(campus.licence).toMatchObject({
      kind: 'active',
      ends: '2027-07-04',
      seats: 150,
      note: 'Paid for two terms',
    })
    expect(campus.history.map((h) => h.kind)).toEqual(['active', 'trial'])
  })

  it('refuses nonsense, and refuses everything when the signing key is missing', async () => {
    const { admin, campusId } = await school()
    const base = {
      campusId,
      kind: 'trial' as const,
      starts: '2027-01-05',
      seats: 10,
    }
    for (const bad of [
      { terms: 0 },
      { ends: '2026-12-01' },
      { terms: 1, seats: 0 },
      { terms: 1, starts: 'soon' },
      { terms: 1, graceDays: 400 },
      {},
    ])
      expect(
        (await issueLicence(db, admin, { ...base, ...bad }, now)).ok,
        JSON.stringify(bad),
      ).toBe(false)
    process.env.LICENCE_SIGNING_KEY = ''
    const res = await issueLicence(db, admin, { ...base, terms: 1 }, now)
    process.env.LICENCE_SIGNING_KEY = keys.privateKey
    expect(res).toMatchObject({
      ok: false,
      error: expect.stringMatching(/signing key/),
    })
  })

  it('shows a campus as read-only in its grace period, then locked; suspension locks at once', async () => {
    const { admin, campusId, schoolId } = await school()
    await issueLicence(
      db,
      admin,
      { campusId, kind: 'trial', starts: '2027-01-05', terms: 1, seats: 120 },
      now,
    )
    const state = async (at: string) =>
      (await getSchool(db, schoolId, new Date(at)))!.campuses[0].standing!.state
    expect(await state('2027-04-10T00:00:00Z')).toBe('grace')
    expect(await state('2027-04-19T00:00:00Z')).toBe('locked')
    expect(
      await setSuspended(db, admin, campusId, true, '', now),
    ).toMatchObject({ ok: false })
    await setSuspended(db, admin, campusId, true, 'Payment not received', now)
    expect(
      (await listSchools(db, new Date('2027-02-01T00:00:00Z')))[0].campuses[0],
    ).toMatchObject({
      suspended: true,
      suspendedReason: 'Payment not received',
      standing: { state: 'locked' },
    })
    await setSuspended(db, admin, campusId, false, '', now)
    expect(await state('2027-02-01T00:00:00Z')).toBe('valid')
  })

  it('writes every change to the audit trail with who did it', async () => {
    const { admin, campusId } = await school()
    await issueLicence(
      db,
      admin,
      { campusId, kind: 'trial', starts: '2027-01-05', terms: 1, seats: 120 },
      now,
    )
    const trail = await listAudit(db)
    expect(trail.map((t) => t.action)).toEqual([
      'licence.issue',
      'campus.create',
      'school.create',
      'signin.ok',
      'admin.first',
    ])
    expect(trail[0]).toMatchObject({
      by: 'Ada',
      target: 'Demo Secondary School · Main Campus',
      detail: 'trial, 2027-01-05 to 2027-04-04, 120 seats, 14 days grace',
    })
  })

  describe('a school server', () => {
    it('enrols once with a one-time code, which ties the licence to that machine', async () => {
      const { admin, campusId, schoolId } = await school()
      await issueLicence(
        db,
        admin,
        { campusId, kind: 'trial', starts: '2027-01-05', terms: 1, seats: 120 },
        now,
      )
      const code = await newEnrolToken(db, admin, campusId, now)
      if (!code.ok) throw new Error()
      expect(
        await enrolCampus(db, { token: 'T2SE-wrong', machine: MACHINE }, now),
      ).toMatchObject({ ok: false })
      expect(
        await enrolCampus(db, { token: code.token, machine: 'not hex' }, now),
      ).toMatchObject({ ok: false })
      const done = await enrolCampus(
        db,
        { token: code.token, machine: MACHINE, version: '1.0.0' },
        later(5),
      )
      if (!done.ok) throw new Error(done.error)
      expect(done).toMatchObject({
        school: 'Demo Secondary School',
        campus: 'Main Campus',
      })
      expect(verifyLicence(done.licence!, keys.publicKey)).toMatchObject({
        ok: true,
        licence: { machine: MACHINE, ends: '2027-04-04', seats: 120 },
      })
      expect(
        await enrolCampus(
          db,
          { token: code.token, machine: MACHINE },
          later(6),
        ),
      ).toMatchObject({ ok: false })
      expect((await getSchool(db, schoolId, now))!.campuses[0]).toMatchObject({
        enrolled: true,
        version: '1.0.0',
      })
    })

    it('ties a campus to an offline server by its fingerprint, and makes the licence for that machine', async () => {
      const { admin, campusId, schoolId } = await school()
      await issueLicence(
        db,
        admin,
        {
          campusId,
          kind: 'active',
          starts: '2027-01-05',
          terms: 1,
          seats: 120,
        },
        now,
      )
      expect(
        await tieToMachine(db, admin, campusId, 'not a fingerprint', now),
      ).toMatchObject({ ok: false })
      const tied = await tieToMachine(
        db,
        admin,
        campusId,
        ` ${MACHINE.toUpperCase()} `,
        later(1),
      )
      if (!tied.ok) throw new Error(tied.error)
      expect(verifyLicence(tied.token!, keys.publicKey)).toMatchObject({
        ok: true,
        licence: {
          machine: MACHINE,
          ends: '2027-04-04',
          seats: 120,
          kind: 'active',
        },
      })
      const campus = (await getSchool(db, schoolId, now))!.campuses[0]
      // tied, but it has never checked in, so it is not "enrolled"
      expect(campus).toMatchObject({ machine: MACHINE, enrolled: false })
      expect(campus.history).toHaveLength(2)
      // the next licence is made for the same machine without asking again
      const next = await issueLicence(
        db,
        admin,
        {
          campusId,
          kind: 'active',
          starts: '2027-01-05',
          terms: 2,
          seats: 120,
        },
        later(2),
      )
      expect(next).toMatchObject({ ok: true, licence: { machine: MACHINE } })
    })

    it('an enrolment code runs out after 24 hours, and a new code cancels the old one', async () => {
      const { admin, campusId } = await school()
      const a = await newEnrolToken(db, admin, campusId, now)
      const b = await newEnrolToken(db, admin, campusId, later(1))
      if (!a.ok || !b.ok) throw new Error()
      expect(
        await enrolCampus(db, { token: a.token, machine: MACHINE }, later(2)),
      ).toMatchObject({ ok: false })
      expect(
        await enrolCampus(
          db,
          { token: b.token, machine: MACHINE },
          later(25 * 60),
        ),
      ).toMatchObject({ ok: false })
    })

    it('heartbeats report seats and version, and bring back the licence and a signed suspension note', async () => {
      const { admin, campusId, schoolId } = await school()
      await issueLicence(
        db,
        admin,
        { campusId, kind: 'trial', starts: '2027-01-05', terms: 1, seats: 120 },
        now,
      )
      const code = await newEnrolToken(db, admin, campusId, now)
      if (!code.ok) throw new Error()
      const done = await enrolCampus(
        db,
        { token: code.token, machine: MACHINE },
        now,
      )
      if (!done.ok) throw new Error()
      const beat = {
        campusId,
        secret: done.secret,
        machine: MACHINE,
        version: '1.0.1',
        seatsUsed: 87,
      }
      expect(
        await heartbeat(db, { ...beat, secret: 'guess' }, now),
      ).toMatchObject({ ok: false })
      expect(
        await heartbeat(db, { ...beat, machine: 'b'.repeat(64) }, now),
      ).toMatchObject({ ok: false })
      expect(
        await heartbeat(db, { ...beat, campusId: 'not-a-campus' }, now),
      ).toMatchObject({ ok: false })
      const ok = await heartbeat(db, beat, later(30))
      if (!ok.ok) throw new Error(ok.error)
      expect(ok.licence).toBe(done.licence)
      expect(readStatus(ok.status, keys.publicKey)).toMatchObject({
        campusId,
        suspended: false,
      })
      expect((await getSchool(db, schoolId, now))!.campuses[0]).toMatchObject({
        seatsUsed: 87,
        version: '1.0.1',
        lastHeartbeat: later(30).toISOString(),
      })
      await setSuspended(db, admin, campusId, true, 'Licence ended early', now)
      const after = await heartbeat(db, beat, later(60))
      if (!after.ok) throw new Error()
      expect(readStatus(after.status, keys.publicKey)).toMatchObject({
        suspended: true,
      })
      // a status signed by someone else is ignored
      expect(readStatus(after.status, newKeyPair().publicKey)).toBeNull()
      // a licence extended in the console reaches the server on its next heartbeat
      const ext = await issueLicence(
        db,
        admin,
        {
          campusId,
          kind: 'active',
          starts: '2027-01-05',
          terms: 2,
          seats: 150,
        },
        later(90),
      )
      const next = await heartbeat(db, beat, later(120))
      expect(next.ok && next.licence).toBe(ext.ok && ext.token)
      expect(
        verifyLicence((next as { licence: string }).licence, keys.publicKey),
      ).toMatchObject({ licence: { machine: MACHINE, seats: 150 } })
    })
  })
})
