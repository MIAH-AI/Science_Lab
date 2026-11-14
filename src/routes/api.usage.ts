import { createFileRoute } from '@tanstack/react-router'
import { config } from '../server/config'
import { getDb } from '../server/db'
import { countOne, type UsageKind } from '../server/usage'

// One address may add at most this many counts a minute, so a script cannot inflate the figures quickly.
// The address is held in memory for that minute only and is never written down.
const PER_MINUTE = 40
const seen = new Map<string, { n: number; until: number }>()
function tooMany(ip: string, now: number) {
  if (seen.size > 5000)
    for (const [k, v] of seen) if (v.until < now) seen.delete(k)
  const entry = seen.get(ip)
  if (!entry || entry.until < now) {
    seen.set(ip, { n: 1, until: now + 60_000 })
    return false
  }
  return ++entry.n > PER_MINUTE
}

const done = () => new Response(null, { status: 204 })

// The Study Desk and the labs call this once when they open, so the platform team can see which subjects
// are used. It adds one to a daily count and keeps nothing about the person: no cookie is read or set.
// Where there is nowhere to count (the public site without the console's database) it does nothing.
export const Route = createFileRoute('/api/usage')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const campus = process.env.APP_MODE === 'campus'
        if (!campus && !config.consoleEnabled()) return done()
        const origin = request.headers.get('origin')
        if (origin && new URL(origin).host !== new URL(request.url).host)
          return done()
        const ip =
          request.headers.get('x-t2s-ip') ||
          request.headers.get('x-nf-client-connection-ip') ||
          'unknown'
        if (tooMany(ip, Date.now())) return done()
        const text = (await request.text().catch(() => '')).slice(0, 200)
        const body = (() => {
          try {
            return JSON.parse(text) as { subject?: unknown; kind?: unknown }
          } catch {
            return null
          }
        })()
        if (!body) return done()
        await countOne(
          await getDb(),
          campus ? 'local' : 'web',
          String(body.subject),
          body.kind as UsageKind,
          new Date(),
        ).catch(() => false)
        return done()
      },
    },
  },
})
