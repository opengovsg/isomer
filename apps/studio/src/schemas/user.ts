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
  getIsomerAdmins: z.boolean().optional().default(false),
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

export const countInputSchema = z.object({
  siteId: z.number().min(1),
  getIsomerAdmins: z.boolean().optional().default(false),
})

export const countOutputSchema = z.number()

export const hasInactiveUsersInputSchema = z.object({
  siteId: z.number().min(1),
})

export const hasInactiveUsersOutputSchema = z.boolean()

export const updateInputSchema = z.object({
  siteId: z.number().min(1),
  userId: z.string(),
  role: z.nativeEnum(RoleType),
})

export const updateOutputSchema = z.object({
  id: z.string().min(1),
  siteId: z.number().min(1),
  userId: z.string(),
  role: z.nativeEnum(RoleType),
})
