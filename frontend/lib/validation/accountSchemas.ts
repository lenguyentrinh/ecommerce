import { z } from 'zod';

// Validation for the /account screen. Mirrors lib/validation/authSchemas.ts.

// Profile: only userName + phoneNumber are editable (email is immutable).
export const profileSchema = z.object({
  userName: z.string().min(1, 'Name is required'),
  phoneNumber: z.string().optional(),
});
export type ProfileValues = z.infer<typeof profileSchema>;

// Shipping address: field set aligned to Epic 4 checkout (Story 4.2).
export const addressSchema = z.object({
  fullName: z.string().min(1, 'Full name is required'),
  line1: z.string().min(1, 'Address line is required'),
  city: z.string().min(1, 'City is required'),
  state: z.string().min(1, 'State is required'),
  postalCode: z.string().min(1, 'Postal code is required'),
  country: z.string().min(1, 'Country is required'),
});
export type AddressValues = z.infer<typeof addressSchema>;
