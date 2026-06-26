import { z } from 'zod';

// Validation for the /account screens. Mirrors lib/validation/authSchemas.ts.

// Profile: first/last name + phone are editable (email is immutable).
// First/last map to the single auth `userName` (joined on save).
export const profileSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().optional(),
  phoneNumber: z.string().optional(),
});
export type ProfileValues = z.infer<typeof profileSchema>;

// Shipping address — field set per the Stitch "Account | Addresses" screen.
export const addressSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  street: z.string().min(1, 'Street address is required'),
  city: z.string().min(1, 'City is required'),
  postalCode: z.string().min(1, 'Postal code is required'),
  country: z.string().min(1, 'Country is required'),
  isDefault: z.boolean().optional(),
});
export type AddressValues = z.infer<typeof addressSchema>;
