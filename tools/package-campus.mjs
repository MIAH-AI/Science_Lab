// Makes the package that is copied to a school's server:
//
//   pnpm build:campus && node tools/package-campus.mjs
//
// Result: dist/tough2simple-school-<version>.tar.gz. It holds the built app and labs, the school server,
// its run-time packages, the public key (when LICENCE_PUBLIC_KEY was set for the build) and INSTALL.md.
// The school's machine needs only Node 24 and this file; nothing is downloaded during the install.
/* global process, console */
import { execFileSync } from 'node:child_process'
import {
  cpSync,
  existsSync,
  mkdirSync,
  readFileSync,
  rmSync,
  statSync,
  writeFileSync,
} from 'node:fs'
import { join } from 'node:path'

const pkg = JSON.parse(readFileSync('package.json', 'utf8'))
const name = `tough2simple-school-${pkg.version}`
const stage = join('dist', 'package', name)
for (const need of [
  'dist/server/server.js',
  'dist/campus/server.mjs',
  'dist/client/labs',
])
  if (!existsSync(need)) {
    console.error(`Missing ${need}. Run \`pnpm build:campus\` first.`)
    process.exit(1)
  }
rmSync(join('dist', 'package'), { recursive: true, force: true })
mkdirSync(join(stage, 'dist'), { recursive: true })
for (const part of ['client', 'server', 'campus'])
  cpSync(join('dist', part), join(stage, 'dist', part), { recursive: true })
if (existsSync('dist/campus/licence-public.pem'))
  cpSync('dist/campus/licence-public.pem', join(stage, 'licence-public.pem'))

// Only what the server needs while running; the versions come from the project's lock file.
writeFileSync(
  join(stage, 'package.json'),
  JSON.stringify(
    {
      name: 'tough2simple-school',
      version: pkg.version,
      private: true,
      type: 'module',
      dependencies: pkg.dependencies,
    },
    null,
    2,
  ),
)
cpSync('pnpm-lock.yaml', join(stage, 'pnpm-lock.yaml'))
cpSync('pnpm-workspace.yaml', join(stage, 'pnpm-workspace.yaml'))
execFileSync(
  'pnpm',
  [
    'install',
    '--prod',
    '--ignore-scripts',
    '--config.node-linker=hoisted',
    '--no-frozen-lockfile',
  ],
  { cwd: stage, stdio: 'inherit' },
)
rmSync(join(stage, 'pnpm-lock.yaml'))
rmSync(join(stage, 'pnpm-workspace.yaml'))

writeFileSync(
  join(stage, 'tough2simple.service'),
  `[Unit]
Description=tough2simple school server
After=network.target

[Service]
User=tough2simple
WorkingDirectory=/opt/tough2simple
Environment=PORT=8080
Environment=DATA_DIR=/var/lib/tough2simple
ExecStart=/usr/bin/node /opt/tough2simple/dist/campus/server.mjs
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
`,
)
cpSync('doc/platform/INSTALL.md', join(stage, 'INSTALL.md'))
const out = join('dist', name + '.tar.gz')
execFileSync('tar', ['-czf', out, '-C', join('dist', 'package'), name])
console.log(
  `${out} (${Math.round(statSync(out).size / 1e6)} MB)${existsSync(join(stage, 'licence-public.pem')) ? '' : '\nNo public key was included: set LICENCE_PUBLIC_KEY when building, or copy licence-public.pem into the folder on the server.'}`,
)
