import {
  storeMembership,
  getMembership,
  clearMembership,
  fetchSession,
  fetchSessionHistory,
  joinSession,
  createSession,
} from './session'

jest.mock('./api', () => ({
  ...jest.requireActual('./api'),
  apiFetch: jest.fn(),
}))

jest.mock('./auth', () => ({
  ...jest.requireActual('./auth'),
  authFetch: jest.fn(),
  isAuthenticated: jest.fn(),
}))

import { apiFetch } from './api'
import { authFetch, isAuthenticated } from './auth'
const mockApiFetch = apiFetch as jest.Mock
const mockAuthFetch = authFetch as jest.Mock
const mockIsAuthenticated = isAuthenticated as jest.Mock

beforeEach(() => {
  localStorage.clear()
  mockApiFetch.mockReset()
  mockAuthFetch.mockReset()
  mockIsAuthenticated.mockReset()
})

describe('membership storage', () => {
  const membership = { code: 'ABC123', memberId: 'm1', guestName: 'Alice' }

  it('storeMembership serializes membership to localStorage', () => {
    storeMembership(membership)
    expect(localStorage.getItem('spinout.membership')).toBe(JSON.stringify(membership))
  })

  it('getMembership returns null when nothing is stored', () => {
    expect(getMembership()).toBeNull()
  })

  it('getMembership deserializes and returns the stored membership', () => {
    storeMembership(membership)
    expect(getMembership()).toEqual(membership)
  })

  it('getMembership returns null when stored value is invalid JSON', () => {
    localStorage.setItem('spinout.membership', '{not valid json}')
    expect(getMembership()).toBeNull()
  })

  it('clearMembership removes the stored membership', () => {
    storeMembership(membership)
    clearMembership()
    expect(getMembership()).toBeNull()
  })
})

describe('fetchSession', () => {
  it('uppercases and trims the session code before fetching', async () => {
    mockApiFetch.mockResolvedValue({ id: 's1', code: 'ABC123' })
    await fetchSession('  abc123  ')
    expect(mockApiFetch).toHaveBeenCalledWith('/session/ABC123')
  })
})

describe('fetchSessionHistory', () => {
  it('uppercases and trims the session code before fetching', async () => {
    mockApiFetch.mockResolvedValue({ session: {}, spins: [] })
    await fetchSessionHistory('  xyz789  ')
    expect(mockApiFetch).toHaveBeenCalledWith('/session/XYZ789/history')
  })
})

describe('joinSession', () => {
  it('uses authFetch when the user is authenticated', async () => {
    mockIsAuthenticated.mockReturnValue(true)
    mockAuthFetch.mockResolvedValue({ session: {}, member: {} })

    await joinSession('abc123')
    expect(mockAuthFetch).toHaveBeenCalledWith(
      '/session/join',
      expect.objectContaining({ method: 'POST', body: JSON.stringify({ code: 'ABC123', guestName: undefined }) }),
    )
    expect(mockApiFetch).not.toHaveBeenCalled()
  })

  it('uses apiFetch with guestName when the user is not authenticated', async () => {
    mockIsAuthenticated.mockReturnValue(false)
    mockApiFetch.mockResolvedValue({ session: {}, member: {} })

    await joinSession('abc123', 'Bob')
    expect(mockApiFetch).toHaveBeenCalledWith(
      '/session/join',
      expect.objectContaining({ method: 'POST', body: JSON.stringify({ code: 'ABC123', guestName: 'Bob' }) }),
    )
  })

  it('normalizes the session code to uppercase and trims whitespace', async () => {
    mockIsAuthenticated.mockReturnValue(false)
    mockApiFetch.mockResolvedValue({ session: {}, member: {} })

    await joinSession('  xyz  ', 'Guest')
    const body = JSON.parse(mockApiFetch.mock.calls[0][1].body)
    expect(body.code).toBe('XYZ')
  })
})

describe('createSession', () => {
  it('calls authFetch with the provided categories', async () => {
    mockAuthFetch.mockResolvedValue({ id: 's1', code: 'NEW123' })

    await createSession(['indoor', 'sport'])
    expect(mockAuthFetch).toHaveBeenCalledWith(
      '/session',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ categories: ['indoor', 'sport'] }),
      }),
    )
  })

  it('uses an empty categories array by default', async () => {
    mockAuthFetch.mockResolvedValue({ id: 's1', code: 'NEW123' })

    await createSession()
    const body = JSON.parse(mockAuthFetch.mock.calls[0][1].body)
    expect(body.categories).toEqual([])
  })
})
