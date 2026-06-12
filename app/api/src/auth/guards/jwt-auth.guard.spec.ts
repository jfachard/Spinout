import { UnauthorizedException } from '@nestjs/common'
import { JwtAuthGuard } from './jwt-auth.guard'

describe('JwtAuthGuard', () => {
  let guard: JwtAuthGuard

  beforeEach(() => {
    guard = new JwtAuthGuard()
  })

  it('returns the user when authentication succeeds', () => {
    const user = { userId: 'u1' }
    expect(guard.handleRequest(null, user)).toBe(user)
  })

  it('throws UnauthorizedException when user is falsy', () => {
    expect(() => guard.handleRequest(null, null)).toThrow(UnauthorizedException)
    expect(() => guard.handleRequest(null, undefined)).toThrow(UnauthorizedException)
    expect(() => guard.handleRequest(null, false)).toThrow(UnauthorizedException)
  })

  it('rethrows the original error when err is provided', () => {
    const original = new Error('Token expired')
    expect(() => guard.handleRequest(original, null)).toThrow(original)
  })
})
