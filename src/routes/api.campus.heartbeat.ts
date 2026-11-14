import { createFileRoute } from '@tanstack/react-router'
import { config } from '../server/config'
import { heartbeat } from '../server/control'
import { getDb } from '../server/db'

// Called by an enrolled school server whenever it has a connection. It reports its version and seats in
// use, and gets back its current licence and a signed note of whether the campus is suspended.
export const Route = createFileRoute('/api/campus/heartbeat')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        if (!config.consoleEnabled())
          return Response.json(
            { ok: false, error: 'Not found.' },
            { status: 404 },
          )
        const b = (await request.json().catch(() => null)) as Record<
          string,
          unknown
        > | null
        if (
          typeof b?.campusId !== 'string' ||
          typeof b.secret !== 'string' ||
          typeof b.machine !== 'string'
        )
          return Response.json(
            { ok: false, error: 'Send campusId, secret and machine.' },
            { status: 400 },
          )
        const res = await heartbeat(
          await getDb(),
          {
            campusId: b.campusId,
            secret: b.secret,
            machine: b.machine,
            version:
              typeof b.version === 'string'
                ? b.version.slice(0, 40)
                : undefined,
            seatsUsed:
              typeof b.seatsUsed === 'number' ? b.seatsUsed : undefined,
            nonce: typeof b.nonce === 'string' ? b.nonce : undefined,
          },
          new Date(),
        )
        return Response.json(res, { status: res.ok ? 200 : 403 })
      },
    },
  },
})
