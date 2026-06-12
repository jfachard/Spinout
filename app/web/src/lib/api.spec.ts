import { ApiError, apiFetch } from './api'

const mockFetch = jest.fn()
beforeAll(() => { global.fetch = mockFetch })
afterEach(() => mockFetch.mockReset())

function makeResponse(
  status: number,
  body: unknown,
  contentType = 'application/json',
): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    headers: { get: (key: string) => (key === 'content-type' ? contentType : null) },
    json: () => Promise.resolve(body),
  } as unknown as Response
}

describe('ApiError', () => {
  it('stores status and message', () => {
    const err = new ApiError(404, 'Not found')
    expect(err.status).toBe(404)
    expect(err.message).toBe('Not found')
  })

  it('has name ApiError', () => {
    expect(new ApiError(500, 'oops').name).toBe('ApiError')
  })

  it('is an instance of Error', () => {
    expect(new ApiError(400, 'bad')).toBeInstanceOf(Error)
  })
})

describe('apiFetch', () => {
  it('throws ApiError(0) when fetch throws a network error', async () => {
    mockFetch.mockRejectedValue(new TypeError('Failed to fetch'))

    await expect(apiFetch('/test')).rejects.toMatchObject({
      status: 0,
      message: expect.stringContaining('serveur'),
    })
  })

  it('adds Content-Type: application/json to every request', async () => {
    mockFetch.mockResolvedValue(makeResponse(200, { ok: true }))
    await apiFetch('/test')
    expect(mockFetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        headers: expect.objectContaining({ 'Content-Type': 'application/json' }),
      }),
    )
  })

  it('returns parsed JSON body on success', async () => {
    mockFetch.mockResolvedValue(makeResponse(200, { id: 'abc' }))
    const result = await apiFetch<{ id: string }>('/test')
    expect(result).toEqual({ id: 'abc' })
  })

  it('throws ApiError with status and string message on non-ok response', async () => {
    mockFetch.mockResolvedValue(makeResponse(404, { message: 'Not found' }))
    await expect(apiFetch('/test')).rejects.toMatchObject({ status: 404, message: 'Not found' })
  })

  it('joins array messages from NestJS validation errors', async () => {
    mockFetch.mockResolvedValue(makeResponse(400, { message: ['field A is required', 'field B is invalid'] }))
    await expect(apiFetch('/test')).rejects.toMatchObject({
      message: 'field A is required, field B is invalid',
    })
  })

  it('falls back to the error field when message is absent', async () => {
    mockFetch.mockResolvedValue(makeResponse(401, { error: 'Unauthorized' }))
    await expect(apiFetch('/test')).rejects.toMatchObject({ message: 'Unauthorized' })
  })

  it('falls back to "Erreur N" when the body has no message or error', async () => {
    mockFetch.mockResolvedValue(makeResponse(503, {}))
    await expect(apiFetch('/test')).rejects.toMatchObject({ message: 'Erreur 503' })
  })

  it('handles non-JSON error responses gracefully', async () => {
    mockFetch.mockResolvedValue(makeResponse(500, null, 'text/html'))
    await expect(apiFetch('/test')).rejects.toMatchObject({ status: 500 })
  })
})
