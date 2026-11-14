// Bundles the school server and its command line tool into dist/campus. Run after `vite build`:
//
//   pnpm build && node tools/build-campus.mjs
//
// If LICENCE_PUBLIC_KEY is set (or licence-public.pem is in the project folder), the public key is copied
// in beside the server, so the package can check licences without any settings on the school's machine.
/* global process, console */
import { build } from 'esbuild'
import { copyFileSync, existsSync, readFileSync, writeFileSync } from 'node:fs'

const { version } = JSON.parse(readFileSync('package.json', 'utf8'))
if (!existsSync('dist/server/server.js')) {
  console.error('Run `pnpm build` first: dist/server/server.js is missing.')
  process.exit(1)
}
await build({
  entryPoints: { server: 'src/campus/server.ts', cli: 'src/campus/cli.ts' },
  outdir: 'dist/campus',
  outExtension: { '.js': '.mjs' },
  bundle: true,
  platform: 'node',
  format: 'esm',
  target: 'node22',
  define: { __VERSION__: JSON.stringify(version) },
  logLevel: 'warning',
})
const key = (process.env.LICENCE_PUBLIC_KEY ?? '').replace(/\\n/g, '\n')
if (key) writeFileSync('dist/campus/licence-public.pem', key)
else if (existsSync('licence-public.pem'))
  copyFileSync('licence-public.pem', 'dist/campus/licence-public.pem')
console.log(
  `dist/campus built (version ${version})${existsSync('dist/campus/licence-public.pem') ? ', with the public key' : ', WITHOUT a public key: set LICENCE_PUBLIC_KEY on the server'}`,
)
