import { describe, expect, it } from 'vitest'
import { formatFocus, parseFocus } from './focus'

const NOW = 1_762_600_000_000

describe('focus timer hand-off', () => {
  it('round-trips a running timer', () => {
    const value = formatFocus({
      minutes: 25,
      seconds: 600,
      endAt: NOW + 600_000,
    })
    expect(value).toBe(`${NOW + 600_000}-25`)
    expect(parseFocus(value, NOW)).toEqual({
      minutes: 25,
      seconds: 600,
      endAt: NOW + 600_000,
    })
  })

  it('counts down the time spent in a lab', () => {
    expect(parseFocus(`${NOW + 600_000}-25`, NOW + 90_000)?.seconds).toBe(510)
  })

  it('round-trips a paused timer', () => {
    const value = formatFocus({ minutes: 45, seconds: 754, endAt: null })
    expect(value).toBe('p754-45')
    expect(parseFocus(value, NOW)).toEqual({
      minutes: 45,
      seconds: 754,
      endAt: null,
    })
  })

  it('leaves the address clean when the timer is untouched or finished', () => {
    expect(formatFocus({ minutes: 25, seconds: 1500, endAt: null })).toBe('')
    expect(formatFocus({ minutes: 25, seconds: 0, endAt: null })).toBe('')
  })

  it('shows a session that ended while the student was in a lab as finished', () => {
    expect(parseFocus(`${NOW - 30_000}-25`, NOW)).toEqual({
      minutes: 25,
      seconds: 0,
      endAt: null,
    })
  })

  it('ignores old, impossible or malformed values', () => {
    expect(parseFocus(`${NOW - 2 * 3600_000}-25`, NOW)).toBeNull()
    expect(parseFocus(`${NOW + 3600_000}-25`, NOW)).toBeNull()
    expect(parseFocus('p2000-25', NOW)).toBeNull()
    expect(parseFocus('p10-0', NOW)).toBeNull()
    expect(parseFocus('abc', NOW)).toBeNull()
    expect(parseFocus(null, NOW)).toBeNull()
  })
})
