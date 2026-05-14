import { z } from "zod";

export const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .max(128, "Password must be at most 128 characters")
  .refine((v) => /[a-z]/.test(v), "Password must contain a lowercase letter")
  .refine((v) => /[A-Z]/.test(v), "Password must contain an uppercase letter")
  .refine((v) => /[0-9]/.test(v), "Password must contain a digit")
  .refine(
    (v) => /[^A-Za-z0-9]/.test(v),
    "Password must contain a symbol"
  );

export const phoneSchema = z
  .string()
  .regex(
    /^\+[1-9]\d{7,14}$/,
    "Phone must be in E.164 format, e.g. +77001234567"
  );

export const registerSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: passwordSchema,
  fullName: z.string().min(2, "Full name is too short"),
  phone: phoneSchema,
  role: z.enum(["seeker", "host"]).optional()
});

export const verifyOtpSchema = z.object({
  code: z.string().regex(/^\d{4,8}$/, "Code must be 4-8 digits")
});

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required")
});

export const refreshSchema = z.object({
  refreshToken: z.string().min(10, "refreshToken is required")
});

export const listingSchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  city: z.string().min(1, "City is required"),
  district: z.string().optional(),
  address: z.string().optional(),
  monthlyRent: z.number().positive("Rent must be positive"),
  deposit: z.number().nonnegative().optional(),
  totalRooms: z.number().int().min(1),
  availableRooms: z.number().int().min(1),
  currentOccupants: z.number().int().nonnegative().default(0),
  maxOccupants: z.number().int().min(1),
  petsAllowed: z.boolean().default(false),
  smokingAllowed: z.enum(["yes", "no", "outside"]).optional(),
  genderPreference: z.enum(["any", "male", "female"]).default("any"),
  minAge: z.number().int().nonnegative().optional(),
  maxAge: z.number().int().nonnegative().optional(),
  furnished: z.boolean().default(false),
  internetIncluded: z.boolean().default(false),
  availableFrom: z.string().optional().transform(val => val ? new Date(val) : undefined),
  minStayMonths: z.number().int().nonnegative().optional(),
  photos: z.array(z.string()).default([]),
  status: z.enum(["draft", "active", "rented", "archived"]).default("draft"),
  bills: z.array(z.object({
    category: z.string(),
    label: z.string(),
    amountKzt: z.number(),
    isIncludedInRent: z.boolean().default(false),
    notes: z.string().optional()
  })).optional(),
  houseRules: z.array(z.object({
    ruleText: z.string(),
    orderIndex: z.number().int().optional()
  })).optional()
});
