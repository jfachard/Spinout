import {
  storeTokens,
  getAccessToken,
  getRefreshToken,
  clearTokens,
  isAuthenticated,
  refreshTokens,
  authFetch,
  logout,
  register,
  login,
} from './auth'
import { ApiError } from './api'

jest.mock('./api', () => ({
  ...jest.requireActual('./api'),
  apiFetch: jest.fn(),
}))

import { apiFetch } from './api'
const mockApiFetch = apiFetch as jest.Mock

beforeEach(() => {
  localStorage.clear()
  mockApiFetch.mockReset()
})

const tokens = { accessToken: 'acc-tok', refreshToken: 'ref-tok' }

describe('token storage', () => {
  it('storeTokens persists both tokens in localStorage', () => {
    storeTokens(tokens)
    expect(localStorage.getItem('spinout.accessToken')).toBe('acc-tok')
    expect(localStorage.getItem('spinout.refreshToken')).toBe('ref-tok')
  })

  it('getAccessToken returns null when nothing is stored', () => {
    expect(getAccessToken()).toBeNull()
  })

  it('getAccessToken returns the stored access token', () => {
    storeTokens(tokens)
    expect(getAccessToken()).toBe('acc-tok')
  })

  it('getRefreshToken returns the stored refresh token', () => {
    storeTokens(tokens)
    expect(getRefreshToken()).toBe('ref-tok')
  })

  it('clearTokens removes both tokens', () => {
    storeTokens(tokens)
    clearTokens()
    expect(getAccessToken()).toBeNull()
    expect(getRefreshToken()).toBeNull()
  })
})

describe('isAuthenticated', () => {
  it('returns false when no access token is stored', () => {
    expect(isAuthenticated()).toBe(false)
  })

  it('returns true when an access token is present', () => {
    storeTokens(tokens)
    expect(isAuthenticated()).toBe(true)
  })
})

describe('refreshTokens', () => {
  it('throws ApiError(401) and clears tokens when no refresh token is stored', async () => {
    storeTokens({ accessToken: 'old-acc', refreshToken: '' })
    localStorage.removeItem('spinout.refreshToken')

    await expect(refreshTokens()).rejects.toMatchObject({ status: 401 })
    expect(getAccessToken()).toBeNull()
  })

  it('stores new tokens and returns them on success', async () => {
    storeTokens({ accessToken: 'old', refreshToken: 'ref-tok' })
    const newTokens = { accessToken: 'new-acc', refreshToken: 'new-ref' }
    mockApiFetch.mockResolvedValue(newTokens)

    const result = await refreshTokens()
    expect(result).toEqual(newTokens)
    expect(getAccessToken()).toBe('new-acc')
  })

  it('clears tokens and rethrows when the refresh API call fails', async () => {
    storeTokens({ accessToken: 'old', refreshToken: 'ref-tok' })
    mockApiFetch.mockRejectedValue(new ApiError(401, 'Refresh invalid'))

    await expect(refreshTokens()).rejects.toMatchObject({ status: 401 })
    expect(getAccessToken()).toBeNull()
  })

  it('deduplicates concurrent refresh calls into a single request', async () => {
    storeTokens({ accessToken: 'old', refreshToken: 'ref-tok' })
    const newTokens = { accessToken: 'new-acc', refreshToken: 'new-ref' }
    mockApiFetch.mockImplementation(
      () => new Promise(resolve => setTimeout(() => resolve(newTokens), 10)),
    )

    const [result1, result2] = await Promise.all([refreshTokens(), refreshTokens()])

    expect(mockApiFetch).toHaveBeenCalledTimes(1)
    expect(result1).toEqual(newTokens)
    expect(result2).toEqual(newTokens)
  })
})

describe('authFetch', () => {
  it('throws ApiError(401) when no access token is stored', async () => {
    await expect(authFetch('/protected')).rejects.toMatchObject({ status: 401 })
  })

  it('attaches Bearer token and returns data on success', async () => {
    storeTokens(tokens)
    mockApiFetch.mockResolvedValue({ data: 'ok' })

    const result = await authFetch('/protected')
    expect(mockApiFetch).toHaveBeenCalledWith(
      '/protected',
      expect.objectContaining({
        headers: expect.objectContaining({ Authorization: 'Bearer acc-tok' }),
      }),
    )
    expect(result).toEqual({ data: 'ok' })
  })

  it('refreshes the token and retries on 401', async () => {
    storeTokens({ accessToken: 'expired', refreshToken: 'ref-tok' })
    const newTokens = { accessToken: 'fresh-acc', refreshToken: 'fresh-ref' }

    mockApiFetch
      .mockRejectedValueOnce(new ApiError(401, 'Token expired'))
      .mockResolvedValueOnce(newTokens)
      .mockResolvedValueOnce({ data: 'ok' })

    const result = await authFetch('/protected')
    expect(result).toEqual({ data: 'ok' })
    expect(mockApiFetch).toHaveBeenCalledTimes(3)
  })

  it('rethrows non-401 errors without attempting a refresh', async () => {
    storeTokens(tokens)
    mockApiFetch.mockRejectedValue(new ApiError(500, 'Server error'))

    await expect(authFetch('/protected')).rejects.toMatchObject({ status: 500 })
    expect(mockApiFetch).toHaveBeenCalledTimes(1)
  })
})

describe('logout', () => {
  it('calls the logout endpoint and clears tokens when authenticated', async () => {
    storeTokens(tokens)
    mockApiFetch.mockResolvedValue({})

    await logout()
    expect(getAccessToken()).toBeNull()
    expect(mockApiFetch).toHaveBeenCalledWith('/auth/logout', expect.objectContaining({ method: 'POST' }))
  })

  it('clears tokens even when the server call fails', async () => {
    storeTokens(tokens)
    mockApiFetch.mockRejectedValue(new ApiError(500, 'oops'))

    await logout()
    expect(getAccessToken()).toBeNull()
  })

  it('does not call the API when not authenticated', async () => {
    await logout()
    expect(mockApiFetch).not.toHaveBeenCalled()
  })
})

describe('register', () => {
  it('calls /auth/register with POST and the payload', async () => {
    const payload = { username: 'alice', email: 'a@b.com', password: 'pass1234' }
    mockApiFetch.mockResolvedValue(tokens)

    await register(payload)
    expect(mockApiFetch).toHaveBeenCalledWith(
      '/auth/register',
      expect.objectContaining({ method: 'POST', body: JSON.stringify(payload) }),
    )
  })
})

describe('login', () => {
  it('calls /auth/login with POST and the payload', async () => {
    const payload = { email: 'a@b.com', password: 'pass1234' }
    mockApiFetch.mockResolvedValue(tokens)

    await login(payload)
    expect(mockApiFetch).toHaveBeenCalledWith(
      '/auth/login',
      expect.objectContaining({ method: 'POST', body: JSON.stringify(payload) }),
    )
  })
})
