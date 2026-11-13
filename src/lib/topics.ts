import topicIndex from '../data/topic-index.json'

export type SubjectKey =
  'maths' | 'physics' | 'chemistry' | 'biology' | 'geography' | 'agric'
export type Topic = { t: string; s: string[] }

// Every lab's topics and subtopics, built from the labs by tools/build-topic-index.mjs.
export const index = topicIndex as Record<SubjectKey, Topic[]>

// Up to `limit` topic or subtopic titles in a subject that contain every word of the query.
// A subtopic also matches on its topic's title, so "acid titration" finds "Acid–base titration".
export function findTopics(
  key: SubjectKey,
  query: string,
  limit = 3,
  source = index,
) {
  const words = query.toLowerCase().split(/\s+/).filter(Boolean)
  const hits: string[] = []
  if (!words.length) return hits
  for (const topic of source[key]) {
    for (const title of [topic.t, ...topic.s]) {
      const hay = (title + ' ' + topic.t).toLowerCase()
      if (words.every((w) => hay.includes(w)) && !hits.includes(title))
        hits.push(title)
      if (hits.length >= limit) return hits
    }
  }
  return hits
}
