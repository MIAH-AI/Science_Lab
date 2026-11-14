import { describe, expect, it } from 'vitest'
import { memoryDb } from './db'
import { SCHOOL_MIGRATIONS } from '../school/schema'
import {
  countOne,
  keepCampusUsage,
  usageOf,
  usageReport,
  validEvent,
} from './usage'

const now = new Date('2026-11-14T10:00:00Z')
const CAMPUS = '11111111-1111-4111-8111-111111111111'

describe('usage counts', () => {
  it('accepts only events the app can produce', () => {
    expect(validEvent('physics', 'lab')).toBe(true)
    expect(validEvent('all', 'desk')).toBe(true)
    expect(validEvent('physics', 'desk')).toBe(false)
    expect(validEvent('all', 'lab')).toBe(false)
    expect(validEvent('history', 'lab')).toBe(false)
    expect(validEvent('physics', 'login')).toBe(false)
  })

  it('adds one to the day and keeps nothing else', async () => {
    const db = await memoryDb()
    await countOne(db, 'web', 'physics', 'lab', now)
    await countOne(db, 'web', 'physics', 'lab', now)
    await countOne(db, 'web', 'physics', 'exam', now)
    expect(await countOne(db, 'web', 'history', 'lab', now)).toBe(false)
    expect(await db.query('SELECT * FROM usage_daily ORDER BY kind')).toEqual([
      {
        day: '2026-11-14',
        source: 'web',
        subject: 'physics',
        kind: 'exam',
        count: 1,
      },
      {
        day: '2026-11-14',
        source: 'web',
        subject: 'physics',
        kind: 'lab',
        count: 2,
      },
    ])
  })

  it('a school server counts in its own database and reports daily totals', async () => {
    const school = await memoryDb(SCHOOL_MIGRATIONS)
    await countOne(school, 'local', 'biology', 'lab', now)
    await countOne(school, 'local', 'all', 'desk', now)
    const sent = await usageOf(school, 'local', now)
    expect(sent).toEqual([
      { day: '2026-11-14', subject: 'all', kind: 'desk', count: 1 },
      { day: '2026-11-14', subject: 'biology', kind: 'lab', count: 1 },
    ])
  })

  it('keeps a campus report once however often it is sent, and never lowers a total', async () => {
    const db = await memoryDb()
    const rows = [
      { day: '2026-11-13', subject: 'biology', kind: 'lab', count: 7 },
    ]
    expect(await keepCampusUsage(db, CAMPUS, rows, now)).toBe(1)
    await keepCampusUsage(db, CAMPUS, rows, now)
    await keepCampusUsage(db, CAMPUS, [{ ...rows[0], count: 3 }], now)
    await keepCampusUsage(db, CAMPUS, [{ ...rows[0], count: 9 }], now)
    expect((await usageReport(db, now, 7)).total.lab).toBe(9)
  })

  it('throws away report rows that cannot be true', async () => {
    const db = await memoryDb()
    const kept = await keepCampusUsage(
      db,
      CAMPUS,
      [
        { day: '2027-01-01', subject: 'biology', kind: 'lab', count: 5 }, // the future
        { day: '2026-01-01', subject: 'biology', kind: 'lab', count: 5 }, // too old
        { day: '2026-11-13', subject: 'history', kind: 'lab', count: 5 },
        { day: '2026-11-13', subject: 'biology', kind: 'lab', count: -1 },
        { day: '2026-11-13', subject: 'biology', kind: 'lab', count: 2.5 },
        {
          day: '2026-11-13',
          subject: 'biology',
          kind: 'lab',
          count: 99_999_999,
        },
        'nonsense',
        null,
      ],
      now,
    )
    expect(kept).toBe(0)
    expect(await keepCampusUsage(db, CAMPUS, 'not a list', now)).toBe(0)
    expect(await db.query('SELECT * FROM usage_daily')).toEqual([])
  })

  it('reports by day, subject and place, and compares with the period before', async () => {
    const db = await memoryDb()
    await countOne(db, 'web', 'physics', 'lab', now)
    await countOne(db, 'web', 'all', 'desk', now)
    await keepCampusUsage(
      db,
      CAMPUS,
      [
        { day: '2026-11-12', subject: 'physics', kind: 'exam', count: 4 },
        { day: '2026-11-05', subject: 'maths', kind: 'lab', count: 10 }, // the week before
      ],
      now,
    )
    const r = await usageReport(db, now, 7)
    expect(r.byDay).toHaveLength(7)
    expect(r.byDay[0].day).toBe('2026-11-08')
    expect(r.byDay[6]).toEqual({ day: '2026-11-14', desk: 1, lab: 1, exam: 0 })
    expect(r.total).toEqual({ desk: 1, lab: 1, exam: 4 })
    expect(r.before).toEqual({ desk: 0, lab: 10, exam: 0 })
    expect(r.bySubject.find((s) => s.subject === 'physics')).toEqual({
      subject: 'physics',
      lab: 1,
      exam: 4,
    })
    expect(r.bySource.map((s) => s.source)).toEqual([CAMPUS, 'web'])
    const web = await usageReport(db, now, 7, 'web')
    expect(web.total).toEqual({ desk: 1, lab: 1, exam: 0 })
  })
})
