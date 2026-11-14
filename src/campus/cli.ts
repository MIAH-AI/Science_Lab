// Commands for the person installing a school server, run on that server:
//
//   node dist/campus/cli.mjs fingerprint                 this server's fingerprint, to give to tough2simple
//   node dist/campus/cli.mjs status                      where the licence stands
//   node dist/campus/cli.mjs licence <file>              install a licence file by hand (no internet needed)
//   node dist/campus/cli.mjs enrol <address> <code>      enrol with the control service using a one-time code
import { existsSync, readFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { enrol } from './heartbeat'
import { campusStanding, installLicence } from './standing'
import { fingerprint, openStore } from './store'

declare const __VERSION__: string
const VERSION = typeof __VERSION__ === 'string' ? __VERSION__ : 'dev'
const here = dirname(fileURLToPath(import.meta.url))
const pemFile = [
  join(here, 'licence-public.pem'),
  join(here, '..', '..', 'licence-public.pem'),
].find(existsSync)
const publicKey =
  (process.env.LICENCE_PUBLIC_KEY ?? '').replace(/\\n/g, '\n') ||
  (pemFile ? readFileSync(pemFile, 'utf8') : '')
const store = openStore(resolve(process.env.DATA_DIR?.trim() || '.data'))
const id = fingerprint(store)
const [command, a, b] = process.argv.slice(2)
const fail = (text: string) => {
  console.error(text)
  process.exit(1)
}

if (command === 'fingerprint') console.log(id.machine)
else if (command === 'status') {
  const s = campusStanding(store, {
    publicKey,
    machine: id.machine,
    now: new Date(Math.max(Date.now(), store.clock())),
  })
  console.log(s.message)
  console.log(
    `State: ${s.state}${s.licence ? ` · ${s.licence.kind} · ${s.licence.seats} seats · ${s.licence.starts} to ${s.licence.ends}` : ''}`,
  )
  console.log(
    `Enrolled with the control service: ${store.link() ? 'yes' : 'no'}`,
  )
  console.log(`Fingerprint: ${id.machine}`)
  if (!s.canUse) process.exitCode = 2
} else if (command === 'licence') {
  if (!a || !existsSync(a)) fail('Give the path to the licence file.')
  const res = installLicence(store, readFileSync(a, 'utf8'), {
    publicKey,
    machine: id.machine,
  })
  if (!res.ok) fail('Not installed. ' + res.error)
  else
    console.log(
      `Installed: ${res.licence.school}, ${res.licence.campus}, ${res.licence.starts} to ${res.licence.ends}.`,
    )
} else if (command === 'enrol') {
  if (!a || !b) fail('Usage: enrol <control service address> <one-time code>')
  const res = await enrol(store, {
    url: a,
    code: b,
    publicKey,
    machine: id.machine,
    version: VERSION,
  })
  if (!res.ok) fail('Not enrolled. ' + res.error)
  else
    console.log(
      `Enrolled for ${res.school}, ${res.campus}. ${res.licensed ? 'The licence is installed.' : 'No licence has been issued yet; it will arrive on a later check-in.'}`,
    )
} else
  fail('Commands: fingerprint, status, licence <file>, enrol <address> <code>')
