import { Test, TestingModule } from '@nestjs/testing'
import { ConflictException, UnauthorizedException } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import * as bcrypt from 'bcrypt'
import { AuthService } from './auth.service'
import { PrismaService } from '../prisma/prisma.service'

jest.mock('bcrypt', () => ({
  hash: jest.fn(),
  compare: jest.fn(),
}))

const fakeUser = {
  id: 'user-1',
  email: 'alice@example.com',
  username: 'alice',
  passwordHash: 'hashed',
  tokenVersion: 0,
  createdAt: new Date(),
}

describe('AuthService', () => {
  let service: AuthService
  let prisma: Record<string, Record<string, jest.Mock>>
  let jwtService: { sign: jest.Mock; verify: jest.Mock }

  beforeEach(async () => {
    prisma = {
      user: {
        findFirst: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
    }
    jwtService = { sign: jest.fn().mockReturnValue('token'), verify: jest.fn() }

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: prisma },
        { provide: JwtService, useValue: jwtService },
      ],
    }).compile()

    service = module.get<AuthService>(AuthService)
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })

  describe('register', () => {
    it('throws ConflictException when email or username already exists', async () => {
      prisma.user.findFirst.mockResolvedValue(fakeUser)
      await expect(
        service.register({ email: 'alice@example.com', username: 'alice', password: 'pass' }),
      ).rejects.toThrow(ConflictException)
    })

    it('hashes the password and returns tokens', async () => {
      prisma.user.findFirst.mockResolvedValue(null)
      ;(bcrypt.hash as jest.Mock).mockResolvedValue('hashed-pw')
      prisma.user.create.mockResolvedValue(fakeUser)

      const result = await service.register({ email: 'alice@example.com', username: 'alice', password: 'plain' })

      expect(bcrypt.hash).toHaveBeenCalledWith('plain', 10)
      expect(prisma.user.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ passwordHash: 'hashed-pw' }) }),
      )
      expect(result).toHaveProperty('accessToken')
      expect(result).toHaveProperty('refreshToken')
    })
  })

  describe('findUserByEmail', () => {
    it('throws UnauthorizedException when email not found', async () => {
      prisma.user.findUnique.mockResolvedValue(null)
      await expect(service.findUserByEmail('nope@x.com', 'pass')).rejects.toThrow(UnauthorizedException)
    })

    it('throws UnauthorizedException when password is wrong', async () => {
      prisma.user.findUnique.mockResolvedValue(fakeUser)
      ;(bcrypt.compare as jest.Mock).mockResolvedValue(false)
      await expect(service.findUserByEmail('alice@example.com', 'wrong')).rejects.toThrow(UnauthorizedException)
    })

    it('returns user without passwordHash on success', async () => {
      prisma.user.findUnique.mockResolvedValue(fakeUser)
      ;(bcrypt.compare as jest.Mock).mockResolvedValue(true)

      const result = await service.findUserByEmail('alice@example.com', 'correct')
      expect(result).not.toHaveProperty('passwordHash')
      expect(result.email).toBe('alice@example.com')
    })
  })

  describe('login', () => {
    it('returns accessToken and refreshToken', async () => {
      const result = await service.login(fakeUser)
      expect(result).toHaveProperty('accessToken')
      expect(result).toHaveProperty('refreshToken')
      expect(jwtService.sign).toHaveBeenCalledTimes(2)
    })
  })

  describe('verifyRefreshToken', () => {
    it('throws UnauthorizedException on invalid token', async () => {
      jwtService.verify.mockImplementation(() => { throw new Error('expired') })
      await expect(service.verifyRefreshToken('bad-token')).rejects.toThrow(UnauthorizedException)
    })

    it('throws UnauthorizedException when token type is not refresh', async () => {
      jwtService.verify.mockReturnValue({ userId: 'u1', tokenVersion: 0, type: 'access' })
      await expect(service.verifyRefreshToken('access-token')).rejects.toThrow(UnauthorizedException)
    })

    it('returns the payload when token is valid', async () => {
      const payload = { userId: 'u1', tokenVersion: 0, type: 'refresh' }
      jwtService.verify.mockReturnValue(payload)
      const result = await service.verifyRefreshToken('valid-token')
      expect(result).toEqual(payload)
    })
  })

  describe('logout', () => {
    it('increments tokenVersion for the user', async () => {
      prisma.user.update.mockResolvedValue({})
      await service.logout('user-1')
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        data: { tokenVersion: { increment: 1 } },
      })
    })
  })
})
