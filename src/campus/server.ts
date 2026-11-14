// The school server. One Node process that serves the built app and labs to the school's own network,
// checks the licence on every request, and reports in to the control service when it has a connection.
//
//   node dist/campus/server.mjs
//
// Settings: PORT (8080), HOST (0.0.0.0), DATA_DIR (.data), LICENCE_PUBLIC_KEY or a licence-public.pem
// file beside the package, HEARTBEAT_MINUTES (15).
import { randomBytes } from 'node:crypto'
import {
  createReadStream,
  existsSync,
  readFileSync,
  statSync,
  writeFileSync,
} from 'node:fs'
import {
  createServer,
  type IncomingMessage,
  type ServerResponse,
} from 'node:http'
import { dirname, extname, join, normalize, resolve } from 'node:path'
import { Readable } from 'node:stream'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { beat } from './heartbeat'
import {
  campusStanding,
  installLicence,
  licenceClock,
  type CampusStanding,
} from './standing'
import type { PublicStatus } from './status'
import { fingerprint, openStore } from './store'

declare const __VERSION__: string
const VERSION = typeof __VERSION__ === 'string' ? __VERSION__ : 'dev'
const here = dirname(fileURLToPath(import.meta.url))
const root = resolve(here, '..') // dist/
const env = (name: string, fallback = '') =>
  process.env[name]?.trim() || fallback

const pemFile = [
  join(here, 'licence-public.pem'),
  join(root, '..', 'licence-public.pem'),
].find(existsSync)
const publicKey =
  env('LICENCE_PUBLIC_KEY').replace(/\\n/g, '\n') ||
  (pemFile ? readFileSync(pemFile, 'utf8') : '')
const store = openStore(resolve(env('DATA_DIR', '.data')))
const id = fingerprint(store)
const clock = licenceClock(store, Date.now, () => performance.now())
const current = (): CampusStanding =>
  campusStanding(store, { publicKey, machine: id.machine, now: clock.now() })

// The app itself runs in campus mode: no platform console, and its database lives in the same folder.
// A secret for the few calls this process makes into the app (seat count, first admin). It changes at every
// start, and a copy is left in the data folder for the command line tool, readable only by this user.
const internal = randomBytes(32).toString('hex')
process.env.T2S_INTERNAL = internal
writeFileSync(join(store.dir, 'internal-key'), internal, { mode: 0o600 })
process.env.APP_MODE = 'campus'
process.env.DATA_DIR = store.dir
delete process.env.CONSOLE_ENABLED
const app = (
  await import(pathToFileURL(join(root, 'server', 'server.js')).href)
).default as {
  fetch: (request: Request) => Promise<Response>
}

const TYPES: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.woff': 'font/woff',
  '.glb': 'model/gltf-binary',
  '.gltf': 'model/gltf+json',
  '.bin': 'application/octet-stream',
  '.hdr': 'application/octet-stream',
  '.ktx2': 'image/ktx2',
  '.wasm': 'application/wasm',
  '.txt': 'text/plain; charset=utf-8',
  '.mp3': 'audio/mpeg',
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
  '.map': 'application/json',
}
// The same short addresses the hosted site gives the labs (netlify.toml).
const LABS = [
  'waec-maths-dashboard',
  'physics_lab_full',
  'chemistry-simulations',
  'waec-biology-lab',
  'waec-geography-lab',
  'waec-agric-lab',
]
const client = join(root, 'client')

function staticFile(pathname: string): string | null {
  const lab = LABS.find((l) => pathname === '/' + l)
  const rel = normalize(
    decodeURIComponent(lab ? `/labs/${lab}.html` : pathname),
  )
  if (rel.includes('..')) return null
  const file = join(client, rel)
  return file.startsWith(client) && existsSync(file) && statSync(file).isFile()
    ? file
    : null
}

// Always reachable, so the licence page can show itself and its styles when everything else is closed.
const OPEN =
  /^\/(licence(\/.*)?|assets\/.*|fonts\/.*|brand\/.*|favicon\.(ico|svg)|apple-touch-icon\.png|_serverFn\/.*)$/
// On a school server the front door is the Study Desk; the public front page and the sample-data demo are not shown.
const TO_DESK = /^\/($|demo(\/|$)|app\/(classroom|campus|school)(\/|$))/

const banner = (s: CampusStanding) =>
  `<div role="status" style="position:fixed;left:0;right:0;bottom:0;z-index:2147483000;background:#6b4a00;color:#fff;font:600 15px/1.4 Lexend,system-ui,sans-serif;padding:10px 16px;text-align:center">${s.message.replace(/</g, '&lt;')} <a href="/licence" style="color:#fff;text-decoration:underline">Details</a></div>`

function publicStatus(s: CampusStanding): PublicStatus {
  return {
    state: s.state,
    canUse: s.canUse,
    canChange: s.canChange,
    message: s.message,
    suspended: s.suspended,
    school: s.licence?.school ?? null,
    campus: s.licence?.campus ?? null,
    kind: s.licence?.kind ?? null,
    starts: s.licence?.starts ?? null,
    ends: s.ends ?? s.licence?.ends ?? null,
    locks: s.locks,
    daysLeft: s.daysLeft,
    seats: s.licence?.seats ?? null,
    fingerprint: id.machine,
    fingerprintSource: id.source,
    enrolled: !!store.link(),
    version: VERSION,
  }
}

// A call from this process into the app, marked with the secret.
async function ask(body: Record<string, unknown>) {
  const res = await app.fetch(
    new Request('http://localhost/api/school/internal', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-t2s-internal': internal,
      },
      body: JSON.stringify(body),
    }),
  )
  return (await res.json()) as {
    ok: boolean
    used?: number
    code?: string
    error?: string
  }
}

const send = (
  res: ServerResponse,
  status: number,
  body: string,
  type = 'application/json',
) => {
  res.writeHead(status, { 'content-type': type, 'cache-control': 'no-store' })
  res.end(body)
}
async function readBody(req: IncomingMessage, limit = 64_000) {
  const chunks: Buffer[] = []
  let size = 0
  for await (const chunk of req) {
    size += (chunk as Buffer).length
    if (size > limit) throw new Error('too big')
    chunks.push(chunk as Buffer)
  }
  return Buffer.concat(chunks)
}

const server = createServer(async (req, res) => {
  try {
    const url = new URL(
      req.url ?? '/',
      `http://${req.headers.host ?? 'localhost'}`,
    )
    const path = url.pathname
    const s = current()

    if (path === '/licence/status.json')
      return send(res, 200, JSON.stringify(publicStatus(s)))
    if (path === '/licence/install' && req.method === 'POST') {
      // Safe without a sign-in: only a licence signed by tough2simple, for this server and campus, and
      // newer than the one installed, is accepted.
      const text = (await readBody(req)).toString('utf8')
      const done = installLicence(store, text, {
        publicKey,
        machine: id.machine,
      })
      console.log(
        done.ok
          ? `Licence installed: ${done.licence.school}, ${done.licence.campus}, to ${done.licence.ends}`
          : `Licence refused: ${done.error}`,
      )
      return send(
        res,
        done.ok ? 200 : 400,
        JSON.stringify(done.ok ? { ok: true } : done),
      )
    }
    if (path === '/licence/first-admin' && req.method === 'POST') {
      // From the installer's command line on this machine: makes the invite code for the first school admin.
      if (req.headers['x-t2s-key'] !== internal)
        return send(
          res,
          403,
          JSON.stringify({
            ok: false,
            error: 'Run this on the school server itself.',
          }),
        )
      if (!s.canChange)
        return send(
          res,
          400,
          JSON.stringify({
            ok: false,
            error: 'Install a licence first. ' + s.message,
          }),
        )
      const name = (await readBody(req)).toString('utf8')
      return send(
        res,
        200,
        JSON.stringify(await ask({ action: 'first-admin', name })),
      )
    }
    if (TO_DESK.test(path) && req.method === 'GET') {
      res.writeHead(302, { location: '/app' + url.search })
      return res.end()
    }
    if (!s.canUse && !OPEN.test(path)) {
      if (
        req.method === 'GET' &&
        (req.headers.accept ?? '').includes('text/html')
      ) {
        res.writeHead(302, {
          location: '/licence',
          'cache-control': 'no-store',
        })
        return res.end()
      }
      return send(res, 403, JSON.stringify({ ok: false, error: s.message }))
    }

    const file =
      req.method === 'GET' || req.method === 'HEAD' ? staticFile(path) : null
    const html = file ? file.endsWith('.html') : true
    if (file && !(html && s.state === 'grace')) {
      res.writeHead(200, {
        'content-type': TYPES[extname(file)] ?? 'application/octet-stream',
        'content-length': statSync(file).size,
        'cache-control': path.startsWith('/assets/')
          ? 'public, max-age=31536000, immutable'
          : 'no-cache',
      })
      return req.method === 'HEAD'
        ? res.end()
        : createReadStream(file).pipe(res)
    }

    let response: Response
    if (file)
      response = new Response(readFileSync(file), {
        headers: { 'content-type': TYPES['.html'] },
      })
    else {
      const headers = new Headers()
      for (const [k, v] of Object.entries(req.headers))
        if (typeof v === 'string' && !k.startsWith('x-t2s-')) headers.set(k, v)
      // The app reads the licence standing from this header; a browser cannot set it (stripped above).
      headers.set(
        'x-t2s-campus',
        encodeURIComponent(JSON.stringify(publicStatus(s))),
      )
      const body =
        req.method === 'GET' || req.method === 'HEAD'
          ? undefined
          : await readBody(req, 5_000_000)
      response = await app.fetch(
        new Request(url, { method: req.method, headers, body }),
      )
    }
    const type = response.headers.get('content-type') ?? ''
    const out: Record<string, string | string[]> = {}
    response.headers.forEach((v, k) => (out[k] = v))
    // Marks the browser as being on a school server, so the Study Desk knows to ask who is signed in.
    out['set-cookie'] = [
      ...response.headers.getSetCookie(),
      't2s_campus=1; Path=/; SameSite=Lax; Max-Age=31536000',
    ]
    if (
      s.state === 'grace' &&
      type.includes('text/html') &&
      path !== '/licence'
    ) {
      // Read-only period: say so on every page, labs included.
      const text = (await response.text()).replace(
        /<\/body>/i,
        banner(s) + '</body>',
      )
      delete out['content-length']
      res.writeHead(response.status, out)
      return res.end(text)
    }
    res.writeHead(response.status, out)
    if (!response.body || req.method === 'HEAD') return res.end()
    Readable.fromWeb(
      response.body as import('node:stream/web').ReadableStream,
    ).pipe(res)
  } catch (e) {
    console.error(e)
    if (!res.headersSent)
      send(
        res,
        500,
        'Something went wrong on the school server.',
        'text/plain; charset=utf-8',
      )
    else res.end()
  }
})

const port = Number(env('PORT', '8080'))
server.listen(port, env('HOST', '0.0.0.0'), () => {
  const s = current()
  console.log(`tough2simple school server ${VERSION} on port ${port}`)
  console.log(
    `Fingerprint: ${id.machine}${id.source === 'stored' ? ' (kept in the data folder; this computer has no id of its own)' : ''}`,
  )
  console.log(`Licence: ${s.message}`)
})

// Stop cleanly when the service manager asks (systemd, Ctrl+C). The app bundle listens for these signals
// too, which would otherwise leave the process running.
for (const signal of ['SIGTERM', 'SIGINT'] as const)
  process.on(signal, () => {
    clock.now()
    store.setClock(clock.now().getTime())
    server.close()
    server.closeAllConnections()
    process.exit(0)
  })

async function report() {
  if (!store.link()) return
  const seats = await ask({ action: 'seats' }).catch(() => null)
  const res = await beat(store, {
    publicKey,
    machine: id.machine,
    version: VERSION,
    seatsUsed: seats?.used,
    clock,
  })
  if (res.ok && (res.licenceChanged || res.suspended))
    console.log(
      res.suspended
        ? 'Control service: this campus is suspended.'
        : 'Control service: a new licence was installed.',
    )
}
report()
setInterval(
  report,
  Math.max(0.05, Number(env('HEARTBEAT_MINUTES', '15')) || 15) * 60_000,
).unref()
