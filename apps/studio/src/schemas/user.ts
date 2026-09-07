import { createEmailSchema } from "@opengovsg/validators/email"
import { z } from "zod"
import { IsomerAdminRole, RoleType } from "~prisma/generated/generatedEnums"

import { offsetPaginationSchema } from "./pagination"

const _emailValidator = createEmailSchema()
const emailSchema = z
  .string()
  .superRefine((val, ctx) => {
    const result = _emailValidator.safeParse(val)
    if (!result.success) {
      for (const issue of result.error.issues) {
        ctx.addIssue({ code: "custom", message: issue.message })
      }
    }
  })
  .transform((val) => val.trim().toLowerCase())

export const createSingleUserSchema = z.object({
  email: emailSchema,
  role: z.enum(RoleType).optional().default(RoleType.Editor),
})

export const createUserInputSchema = z.object({
  siteId: z.number().min(1),
  users: z.array(createSingleUserSchema).max(100),
})

export const createUserOutputSchema = z.array(
  z.object({
    email: emailSchema,
    id: z.string(),
    role: z.enum(RoleType),
  }),
)

export const deleteUserInputSchema = z.object({
  siteId: z.number().min(1),
  userId: z.string(),
})

export const deleteUserOutputSchema = z.object({
  email: emailSchema,
  id: z.string(),
})

export const getUserInputSchema = z.object({
  siteId: z.number().min(1),
  userId: z.string(),
})

export const getUserOutputSchema = z.object({
  createdAt: z.date().nullable(),
  email: emailSchema,
  id: z.string(),
  lastLoginAt: z.date().nullable(),
  name: z.string(),
  role: z.enum(RoleType),
})

const ADMIN_TYPE = z.enum(["agency", "isomer"] as const)
export type AdminType = z.infer<typeof ADMIN_TYPE>

export const listUsersInputSchema = offsetPaginationSchema.extend({
  adminType: ADMIN_TYPE.optional().default("agency"),
  siteId: z.number().min(1),
})

export const listUsersOutputSchema = z.array(
  z.object({
    createdAt: z.date().nullable(),
    email: emailSchema,
    id: z.string(),
    lastLoginAt: z.date().nullable(),
    name: z.string().optional().nullable(),
    role: z.enum(RoleType),
  }),
)

export const countUsersInputSchema = z.object({
  adminType: ADMIN_TYPE.optional().default("agency"),
  siteId: z.number().min(1),
})

export const countUsersOutputSchema = z.number()

export const updateUserInputSchema = z.object({
  role: z.enum(RoleType),
  siteId: z.number().min(1),
  userId: z.string(),
})

export const updateUserOutputSchema = z.object({
  id: z.string().min(1),
  role: z.enum(RoleType),
  siteId: z.number().min(1),
  userId: z.string(),
})

export const updateUserDetailsInputSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  phone: z
    .string()
    .trim()
    .min(1, "Phone number is required")
    .transform((phone) => phone.replaceAll(/\s+/gu, ""))
    .transform((phone) => (phone.startsWith("+65") ? phone.slice(3) : phone))
    // Remove country code if present
    .refine(
      (phone) => !Number.isNaN(Number(phone)) && phone.length === 8,
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

export const resendInviteInputSchema = z.object({
  siteId: z.number().min(1),
  userId: z.string(),
})

export const resendInviteOutputSchema = z.object({
  email: z.email(),
})

export const isIsomerAdminInputSchema = z.object({
  roles: z.array(z.enum(IsomerAdminRole)).min(1),
})

export const isIsomerAdminOutputSchema = z.boolean()
