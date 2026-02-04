import { z } from "zod";

/**
 * Auth schemas
 *
 * Login & Register akan menggunakan email dan password,
 * disesuaikan dengan field yang disimpan di tabel `users` di backend:
 *
 * Tabel `users` (contoh):
 * - id (string / uuid)  → primary key
 * - name (string)
 * - email (string, unique)
 * - password_hash (string)
 * - created_at (datetime)
 */

export const loginSchema = z.object({
  email: z.string().email("Email tidak valid"),
  password: z.string().min(8, "Password minimal 8 karakter"),
});

export const registerSchema = z.object({
  name: z
    .string()
    .min(2, "Nama minimal 2 karakter")
    .max(50, "Nama maksimal 50 karakter"),
  email: z.string().email("Email tidak valid"),
  password: z.string().min(8, "Password minimal 8 karakter"),
});

export type LoginSchema = z.infer<typeof loginSchema>;
export type RegisterSchema = z.infer<typeof registerSchema>;
