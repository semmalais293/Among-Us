import { describe, it, expect } from 'vitest'
import { generateInviteCode } from '../src/services/teams'

describe('Teams Service', () => {
  it('generates uppercase invite codes with default or custom prefix', () => {
    const code1 = generateInviteCode()
    const code2 = generateInviteCode('HACK')

    expect(code1.startsWith('TEAM-')).toBe(true)
    expect(code2.startsWith('HACK-')).toBe(true)
    expect(code1).toEqual(code1.toUpperCase())
    expect(code1).not.toEqual(code2)
  })

  it('generates unique codes across successive invocations', () => {
    const codes = new Set()
    for (let i = 0; i < 50; i++) {
      codes.add(generateInviteCode())
    }
    expect(codes.size).toBe(50)
  })
})
