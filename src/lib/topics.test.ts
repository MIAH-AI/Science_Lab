import { describe, expect, it } from 'vitest'
import { findTopics, index, type SubjectKey } from './topics'

const subjects = Object.keys(index) as SubjectKey[]

describe('topic index', () => {
  it('covers all six subjects with real titles', () => {
    expect(subjects.sort()).toEqual([
      'agric',
      'biology',
      'chemistry',
      'geography',
      'maths',
      'physics',
    ])
    for (const key of subjects) {
      expect(index[key].length).toBeGreaterThan(5)
      for (const topic of index[key]) {
        expect(topic.t.trim()).not.toBe('')
        expect(topic.t).not.toMatch(/&amp;|&lt;|undefined|null/)
        topic.s.forEach((s) => expect(s.trim()).not.toBe(''))
      }
    }
  })

  it('matches the subtopic counts shown on the home page', () => {
    const subs = (k: SubjectKey) => index[k].reduce((n, t) => n + t.s.length, 0)
    expect(subs('chemistry')).toBe(148)
    expect(subs('biology')).toBe(99)
    expect(subs('geography')).toBe(144)
    expect(subs('agric')).toBe(274)
    expect(index.physics.length).toBe(41)
  })
})

describe('findTopics', () => {
  it('finds a subtopic in the right subject only', () => {
    expect(findTopics('chemistry', 'titration')[0]).toMatch(/titration/i)
    expect(findTopics('biology', 'titration')).toEqual([])
    expect(findTopics('agric', 'poultry')[0]).toMatch(/poultry/i)
    expect(findTopics('maths', 'poultry')).toEqual([])
  })

  it('is case-insensitive and needs every word', () => {
    expect(findTopics('physics', 'REFRACTION').length).toBeGreaterThan(0)
    expect(findTopics('physics', 'refraction lenses')).toEqual([
      'Refraction — curved surfaces (lenses)',
    ])
  })

  it('returns nothing for an empty query and respects the limit', () => {
    expect(findTopics('maths', '   ')).toEqual([])
    expect(findTopics('geography', 'a', 2)).toHaveLength(2)
  })

  it('does not repeat a title', () => {
    const source = {
      maths: [{ t: 'Circles', s: ['Circles', 'Circle theorems'] }],
    } as never
    expect(findTopics('maths', 'circle', 5, source)).toEqual([
      'Circles',
      'Circle theorems',
    ])
  })

  it('finds every example search offered on the home page', () => {
    for (const q of [
      'Photosynthesis',
      'Logarithms',
      'Refraction',
      'Titration',
      'Map work',
    ])
      expect(subjects.some((k) => findTopics(k, q).length > 0)).toBe(true)
  })
})
