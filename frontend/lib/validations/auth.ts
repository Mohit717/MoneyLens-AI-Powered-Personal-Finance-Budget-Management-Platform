import { z } from "zod";

export const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, "Email is required")
    .email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
  rememberMe: z.boolean().optional(),
});

export const registerSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(2, "Full Name must be at least 2 characters long"),
    email: z
      .string()
      .trim()
      .min(1, "Email is required")
      .email("Invalid email address"),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters long")
      .max(100, "Password is too long"),
    confirmPassword: z.string().min(1, "Confirm password is required"),
    agreeTerms: z.boolean().refine((val) => val === true, {
      message: "You must accept the terms and conditions",
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export const verifyOtpSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, "Email is required")
    .email("Invalid email address"),
  code: z
    .string()
    .trim()
    .length(6, "OTP code must be exactly 6 digits")
    .regex(/^\d{6}$/, "OTP code must contain only digits"),
});

export const resendOtpSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, "Email is required")
    .email("Invalid email address"),
});

export const forgotPasswordSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, "Email is required")
    .email("Invalid email address"),
});

export const resetPasswordSchema = z
  .object({
    email: z
      .string()
      .trim()
      .min(1, "Email is required")
      .email("Invalid email address"),
    code: z
      .string()
      .trim()
      .length(6, "Reset code must be exactly 6 digits")
      .regex(/^\d{6}$/, "Reset code must contain only digits"),
    newPassword: z
      .string()
      .min(8, "Password must be at least 8 characters long")
      .max(100, "Password is too long"),
    confirmPassword: z.string().min(1, "Confirm password is required"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export type LoginSchemaInput = z.infer<typeof loginSchema>;
export type RegisterSchemaInput = z.infer<typeof registerSchema>;
export type VerifyOtpSchemaInput = z.infer<typeof verifyOtpSchema>;
export type ForgotPasswordSchemaInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordSchemaInput = z.infer<typeof resetPasswordSchema>;
