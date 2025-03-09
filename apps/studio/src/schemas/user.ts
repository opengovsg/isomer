import { createEmailSchema } from "@opengovsg/starter-kitty-validators/email"
import { RoleType } from "~prisma/generated/generatedEnums"
import { z } from "zod"

import { offsetPaginationSchema } from "./pagination"

const emailSchema = createEmailSchema()

export const getPermissionsInputSchema = z.object({
  siteId: z.number().min(1),
})

export const createUserInputSchema = z.object({
  siteId: z.number().min(1),
  users: z
    .array(
      z.object({
        email: emailSchema,
        role: z.nativeEnum(RoleType).optional().default(RoleType.Editor),
      }),
    )
    .max(100),
})

export const createUserOutputSchema = z.array(
  z.object({
    id: z.string(),
    email: emailSchema,
    role: z.nativeEnum(RoleType),
  }),
)

export const deleteUserInputSchema = z.object({
  siteId: z.number().min(1),
  userId: z.string(),
})

export const deleteUserOutputSchema = z.object({
  id: z.string(),
  email: emailSchema,
})

export const getUserInputSchema = z.object({
  siteId: z.number().min(1),
  userId: z.string(),
})

export const getUserOutputSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: emailSchema,
  role: z.nativeEnum(RoleType),
  lastLoginAt: z.date().nullable(),
})

const ADMIN_TYPE = z.enum(["agency", "isomer"] as const)
export type AdminType = z.infer<typeof ADMIN_TYPE>

export const listUsersInputSchema = z.object({
  siteId: z.number().min(1),
  adminType: ADMIN_TYPE.optional().default("agency"),
  ...offsetPaginationSchema.shape,
})

export const listUsersOutputSchema = z.array(
  z.object({
    id: z.string(),
    email: emailSchema,
    name: z.string().optional().nullable(),
    lastLoginAt: z.date().nullable(),
    role: z.nativeEnum(RoleType),
  }),
)

export const countUsersInputSchema = z.object({
  siteId: z.number().min(1),
  adminType: ADMIN_TYPE.optional().default("agency"),
})

export const countUsersOutputSchema = z.number()

export const hasInactiveUsersInputSchema = z.object({
  siteId: z.number().min(1),
})

export const hasInactiveUsersOutputSchema = z.boolean()

export const updateUserInputSchema = z.object({
  siteId: z.number().min(1),
  userId: z.string(),
  role: z.nativeEnum(RoleType),
})

export const updateUserOutputSchema = z.object({
  id: z.string().min(1),
  siteId: z.number().min(1),
  userId: z.string(),
  role: z.nativeEnum(RoleType),
})

export const updateUserDetailsInputSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  phone: z
    .string()
    .trim()
    .min(1, "Phone number is required")
    .transform((phone) => phone.replace(/\s+/g, ""))
    .refine(
      (phone) => !isNaN(Number(phone)) && phone.length === 8,
      "Phone number must be exactly 8 digits",
    )
    .refine(
      (phone) =>
        phone.startsWith("6") || phone.startsWith("8") || phone.startsWith("9"),
      "Phone number must start with 6, 8, or 9",
    ),
})

export const updateUserDetailsOutputSchema = z.object({
  name: z.string().nullable(),
  phone: z.string().nullable(),
})
