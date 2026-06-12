import { z } from "zod";

export const registerSchema = z.object({
  username: z
    .string()
    .min(1, "Nom d'utilisateur requis")
    .max(20, "20 caractères maximum"),
  email: z.email("Email invalide"),
  password: z
    .string()
    .min(1, "Mot de passe requis")
    .min(8, "8 caractères minimum"),
});

export const loginSchema = z.object({
  email: z.email("Email invalide"),
  password: z
    .string()
    .min(1, "Mot de passe requis")
    .min(8, "8 caractères minimum"),
});

export type RegisterValues = z.infer<typeof registerSchema>;
export type LoginValues = z.infer<typeof loginSchema>;
