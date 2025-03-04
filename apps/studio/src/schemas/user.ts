import { RoleType } from "~prisma/generated/generatedEnums"
import { z } from "zod"

import { offsetPaginationSchema } from "./pagination"

export const createUserInputSchema = z.object({
  siteId: z.number().min(1),
  users: z.array(
    z.object({
      email: z.string().email(),
      role: z.nativeEnum(RoleType).optional().default(RoleType.Editor),
    }),
  ),
})

export const createUserOutputSchema = z.array(
  z.object({
    id: z.string(),
    email: z.string().email(),
    role: z.nativeEnum(RoleType),
  }),
)

export const deleteUserInputSchema = z.object({
  siteId: z.number().min(1),
  userId: z.string(),
})

export const deleteUserOutputSchema = z.object({
  id: z.string(),
  email: z.string().email(),
})

export const getUserInputSchema = z.object({
  siteId: z.number().min(1),
  userId: z.string(),
})

export const getUserOutputSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string().email(),
  role: z.nativeEnum(RoleType),
  lastLoginAt: z.date().nullable(),
})

export const listUsersInputSchema = z.object({
  siteId: z.number().min(1),
  getIsomerAdmins: z.boolean().optional().default(false),
  ...offsetPaginationSchema.shape,
})

export const listUsersOutputSchema = z.array(
  z.object({
    id: z.string(),
    email: z.string().email(),
    name: z.string().optional().nullable(),
    lastLoginAt: z.date().nullable(),
    role: z.nativeEnum(RoleType),
  }),
)

export const countUsersInputSchema = z.object({
  siteId: z.number().min(1),
  getIsomerAdmins: z.boolean().optional().default(false),
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
