import { z } from 'zod';

export const registerSchema = z.object({
    email: z.string().trim().email('Invalid email address').max(254),
    password: z
        .string()
        .min(8, 'Password must be at least 8 characters long')
        .max(100, 'Password is too long'),
    name: z.string().min(2, 'Name must be at least 2 characters').optional(),
});

export const loginSchema = z.object({
    email: z.string().trim().email('Invalid email address').max(254),
    password: z.string().min(1, 'Password is required'),
});

export const sendOtpSchema = z.object({
    email: z.string().trim().email('Invalid email address').max(254),
});

export const verifyEmailSchema = z.object({
    email: z.string().trim().email('Invalid email address').max(254),
    code: z.string().length(6, 'OTP must be 6 digits'),
});

export const resetPasswordSchema = z.object({
    email: z.string().trim().email('Invalid email address').max(254),
    code: z.string().length(6, 'OTP must be 6 digits'),
    newPassword: z
        .string()
        .min(8, 'Password must be at least 8 characters long')
        .max(100, 'Password is too long'),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;