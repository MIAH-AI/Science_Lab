// @vitest-environment node
import { describe, expect, it } from 'vitest'
import {
  newKeyPair,
  signLicence,
  standing,
  termEnd,
  verifyLicence,
  type Licence,
} from './licence'

const keys = newKeyPair()
const licence: Licence = {
  v: 1,
  id: 'lic-1',
  school: 'Demo Secondary School',
  schoolId: 'sch-1',
  campus: 'Main Campus',
  campusId: 'cam-1',
  kind: 'trial',
  starts: '2027-01-05',
  ends: '2027-04-04',
  graceDays: 14,
  seats: 120,
  machine: null,
  issued: '2026-12-20T10:00:00.000Z',
}
const at = (iso: string) => new Date(iso)

describe('licence signing', () => {
  it('a signed licence verifies and reads back unchanged', () => {
    const token = signLicence(licence, keys.privateKey)
    expect(token.startsWith('T2S1.')).toBe(true)
    expect(verifyLicence(token, keys.publicKey)).toEqual({ ok: true, licence })
  })

  it('refuses a licence edited after signing', () => {
    const [p, body, sig] = signLicence(licence, keys.privateKey).split('.')
    const edited = Buffer.from(
      JSON.stringify({ ...licence, seats: 9999, ends: '2099-01-01' }),
    ).toString('base64url')
    const res = verifyLicence(`${p}.${edited}.${sig}`, keys.publicKey)
    expect(res.ok).toBe(false)
    expect(body).not.toBe(edited)
  })

  it('refuses a licence signed with someone else’s key, and rubbish', () => {
    const other = newKeyPair()
    expect(
      verifyLicence(signLicence(licence, other.privateKey), keys.publicKey).ok,
    ).toBe(false)
    for (const junk of ['', 'hello', 'T2S1.a.b', 'X.' + 'a'.repeat(40) + '.b'])
      expect(verifyLicence(junk, keys.publicKey).ok).toBe(false)
  })

  it('will not sign a licence that makes no sense', () => {
    for (const bad of [
      { ends: '2026-01-01' }, // ends before it starts
      { seats: 0 },
      { graceDays: -1 },
      { starts: '05/01/2027' },
      { campusId: '' },
    ])
      expect(() =>
        signLicence({ ...licence, ...bad } as Licence, keys.privateKey),
      ).toThrow()
  })
})

describe('where a licence stands', () => {
  it('is locked before it starts', () => {
    const s = standing(licence, at('2027-01-03T12:00:00Z'))
    expect(s).toMatchObject({
      state: 'not-started',
      canUse: false,
      daysLeft: 2,
    })
  })
  it('is valid from the first moment of the start date to the last moment of the end date', () => {
    expect(standing(licence, at('2027-01-05T00:00:00Z')).state).toBe('valid')
    const last = standing(licence, at('2027-04-04T23:59:59Z'))
    expect(last).toMatchObject({ state: 'valid', daysLeft: 0, canChange: true })
    expect(standing(licence, at('2027-04-01T09:00:00Z')).daysLeft).toBe(3)
  })
  it('goes read-only for the grace period, then locks', () => {
    const g = standing(licence, at('2027-04-05T00:00:00Z'))
    expect(g).toMatchObject({
      state: 'grace',
      canUse: true,
      canChange: false,
      daysLeft: 13,
    })
    expect(g.locks).toBe('2027-04-18')
    expect(standing(licence, at('2027-04-18T23:59:59Z')).state).toBe('grace')
    expect(standing(licence, at('2027-04-19T00:00:00Z'))).toMatchObject({
      state: 'locked',
      canUse: false,
    })
  })
  it('with no grace period it locks the day after it ends', () => {
    const l = { ...licence, graceDays: 0 }
    expect(standing(l, at('2027-04-05T00:00:00Z')).state).toBe('locked')
  })
  it('locks when suspended, and on the wrong server', () => {
    const now = at('2027-02-01T00:00:00Z')
    expect(standing(licence, now, { suspended: true }).state).toBe('locked')
    const bound = { ...licence, machine: 'abc' }
    expect(standing(bound, now, { machine: 'abc' }).state).toBe('valid')
    expect(standing(bound, now, { machine: 'zzz' }).state).toBe('wrong-machine')
  })
})

describe('term lengths', () => {
  it('one term is three months, two terms six, ending the day before the same date', () => {
    expect(termEnd('2027-01-05', 1, 3)).toBe('2027-04-04')
    expect(termEnd('2027-01-05', 2, 3)).toBe('2027-07-04')
    expect(termEnd('2027-09-01', 1, 3)).toBe('2027-11-30')
  })
  it('a school can have its own term length', () => {
    expect(termEnd('2027-01-05', 1, 4)).toBe('2027-05-04')
  })
  it('copes with month ends and the year end', () => {
    expect(termEnd('2026-11-30', 1, 3)).toBe('2027-02-27')
    expect(termEnd('2026-10-15', 1, 3)).toBe('2027-01-14')
  })
})
