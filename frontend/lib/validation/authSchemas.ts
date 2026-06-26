import { z } from 'zod';

// Single source of truth for auth form validation. Messages are kept verbatim
// from the original react-hook-form rules so behaviour (and tests) are unchanged.

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const emailField = z
  .string()
  .min(1, 'Email is required')
  .regex(EMAIL_REGEX, 'Invalid email format');

// ── Login ──────────────────────────────────────────────────────────────────
export const loginSchema = z.object({
  email: emailField,
  password: z.string().min(1, 'Password is required'),
});
export type LoginValues = z.infer<typeof loginSchema>;

// ── Signup ─────────────────────────────────────────────────────────────────
export const signupSchema = z
  .object({
    userName: z.string().min(1, 'Full name is required'),
    email: emailField,
    password: z
      .string()
      .min(1, 'Password is required')
      .min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
    phoneNumber: z.string().optional(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });
export type SignupValues = z.infer<typeof signupSchema>;

// ── Verify email (post-signup OTP) ───────────────────────────────────────────
export const verifyEmailSchema = z.object({
  code: z
    .string()
    .min(1, 'Please enter the verification code')
    .regex(/^\d{6}$/, 'Code must be 6 digits'),
});
export type VerifyEmailValues = z.infer<typeof verifyEmailSchema>;

// ── Forgot password: request code ────────────────────────────────────────────
export const forgotEmailSchema = z.object({
  email: emailField,
});
export type ForgotEmailValues = z.infer<typeof forgotEmailSchema>;

// ── Forgot password: verify OTP ──────────────────────────────────────────────
export const forgotOtpSchema = z.object({
  otp: z.string().min(1, 'Please enter the verification code'),
});
export type ForgotOtpValues = z.infer<typeof forgotOtpSchema>;

// ── Forgot password: reset ───────────────────────────────────────────────────
export const resetPasswordSchema = z
  .object({
    newPassword: z
      .string()
      .min(1, 'Password is required')
      .min(6, 'Password must be at least 6 characters')
      .regex(/[A-Z]/, 'Password must contain at least 1 uppercase letter'),
    confirmNewPassword: z.string().min(1, 'Please confirm your password'),
  })
  .refine((data) => data.newPassword === data.confirmNewPassword, {
    message: 'Passwords do not match',
    path: ['confirmNewPassword'],
  });
export type ResetPasswordValues = z.infer<typeof resetPasswordSchema>;
