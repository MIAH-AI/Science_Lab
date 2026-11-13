// The focus timer travels between the home page and the labs in the address, as ?focus=,
// the same way Day/Night travels as ?appearance=. Nothing is written to the browser's storage.
//
//   running: "<end time in epoch ms>-<session minutes>"   e.g. 1762612345678-25
//   paused:  "p<seconds left>-<session minutes>"           e.g. p754-25
//
// public/labs/glass.js reads and writes the same format; keep the two in step.

export type FocusState = {
  minutes: number
  seconds: number
  endAt: number | null
}

const MAX_MINUTES = 180
// A finished session still shows "Well done" for a while after it ends; older links are ignored.
const FINISHED_GRACE_MS = 60 * 60 * 1000

export function formatFocus({ minutes, seconds, endAt }: FocusState): string {
  if (endAt !== null && seconds > 0) return `${endAt}-${minutes}`
  if (seconds > 0 && seconds < minutes * 60) return `p${seconds}-${minutes}`
  return ''
}

export function parseFocus(
  value: string | null,
  now: number,
): FocusState | null {
  const m = /^(p?)(\d{1,15})-(\d{1,3})$/.exec(value ?? '')
  if (!m) return null
  const minutes = Number(m[3])
  if (minutes < 1 || minutes > MAX_MINUTES) return null
  const n = Number(m[2])
  if (m[1]) {
    if (n < 1 || n > minutes * 60) return null
    return { minutes, seconds: n, endAt: null }
  }
  const left = Math.ceil((n - now) / 1000)
  if (left > minutes * 60 + 5) return null // ends later than the session could: not a real link
  if (left <= 0)
    return now - n <= FINISHED_GRACE_MS
      ? { minutes, seconds: 0, endAt: null }
      : null
  return { minutes, seconds: left, endAt: n }
}
