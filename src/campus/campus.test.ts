// @vitest-environment node
// A school server against the real control service code and a real embedded database. The only stand-in is
// the network: fetch calls go straight to the two control service functions the HTTP routes call.
import { mkdtempSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { createFirstAdmin, signIn, type Admin } from '../server/admins'
import {
  addCampus,
  createSchool,
  enrolCampus,
  heartbeat,
  issueLicence,
  newEnrolToken,
  setSuspended,
} from '../server/control'
import { memoryDb, type Db } from '../server/db'
import {
  newKeyPair,
  signLicence,
  signStatus,
  type Licence,
} from '../server/licence'
import { totpCode } from '../server/secrets'
import { beat, enrol } from './heartbeat'
import { campusStanding, installLicence, licenceClock } from './standing'
import { fingerprint, openStore, type Store } from './store'

const keys = newKeyPair()
const other = newKeyPair()
let store: Store
let machine: string
const at = (iso: string) => new Date(iso)
const base: Licence = {
  v: 1,
  id: 'lic-1',
  school: 'Riverside College',
  schoolId: 's1',
  campus: 'Main Campus',
  campusId: 'c1',
  kind: 'trial',
  starts: '2027-01-05',
  ends: '2027-04-04',
  graceDays: 14,
  seats: 120,
  machine: null,
  issued: '2027-01-02T10:00:00.000Z',
}
const sign = (over: Partial<Licence> = {}) =>
  signLicence({ ...base, ...over }, keys.privateKey)
const stand = (now: string) =>
  campusStanding(store, { publicKey: keys.publicKey, machine, now: at(now) })

beforeAll(() => {
  process.env.CONSOLE_SETUP_KEY = 'k'
  process.env.LICENCE_SIGNING_KEY = keys.privateKey
})
beforeEach(() => {
  store = openStore(mkdtempSync(join(tmpdir(), 't2s-campus-')))
  machine = fingerprint(store, 'this-computer').machine
})

describe('the server’s fingerprint', () => {
  it('is the same every time for the same computer, and different for another', () => {
    expect(fingerprint(store, 'this-computer')).toEqual({
      machine,
      source: 'system',
    })
    expect(machine).toMatch(/^[a-f0-9]{64}$/)
    expect(fingerprint(store, 'another-computer').machine).not.toBe(machine)
  })
  it('falls back to an id kept in the data folder when the computer has none', () => {
    const a = fingerprint(store, '')
    expect(a.source).toBe('stored')
    expect(fingerprint(openStore(store.dir), '')).toEqual(a)
  })
})

describe('the licence clock', () => {
  it('never goes back when the computer’s clock is set back, and keeps moving while the server runs', () => {
    let wall = Date.parse('2027-03-01T00:00:00Z'),
      up = 0
    const clock = licenceClock(
      store,
      () => wall,
      () => up,
    )
    expect(clock.now().toISOString()).toBe('2027-03-01T00:00:00.000Z')
    wall = Date.parse('2027-01-01T00:00:00Z') // someone sets the clock back two months
    up += 3_600_000 // and an hour passes
    expect(clock.now().toISOString()).toBe('2027-03-01T01:00:00.000Z')
    // after a restart the remembered time is still there
    const again = licenceClock(
      openStore(store.dir),
      () => wall,
      () => 0,
    )
    expect(again.now().toISOString()).toBe('2027-03-01T01:00:00.000Z')
  })
  it('accepts a trusted time from the control service', () => {
    const clock = licenceClock(
      store,
      () => Date.parse('2030-01-01T00:00:00Z'),
      () => 0,
    )
    clock.now() // the clock was wrongly set years ahead
    clock.trust(Date.parse('2027-02-01T00:00:00Z'))
    expect(openStore(store.dir).clock()).toBe(
      Date.parse('2027-02-01T00:00:00Z'),
    )
  })
})

describe('where the server stands', () => {
  it('is closed with no licence, and with a file that is not ours', () => {
    expect(stand('2027-02-01T00:00:00Z')).toMatchObject({
      state: 'none',
      canUse: false,
    })
    store.setLicence('hello')
    expect(stand('2027-02-01T00:00:00Z')).toMatchObject({
      state: 'invalid',
      canUse: false,
    })
    store.setLicence(signLicence(base, other.privateKey))
    expect(stand('2027-02-01T00:00:00Z')).toMatchObject({
      state: 'invalid',
      canUse: false,
    })
  })
  it('runs a trial through valid, read-only and locked, saying so in plain words', () => {
    store.setLicence(sign())
    expect(stand('2027-02-01T00:00:00Z')).toMatchObject({
      state: 'valid',
      canUse: true,
      canChange: true,
      message:
        'Licensed to Riverside College, Main Campus, until 4 April 2027.',
    })
    const grace = stand('2027-04-10T00:00:00Z')
    expect(grace).toMatchObject({
      state: 'grace',
      canUse: true,
      canChange: false,
    })
    expect(grace.message).toMatch(
      /ended on 4 April 2027.*until 18 April 2027.*nothing can be changed/,
    )
    expect(stand('2027-04-19T00:00:00Z')).toMatchObject({
      state: 'locked',
      canUse: false,
    })
    expect(stand('2027-01-01T00:00:00Z')).toMatchObject({
      state: 'not-started',
      canUse: false,
      message: 'The licence starts on 5 January 2027.',
    })
  })
  it('refuses a licence made for another server, and a full licence tied to none', () => {
    store.setLicence(sign({ machine: 'f'.repeat(64) }))
    expect(stand('2027-02-01T00:00:00Z')).toMatchObject({
      state: 'wrong-machine',
      canUse: false,
    })
    store.setLicence(sign({ kind: 'active', machine: null }))
    expect(stand('2027-02-01T00:00:00Z')).toMatchObject({
      state: 'wrong-machine',
      canUse: false,
    })
    store.setLicence(sign({ kind: 'active', machine }))
    expect(stand('2027-02-01T00:00:00Z')).toMatchObject({ state: 'valid' })
  })
  it('locks on a signed suspension note for this campus, and ignores any other note', () => {
    store.setLicence(sign())
    const note = (
      campusId: string,
      suspended: boolean,
      key = keys.privateKey,
    ) =>
      signStatus({ campusId, suspended, at: '2027-02-01T00:00:00.000Z' }, key)
    store.setStatus(note('c1', true, other.privateKey)) // not signed by us
    expect(stand('2027-02-01T00:00:00Z').state).toBe('valid')
    store.setStatus(note('another-campus', true))
    expect(stand('2027-02-01T00:00:00Z').state).toBe('valid')
    store.setStatus(note('c1', true))
    expect(stand('2027-02-01T00:00:00Z')).toMatchObject({
      state: 'locked',
      suspended: true,
      canUse: false,
    })
    store.setStatus(note('c1', false))
    expect(stand('2027-02-01T00:00:00Z').state).toBe('valid')
  })
})

describe('installing a licence by hand', () => {
  const install = (token: string) =>
    installLicence(store, token, { publicKey: keys.publicKey, machine })
  it('accepts ours, and refuses a changed one, one for another server, another campus, or an older one', () => {
    expect(install('rubbish')).toMatchObject({ ok: false })
    expect(install(signLicence(base, other.privateKey))).toMatchObject({
      ok: false,
    })
    expect(install(sign({ machine: 'f'.repeat(64) }))).toMatchObject({
      ok: false,
      error: expect.stringMatching(/different server/),
    })
    expect(install(sign({ kind: 'active' }))).toMatchObject({
      ok: false,
      error: expect.stringMatching(/fingerprint/),
    })
    expect(install(sign())).toMatchObject({ ok: true })
    expect(
      install(sign({ campusId: 'c2', campus: 'North Campus' })),
    ).toMatchObject({
      ok: false,
      error: expect.stringMatching(/different campus/),
    })
    expect(
      install(sign({ issued: '2026-12-01T00:00:00.000Z', ends: '2099-01-01' })),
    ).toMatchObject({
      ok: false,
      error: expect.stringMatching(/newer licence/),
    })
    expect(
      install(
        sign({
          issued: '2027-03-01T00:00:00.000Z',
          ends: '2027-07-04',
          kind: 'active',
          machine,
        }),
      ),
    ).toMatchObject({ ok: true })
    expect(stand('2027-06-01T00:00:00Z')).toMatchObject({
      state: 'valid',
      ends: '2027-07-04',
    })
  })
})

describe('talking to the control service', () => {
  let db: Db
  let admin: Admin
  let campusId: string
  const now = at('2027-01-04T09:00:00Z')
  let online = true
  // The network: the same two functions the HTTP routes call.
  const net = (async (url: string, init: { body: string }) => {
    if (!online) throw new Error('offline')
    const body = JSON.parse(init.body)
    const res = String(url).endsWith('/enrol')
      ? await enrolCampus(db, body, now)
      : await heartbeat(db, body, now)
    return { json: async () => res }
  }) as unknown as typeof fetch
  const opts = () => ({
    publicKey: keys.publicKey,
    machine,
    version: '1.0.0',
    fetch: net,
  })

  beforeEach(async () => {
    online = true
    db = await memoryDb()
    const made = await createFirstAdmin(db, {
      setupKey: 'k',
      email: 'ada@example.org',
      name: 'Ada',
      password: 'a long enough password',
    })
    if (!made.ok) throw new Error(made.error)
    const s = await signIn(
      db,
      {
        email: 'ada@example.org',
        password: 'a long enough password',
        code: totpCode(made.secret, now.getTime()),
      },
      now,
    )
    if (!s.ok) throw new Error()
    admin = s.admin
    const school = await createSchool(db, admin, { name: 'Riverside College' })
    const campus = await addCampus(
      db,
      admin,
      (school as { id: string }).id,
      'Main Campus',
    )
    campusId = (campus as { id: string }).id
    await issueLicence(
      db,
      admin,
      { campusId, kind: 'active', starts: '2027-01-05', terms: 1, seats: 120 },
      now,
    )
  })
  const code = async () =>
    ((await newEnrolToken(db, admin, campusId, now)) as { token: string }).token

  it('enrols with the one-time code and comes away licensed for this machine', async () => {
    expect(
      await enrol(store, {
        ...opts(),
        url: 'https://control.example',
        code: 'T2SE-wrong',
      }),
    ).toMatchObject({ ok: false })
    expect(
      await enrol(store, {
        ...opts(),
        url: 'https://control.example',
        code: await code(),
      }),
    ).toEqual({
      ok: true,
      school: 'Riverside College',
      campus: 'Main Campus',
      licensed: true,
    })
    expect(stand('2027-02-01T00:00:00Z')).toMatchObject({
      state: 'valid',
      licence: { machine, kind: 'active' },
    })
    expect(store.link()).toMatchObject({
      url: 'https://control.example',
      campusId,
    })
  })

  it('a heartbeat brings an extended licence and a suspension; offline, nothing changes', async () => {
    await enrol(store, {
      ...opts(),
      url: 'https://control.example',
      code: await code(),
    })
    expect(await beat(store, opts())).toEqual({
      ok: true,
      licenceChanged: false,
      suspended: false,
    })
    await issueLicence(
      db,
      admin,
      { campusId, kind: 'active', starts: '2027-01-05', terms: 2, seats: 150 },
      at('2027-01-04T10:00:00Z'),
    )
    expect(await beat(store, { ...opts(), seatsUsed: 80 })).toEqual({
      ok: true,
      licenceChanged: true,
      suspended: false,
    })
    expect(stand('2027-06-01T00:00:00Z')).toMatchObject({
      state: 'valid',
      ends: '2027-07-04',
      licence: { seats: 150 },
    })
    await setSuspended(db, admin, campusId, true, 'Payment not received', now)
    online = false
    expect(await beat(store, opts())).toMatchObject({ ok: false })
    expect(stand('2027-06-01T00:00:00Z').state).toBe('valid') // offline: the suspension has not arrived
    online = true
    expect(await beat(store, opts())).toMatchObject({
      ok: true,
      suspended: true,
    })
    expect(stand('2027-06-01T00:00:00Z')).toMatchObject({
      state: 'locked',
      suspended: true,
    })
  })

  it('a server that was never enrolled does not try', async () => {
    expect(await beat(store, opts())).toEqual({
      ok: false,
      error: 'This server is not enrolled.',
    })
  })

  it('ignores an answer that is not signed by us', async () => {
    await enrol(store, {
      ...opts(),
      url: 'https://control.example',
      code: await code(),
    })
    const fake = (async () => ({
      json: async () => ({
        ok: true,
        licence: signLicence({ ...base, ends: '2099-01-01' }, other.privateKey),
        status: signStatus(
          { campusId, suspended: false, at: now.toISOString() },
          other.privateKey,
        ),
      }),
    })) as unknown as typeof fetch
    expect(await beat(store, { ...opts(), fetch: fake })).toMatchObject({
      ok: false,
      error: expect.stringMatching(/not signed/),
    })
    expect(stand('2027-02-01T00:00:00Z')).toMatchObject({ ends: '2027-04-04' })
  })
})
