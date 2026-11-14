import { createFileRoute } from '@tanstack/react-router'
import { config } from '../server/config'
import { enrolCampus } from '../server/control'
import { getDb } from '../server/db'

// Called once by a school server's installer, with the one-time enrolment code from the console.
export const Route = createFileRoute('/api/campus/enrol')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        if (!config.consoleEnabled())
          return Response.json(
            { ok: false, error: 'Not found.' },
            { status: 404 },
          )
        const body = (await request.json().catch(() => null)) as {
          token?: string
          machine?: string
          version?: string
        } | null
        if (typeof body?.token !== 'string' || typeof body.machine !== 'string')
          return Response.json(
            {
              ok: false,
              error: 'Send the enrolment code and the machine fingerprint.',
            },
            { status: 400 },
          )
        const res = await enrolCampus(
          await getDb(),
          {
            token: body.token,
            machine: body.machine,
            version:
              typeof body.version === 'string'
                ? body.version.slice(0, 40)
                : undefined,
          },
          new Date(),
        )
        return Response.json(res, { status: res.ok ? 200 : 403 })
      },
    },
  },
})
