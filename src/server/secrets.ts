// Passwords, sign-in codes and random tokens. Nothing here stores anything; see accounts.ts.
import {
  argon2,
  createHash,
  createHmac,
  randomBytes,
  timingSafeEqual,
} from 'node:crypto'

/* Passwords: Argon2id (SEC-6), with the settings stored beside the hash so they can be raised later. */
const ARGON = { memory: 19_456, passes: 2, parallelism: 1, tagLength: 32 } // OWASP's minimum for Argon2id

/* Hashing is slow on purpose. It runs off the main thread, at most two at a time, so a flood of sign-in
   attempts cannot stop the server answering everyone else; beyond a short queue, callers are told to wait. */
let running = 0
const waiting: (() => void)[] = []
export class Busy extends Error {}

async function derive(
  message: string,
  nonce: Buffer,
  cost: {
    memory: number
    passes: number
    parallelism: number
    tagLength: number
  },
) {
  if (running >= 2) {
    if (waiting.length >= 40)
      throw new Busy('The server is busy. Try again in a moment.')
    await new Promise<void>((go) => waiting.push(go))
  }
  running++
  try {
    return await new Promise<Buffer>((resolve, reject) =>
      argon2('argon2id', { message, nonce, ...cost }, (err, key) =>
        err ? reject(err) : resolve(key),
      ),
    )
  } finally {
    running--
    waiting.shift()?.()
  }
}

export async function hashPassword(password: string) {
  const nonce = randomBytes(16)
  const tag = await derive(password, nonce, ARGON)
  return [
    'argon2id',
    ARGON.memory,
    ARGON.passes,
    ARGON.parallelism,
    nonce.toString('base64url'),
    tag.toString('base64url'),
  ].join('$')
}

export async function checkPassword(password: string, stored: string) {
  const [kind, memory, passes, parallelism, nonce, tag] = stored.split('$')
  if (kind !== 'argon2id' || !tag) return false
  const want = Buffer.from(tag, 'base64url')
  const got = await derive(password, Buffer.from(nonce, 'base64url'), {
    memory: Number(memory),
    passes: Number(passes),
    parallelism: Number(parallelism),
    tagLength: want.length,
  })
  return got.length === want.length && timingSafeEqual(got, want)
}

// A stand-in hash, checked when the name is unknown so that answer takes as long as a wrong password.
let dummy: Promise<string> | null = null
export const dummyHash = () => (dummy ??= hashPassword('not a real password'))

// A plain reason a new password is not acceptable, or null when it is.
export function passwordProblem(password: string): string | null {
  if (password.length < 12) return 'Use at least 12 characters.'
  if (password.length > 200) return 'Use fewer than 200 characters.'
  if (/^(.)\1+$/.test(password)) return 'Do not repeat one character.'
  return null
}

/* Random tokens. The browser or the school server holds the token; only its SHA-256 is stored. */
export const newToken = (bytes = 32) => randomBytes(bytes).toString('base64url')
export const tokenHash = (token: string) =>
  createHash('sha256').update(token).digest('hex')

/* Sign-in codes from an authenticator app (TOTP, RFC 6238: SHA-1, 6 digits, 30 seconds). */
const B32 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'

// 32 base32 characters = 160 bits, the length the standard recommends.
export function newTotpSecret() {
  let out = ''
  for (const byte of randomBytes(32)) out += B32[byte % 32]
  return out
}

function base32Decode(text: string) {
  let bits = ''
  for (const ch of text.replace(/[\s=-]/g, '').toUpperCase()) {
    const v = B32.indexOf(ch)
    if (v < 0) throw new Error('Bad base32')
    bits += v.toString(2).padStart(5, '0')
  }
  const bytes = bits.match(/.{8}/g) ?? []
  return Buffer.from(bytes.map((b) => parseInt(b, 2)))
}

export function totpCode(secret: string, at: number, step = 0) {
  const counter = Buffer.alloc(8)
  counter.writeBigUInt64BE(BigInt(Math.floor(at / 30_000) + step))
  const mac = createHmac('sha1', base32Decode(secret)).update(counter).digest()
  const o = mac[mac.length - 1] & 15
  const n = (mac.readUInt32BE(o) & 0x7fffffff) % 1_000_000
  return String(n).padStart(6, '0')
}

// Accepts the current code and the ones just before and after it, to allow for a phone clock that is a little off.
// Returns the time step that matched, so the caller can refuse a code that was already used.
export function checkTotp(secret: string, code: string, at: number) {
  const clean = code.replace(/\s/g, '')
  if (!/^\d{6}$/.test(clean)) return null
  for (const step of [0, -1, 1]) {
    const want = Buffer.from(totpCode(secret, at, step))
    if (timingSafeEqual(want, Buffer.from(clean)))
      return Math.floor(at / 30_000) + step
  }
  return null
}

// What an authenticator app reads, as a link or typed in by hand.
export const totpUri = (secret: string, email: string) =>
  `otpauth://totp/${encodeURIComponent('tough2simple console:' + email)}?secret=${secret}&issuer=${encodeURIComponent('tough2simple console')}&algorithm=SHA1&digits=6&period=30`
