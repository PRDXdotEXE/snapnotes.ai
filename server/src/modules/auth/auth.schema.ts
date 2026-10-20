import { z } from 'zod';

export const registerSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  username: z.string().trim().min(3).max(30),
  password: z.string().min(8).max(128),
});

export const loginSchema = z
  .object({
    email: z
      .string()
      .trim()
      .toLowerCase()
      .email()
      .optional(),
    username: z.string().trim().min(3).max(30).optional(),
    password: z.string().min(1).max(128),
  })
  .refine((data) => Boolean(data.email ?? data.username), {
    message: 'Provide email or username',
    path: ['email'],
  });

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
