// Makes the key pair that signs school licences. Run it once, on a trusted computer:
//
//   node tools/make-licence-key.mjs <folder>
//
// It writes two files into <folder>:
//   licence-private.pem  Keep this secret. Put its contents in the control service's settings as
//                        LICENCE_SIGNING_KEY, store a copy somewhere safe and offline, then delete the file.
//                        Anyone who has it can issue licences. If it is lost, every school server needs a
//                        new package with a new public key.
//   licence-public.pem   Not secret. Put its contents in LICENCE_PUBLIC_KEY for the control service and for
//                        every school server package.
// Nothing is printed except where the files went.
/* global process, console */
import { generateKeyPairSync } from 'node:crypto'
import { existsSync, mkdirSync, writeFileSync } from 'node:fs'
import { join, resolve } from 'node:path'

const dir = resolve(process.argv[2] ?? '')
if (!process.argv[2]) {
  console.error('Usage: node tools/make-licence-key.mjs <folder>')
  process.exit(1)
}
mkdirSync(dir, { recursive: true })
const priv = join(dir, 'licence-private.pem')
const pub = join(dir, 'licence-public.pem')
if (existsSync(priv) || existsSync(pub)) {
  console.error(`There are already key files in ${dir}. Nothing was changed.`)
  process.exit(1)
}
const { publicKey, privateKey } = generateKeyPairSync('ed25519')
writeFileSync(priv, privateKey.export({ type: 'pkcs8', format: 'pem' }), {
  mode: 0o600,
})
writeFileSync(pub, publicKey.export({ type: 'spki', format: 'pem' }), {
  mode: 0o644,
})
console.log(`Private key: ${priv}\nPublic key:  ${pub}`)
