import { z } from 'zod';

export const registerSchema = z.object({
  username: z
    .string()
    .min(1, "Nom d'utilisateur requis")
    .max(20, '20 caractères maximum'),
  email: z.email('Email invalide'),
  password: z
    .string()
    .min(1, 'Mot de passe requis')
    .min(8, '8 caractères minimum'),
});

export const loginSchema = z.object({
  email: z.email('Email invalide'),
  password: z
    .string()
    .min(1, 'Mot de passe requis')
    .min(8, '8 caractères minimum'),
});

export type RegisterValues = z.infer<typeof registerSchema>;
export type LoginValues = z.infer<typeof loginSchema>;

export const SESSION_CODE_RE = /^[A-Z0-9]{6}$/;

export const joinSchema = z.object({
  code: z
    .string()
    .transform((v) => v.trim().toUpperCase())
    .refine((v) => SESSION_CODE_RE.test(v), 'Code must be 6 characters (letters/numbers).'),
  guestName: z
    .string()
    .max(20, '20 characters max')
    .transform((v) => v.trim())
    .refine((v) => v.length > 0, 'Enter a name to join as guest.')
    .optional(),
});

export type JoinValues = z.infer<typeof joinSchema>;
