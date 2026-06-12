import { registerSchema, loginSchema } from './validation'

describe('registerSchema', () => {
  const valid = { username: 'alice', email: 'alice@example.com', password: 'password1' }

  it('accepts valid data', () => {
    expect(registerSchema.safeParse(valid).success).toBe(true)
  })

  it('rejects empty username', () => {
    const result = registerSchema.safeParse({ ...valid, username: '' })
    expect(result.success).toBe(false)
    const messages = result.error?.issues.map(i => i.message)
    expect(messages).toContain("Nom d'utilisateur requis")
  })

  it('rejects username longer than 20 characters', () => {
    const result = registerSchema.safeParse({ ...valid, username: 'a'.repeat(21) })
    expect(result.success).toBe(false)
    const messages = result.error?.issues.map(i => i.message)
    expect(messages).toContain('20 caractères maximum')
  })

  it('rejects invalid email', () => {
    const result = registerSchema.safeParse({ ...valid, email: 'not-an-email' })
    expect(result.success).toBe(false)
    const messages = result.error?.issues.map(i => i.message)
    expect(messages).toContain('Email invalide')
  })

  it('rejects empty password', () => {
    const result = registerSchema.safeParse({ ...valid, password: '' })
    expect(result.success).toBe(false)
    const messages = result.error?.issues.map(i => i.message)
    expect(messages?.some(m => m.includes('requis') || m.includes('minimum'))).toBe(true)
  })

  it('rejects password shorter than 8 characters', () => {
    const result = registerSchema.safeParse({ ...valid, password: 'short' })
    expect(result.success).toBe(false)
    const messages = result.error?.issues.map(i => i.message)
    expect(messages).toContain('8 caractères minimum')
  })

  it('accepts a password of exactly 8 characters', () => {
    expect(registerSchema.safeParse({ ...valid, password: '12345678' }).success).toBe(true)
  })
})

describe('loginSchema', () => {
  const valid = { email: 'alice@example.com', password: 'password1' }

  it('accepts valid credentials', () => {
    expect(loginSchema.safeParse(valid).success).toBe(true)
  })

  it('rejects invalid email', () => {
    const result = loginSchema.safeParse({ ...valid, email: 'bad' })
    expect(result.success).toBe(false)
    const messages = result.error?.issues.map(i => i.message)
    expect(messages).toContain('Email invalide')
  })

  it('rejects password shorter than 8 characters', () => {
    const result = loginSchema.safeParse({ ...valid, password: 'abc' })
    expect(result.success).toBe(false)
    const messages = result.error?.issues.map(i => i.message)
    expect(messages).toContain('8 caractères minimum')
  })
})
