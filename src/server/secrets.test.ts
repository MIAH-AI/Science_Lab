// @vitest-environment node
import { describe, expect, it } from 'vitest'
import {
  checkPassword,
  checkTotp,
  hashPassword,
  newToken,
  newTotpSecret,
  passwordProblem,
  tokenHash,
  totpCode,
} from './secrets'

describe('passwords', () => {
  it('hashes with Argon2id, differently each time, and checks correctly', () => {
    const a = hashPassword('correct horse battery')
    const b = hashPassword('correct horse battery')
    expect(a.startsWith('argon2id$')).toBe(true)
    expect(a).not.toBe(b)
    expect(a).not.toContain('correct horse')
    expect(checkPassword('correct horse battery', a)).toBe(true)
    expect(checkPassword('correct horse batterx', a)).toBe(false)
    expect(checkPassword('anything', 'not-a-hash')).toBe(false)
  })
  it('asks for at least 12 characters', () => {
    expect(passwordProblem('short')).toMatch(/12/)
    expect(passwordProblem('aaaaaaaaaaaaaa')).toMatch(/repeat/)
    expect(passwordProblem('a long enough one')).toBeNull()
  })
})

describe('sign-in codes', () => {
  it('matches the published test values for this method (RFC 6238)', () => {
    // RFC 6238 appendix B, SHA-1 secret "12345678901234567890", truncated to 6 digits.
    const secret = 'GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ'
    expect(totpCode(secret, 59_000)).toBe('287082')
    expect(totpCode(secret, 1_111_111_109_000)).toBe('081804')
    expect(totpCode(secret, 2_000_000_000_000)).toBe('279037')
  })
  it('accepts the current code and its neighbours, and nothing else', () => {
    const secret = newTotpSecret()
    expect(secret).toMatch(/^[A-Z2-7]{32}$/)
    const now = 1_800_000_000_000
    expect(checkTotp(secret, totpCode(secret, now), now)).not.toBeNull()
    expect(
      checkTotp(secret, totpCode(secret, now - 30_000), now),
    ).not.toBeNull()
    expect(checkTotp(secret, totpCode(secret, now - 120_000), now)).toBeNull()
    expect(checkTotp(secret, '12345', now)).toBeNull()
    expect(checkTotp(secret, 'abcdef', now)).toBeNull()
  })
})

describe('tokens', () => {
  it('are long, different each time, and stored only as a hash', () => {
    const t = newToken()
    expect(t.length).toBeGreaterThanOrEqual(43)
    expect(newToken()).not.toBe(t)
    expect(tokenHash(t)).toMatch(/^[0-9a-f]{64}$/)
    expect(tokenHash(t)).not.toContain(t)
  })
})
