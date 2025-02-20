import { RoleType } from "~prisma/generated/generatedEnums"
import { z } from "zod"

import { offsetPaginationSchema } from "./pagination"

export const createInputSchema = z.object({
  siteId: z.number().min(1),
  users: z.array(
    z.object({
      email: z.string().email(),
      role: z.nativeEnum(RoleType).optional().default(RoleType.Editor),
    }),
  ),
})

export const createOutputSchema = z.array(
  z.object({
    id: z.string(),
    email: z.string().email(),
    role: z.nativeEnum(RoleType),
  }),
)

export const deleteInputSchema = z.object({
  siteId: z.number().min(1),
  userId: z.string(),
})

export const deleteOutputSchema = z.boolean()

export const listInputSchema = z.object({
  siteId: z.number().min(1),
  ...offsetPaginationSchema.shape,
})

export const listOutputSchema = z.array(
  z.object({
    id: z.string(),
    email: z.string().email(),
    name: z.string().optional().nullable(),
    lastLoginAt: z.date().nullable(),
    role: z.nativeEnum(RoleType),
  }),
)

export const updateInputSchema = z.object({
  siteId: z.number().min(1),
  userId: z.string(),
  role: z.nativeEnum(RoleType),
})

export const updateOutputSchema = z.boolean()

export const updateDetailsInputSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  phone: z
    .string()
    .trim()
    .min(1, "Phone number is required")
    .refine((phone) => {
      const cleanPhone = phone.replace(/\s+/g, "")
      return !isNaN(Number(cleanPhone)) && cleanPhone.length === 8
    }, "Phone number must be exactly 8 digits")
    .refine((phone) => {
      const cleanPhone = phone.replace(/\s+/g, "")
      return (
        cleanPhone.startsWith("6") ||
        cleanPhone.startsWith("8") ||
        cleanPhone.startsWith("9")
      )
    }, "Phone number must start with 6, 8, or 9")
    .transform((phone) => phone.replace(/\s+/g, "")), // Clean up any remaining whitespace
})

export const updateDetailsOutputSchema = z.object({
  name: z.string().nullable(),
  phone: z.string().nullable(),
})
