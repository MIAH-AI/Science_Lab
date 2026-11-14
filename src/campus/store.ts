// What a school server keeps on disk, beside its database, in DATA_DIR:
//   licence.t2s   the signed licence
//   campus.json   where the control service is and this server's secret, once enrolled
//   status.t2s    the control service's last signed note (suspended or not)
//   clock.json    the latest time this server has seen, so turning the clock back gains nothing
//   machine-id    a fallback identity, only when the computer has no stable id of its own
import { execFileSync } from 'node:child_process'
import { createHash, randomBytes } from 'node:crypto'
import {
  existsSync,
  mkdirSync,
  readFileSync,
  renameSync,
  writeFileSync,
} from 'node:fs'
import { join } from 'node:path'
import { platform } from 'node:os'

export type CampusLink = { url: string; campusId: string; secret: string }

export function openStore(dir: string) {
  mkdirSync(dir, { recursive: true })
  const path = (name: string) => join(dir, name)
  const read = (name: string) =>
    existsSync(path(name)) ? readFileSync(path(name), 'utf8').trim() : ''
  // Write to a temporary file first, so a power cut cannot leave half a file.
  const write = (name: string, text: string) => {
    writeFileSync(path(name) + '.tmp', text, { mode: 0o600 })
    renameSync(path(name) + '.tmp', path(name))
  }
  const json = <T>(name: string): T | null => {
    try {
      return JSON.parse(read(name) || 'null') as T | null
    } catch {
      return null
    }
  }
  return {
    dir,
    licence: () => read('licence.t2s'),
    setLicence: (token: string) => write('licence.t2s', token.trim() + '\n'),
    status: () => read('status.t2s'),
    setStatus: (token: string) => write('status.t2s', token.trim() + '\n'),
    link: () => json<CampusLink>('campus.json'),
    setLink: (link: CampusLink) => write('campus.json', JSON.stringify(link)),
    clock: () => json<{ seen: number }>('clock.json')?.seen ?? 0,
    setClock: (seen: number) => write('clock.json', JSON.stringify({ seen })),
    machineSeed: () => {
      let seed = read('machine-id')
      if (!seed) {
        seed = randomBytes(32).toString('hex')
        write('machine-id', seed)
      }
      return seed
    },
  }
}
export type Store = ReturnType<typeof openStore>

// The computer's own stable id, where the operating system has one.
function systemId(): string {
  try {
    if (platform() === 'linux')
      return (
        readFileSync('/etc/machine-id', 'utf8').trim() ||
        readFileSync('/var/lib/dbus/machine-id', 'utf8').trim()
      )
    if (platform() === 'darwin') {
      const out = execFileSync(
        'ioreg',
        ['-rd1', '-c', 'IOPlatformExpertDevice'],
        { encoding: 'utf8' },
      )
      return /"IOPlatformUUID" = "([^"]+)"/.exec(out)?.[1] ?? ''
    }
    if (platform() === 'win32') {
      const out = execFileSync(
        'reg',
        [
          'query',
          'HKLM\\SOFTWARE\\Microsoft\\Cryptography',
          '/v',
          'MachineGuid',
        ],
        { encoding: 'utf8' },
      )
      return /MachineGuid\s+REG_SZ\s+(\S+)/.exec(out)?.[1] ?? ''
    }
  } catch {
    /* fall through to the stored id */
  }
  return ''
}

export type Fingerprint = {
  machine: string
  // 'system' when it comes from the computer itself; 'stored' when we had to make one up and keep it
  // in DATA_DIR, which is weaker because the folder can be copied to another computer.
  source: 'system' | 'stored'
}

export function fingerprint(store: Store, id = systemId()): Fingerprint {
  const source = id ? 'system' : 'stored'
  const machine = createHash('sha256')
    .update('tough2simple:' + (id || store.machineSeed()))
    .digest('hex')
  return { machine, source }
}
