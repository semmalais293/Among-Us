import { describe, it, expect } from 'vitest'
import { hashPassword, verifyPassword, generateSessionToken } from '../src/lib/auth'

describe('Auth Utilities', () => {
  it('correctly hashes and verifies passwords using bcrypt', async () => {
    const password = 'SuperSecretHackathonPassword123!'
    const hash = await hashPassword(password)

    expect(hash).toBeDefined()
    expect(hash).not.toEqual(password)

    const isValid = await verifyPassword(password, hash)
    expect(isValid).toBe(true)

    const isInvalid = await verifyPassword('WrongPassword', hash)
    expect(isInvalid).toBe(false)
  })

  it('generates unique crypto session tokens', () => {
    const token1 = generateSessionToken()
    const token2 = generateSessionToken()

    expect(token1).toHaveLength(64) // 32 bytes hex
    expect(token2).toHaveLength(64)
    expect(token1).not.toEqual(token2)
  })
})
