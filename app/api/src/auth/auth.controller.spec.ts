import { Test, TestingModule } from '@nestjs/testing'
import { UnauthorizedException } from '@nestjs/common'
import { AuthController } from './auth.controller'
import { AuthService } from './auth.service'
import { ThrottlerGuard } from '@nestjs/throttler'

const mockTokens = { accessToken: 'access', refreshToken: 'refresh' }
const fakeUser = { id: 'u1', email: 'alice@example.com', username: 'alice', tokenVersion: 0 }

describe('AuthController', () => {
  let controller: AuthController
  let auth: Record<string, jest.Mock>

  beforeEach(async () => {
    auth = {
      register: jest.fn(),
      findUserByEmail: jest.fn(),
      login: jest.fn(),
      verifyRefreshToken: jest.fn(),
      findUserById: jest.fn(),
      logout: jest.fn(),
    }

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [{ provide: AuthService, useValue: auth }],
    })
      .overrideGuard(ThrottlerGuard)
      .useValue({ canActivate: () => true })
      .compile()

    controller = module.get<AuthController>(AuthController)
  })

  it('should be defined', () => {
    expect(controller).toBeDefined()
  })

  describe('register', () => {
    it('delegates to auth.register', async () => {
      auth.register.mockResolvedValue(mockTokens)
      const dto = { email: 'alice@example.com', username: 'alice', password: 'pass' }
      const result = await controller.register(dto as any)
      expect(auth.register).toHaveBeenCalledWith(dto)
      expect(result).toEqual(mockTokens)
    })
  })

  describe('login', () => {
    it('calls findUserByEmail then login', async () => {
      auth.findUserByEmail.mockResolvedValue(fakeUser)
      auth.login.mockResolvedValue(mockTokens)

      const result = await controller.login({ email: 'alice@example.com', password: 'pass' } as any)
      expect(auth.findUserByEmail).toHaveBeenCalledWith('alice@example.com', 'pass')
      expect(auth.login).toHaveBeenCalledWith(fakeUser)
      expect(result).toEqual(mockTokens)
    })
  })

  describe('refresh', () => {
    it('throws UnauthorizedException when user no longer exists', async () => {
      auth.verifyRefreshToken.mockResolvedValue({ userId: 'u1', tokenVersion: 0 })
      auth.findUserById.mockResolvedValue(null)

      await expect(controller.refresh('valid-token')).rejects.toThrow(UnauthorizedException)
    })

    it('throws UnauthorizedException when tokenVersion has been revoked', async () => {
      auth.verifyRefreshToken.mockResolvedValue({ userId: 'u1', tokenVersion: 0 })
      auth.findUserById.mockResolvedValue({ ...fakeUser, tokenVersion: 1 })

      await expect(controller.refresh('old-token')).rejects.toThrow(UnauthorizedException)
    })

    it('returns new tokens when token is valid and version matches', async () => {
      auth.verifyRefreshToken.mockResolvedValue({ userId: 'u1', tokenVersion: 0 })
      auth.findUserById.mockResolvedValue(fakeUser)
      auth.login.mockResolvedValue(mockTokens)

      const result = await controller.refresh('valid-token')
      expect(result).toEqual(mockTokens)
    })
  })

  describe('logout', () => {
    it('delegates to auth.logout with userId from request', async () => {
      auth.logout.mockResolvedValue(undefined)
      await controller.logout({ user: { userId: 'u1' } } as any)
      expect(auth.logout).toHaveBeenCalledWith('u1')
    })
  })
})
