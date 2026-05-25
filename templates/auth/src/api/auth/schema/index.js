import { z } from "zod";

export const registerSchema = z.object({
  email: z.string().email("Valid email is required"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  name: z.string().min(1, "Name is required"),
});

export const loginSchema = z.object({
  email: z.string().email("Valid email is required"),
  password: z.string().min(1, "Password is required"),
});

export const updateProfileSchema = z.object({
  name: z.string().min(1, "Name is required").optional(),
  email: z.string().email("Valid email is required").optional(),
}).refine((d) => d.name || d.email, { message: "Provide at least name or email" });

export const changePasswordSchema = z.object({
  current_password: z.string().optional().default(""),
  new_password: z.string().min(6, "New password must be at least 6 characters"),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email("Valid email is required"),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1, "Reset token is required"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const validateResetTokenSchema = z.object({
  token: z.string().min(1, "Reset token is required"),
});

export const deleteAccountSchema = z.object({
  password: z.string().optional().default(""),
});
