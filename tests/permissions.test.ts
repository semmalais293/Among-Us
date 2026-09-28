import { describe, it, expect } from 'vitest'
import { AuthError, extractSessionToken } from '../src/lib/permissions'
import { SESSION_COOKIE_NAME } from '../src/lib/auth'

describe('Permissions & Role Validation', () => {
  it('extracts session token from cookie header correctly', () => {
    const mockRequest = new Request('http://localhost:3000/api/submissions', {
      headers: {
        cookie: `some_cookie=hello; ${SESSION_COOKIE_NAME}=test-token-12345; other_cookie=world`,
      },
    })

    const token = extractSessionToken(mockRequest)
    expect(token).toEqual('test-token-12345')
  })

  it('returns null if session cookie is not present in request', () => {
    const mockRequest = new Request('http://localhost:3000/api/submissions', {
      headers: {
        cookie: 'some_cookie=hello; other_cookie=world',
      },
    })

    const token = extractSessionToken(mockRequest)
    expect(token).toBeNull()
  })

  it('creates AuthError with correct status code and message', () => {
    const err401 = new AuthError(401, 'Please log in')
    expect(err401.statusCode).toBe(401)
    expect(err401.message).toBe('Please log in')

    const err403 = new AuthError(403, 'Forbidden role')
    expect(err403.statusCode).toBe(403)
    expect(err403.message).toBe('Forbidden role')
  })
})
