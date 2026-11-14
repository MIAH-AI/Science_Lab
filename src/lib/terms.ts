// Licence dates, shared by the server and the console's forms. Dates are calendar days, YYYY-MM-DD, in UTC.
export const DEFAULT_TERM_MONTHS = 3
export const DEFAULT_GRACE_DAYS = 14
const DAY = 86_400_000

export const isDate = (s: unknown): s is string =>
  typeof s === 'string' &&
  /^\d{4}-\d{2}-\d{2}$/.test(s) &&
  !Number.isNaN(Date.parse(s + 'T00:00:00Z'))

export const today = (now = new Date()) => now.toISOString().slice(0, 10)

// The last day of a licence that starts on `starts` and runs for `terms` terms of `termMonths` months.
// One term from 5 January ends on 4 April. Month ends are kept sensible: 30 November + 3 months ends 27 February.
export function termEnd(starts: string, terms: number, termMonths: number) {
  if (!isDate(starts)) throw new Error('Bad start date')
  const [y, m, d] = starts.split('-').map(Number)
  const months = Math.round(terms * termMonths)
  const first = new Date(Date.UTC(y, m - 1 + months, 1))
  const lastDay = new Date(
    Date.UTC(first.getUTCFullYear(), first.getUTCMonth() + 1, 0),
  ).getUTCDate()
  const sameDay = Date.UTC(
    first.getUTCFullYear(),
    first.getUTCMonth(),
    Math.min(d, lastDay),
  )
  return new Date(sameDay - DAY).toISOString().slice(0, 10)
}

// The last read-only day: `graceDays` days after the end date. The day after this, the server locks.
export const lastGraceDay = (ends: string, graceDays: number) =>
  new Date(Date.parse(ends + 'T00:00:00Z') + graceDays * DAY)
    .toISOString()
    .slice(0, 10)

export const addDays = (date: string, days: number) =>
  new Date(Date.parse(date + 'T00:00:00Z') + days * DAY)
    .toISOString()
    .slice(0, 10)

// "5 Jan 2027"
export const niceDate = (date: string) =>
  new Date(date.slice(0, 10) + 'T00:00:00Z').toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  })
