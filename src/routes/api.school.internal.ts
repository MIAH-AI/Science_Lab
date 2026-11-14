import { timingSafeEqual } from 'node:crypto'
import { createFileRoute } from '@tanstack/react-router'
import { getDb } from '../server/db'
import { invite, seatsUsed } from '../school/accounts'

const same = (given: string | null, want: string) => {
  const a = Buffer.from(given ?? '')
  const b = Buffer.from(want)
  return a.length === b.length && timingSafeEqual(a, b)
}

// Called only by the school server process itself (src/campus/server.ts), never by a browser: the secret
// is made fresh each time the server starts and requests from outside cannot carry the header.
export const Route = createFileRoute('/api/school/internal')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const secret = process.env.T2S_INTERNAL
        if (
          process.env.APP_MODE !== 'campus' ||
          !secret ||
          !same(request.headers.get('x-t2s-internal'), secret)
        )
          return Response.json(
            { ok: false, error: 'Not found.' },
            { status: 404 },
          )
        const body = (await request.json().catch(() => ({}))) as {
          action?: string
          name?: string
        }
        const db = await getDb()
        if (body.action === 'seats')
          return Response.json({ ok: true, used: await seatsUsed(db) })
        if (body.action === 'first-admin')
          return Response.json(
            await invite(
              db,
              null,
              { name: body.name ?? '', role: 'admin' },
              new Date(),
            ),
          )
        return Response.json(
          { ok: false, error: 'Unknown action.' },
          { status: 400 },
        )
      },
    },
  },
})
