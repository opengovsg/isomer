import { TRPCError } from "@trpc/server"

import {
  createInputSchema,
  createOutputSchema,
  deleteInputSchema,
  deleteOutputSchema,
  listInputSchema,
  listOutputSchema,
  updateDetailsInputSchema,
  updateDetailsOutputSchema,
  updateInputSchema,
  updateOutputSchema,
} from "~/schemas/user"
import { protectedProcedure, router } from "../../trpc"
import { db, sql } from "../database"
import { validatePermissionsForManagingUsers } from "../permissions/permissions.service"
import { createUser, validateEmailRoleCombination } from "./user.service"

export const userRouter = router({
  create: protectedProcedure
    .input(createInputSchema)
    .output(createOutputSchema)
    .mutation(async ({ ctx, input: { siteId, users } }) => {
      await validatePermissionsForManagingUsers({
        siteId,
        userId: ctx.user.id,
        action: "create",
      })

      const createdUsers = await db.transaction().execute(async (trx) => {
        return await Promise.all(
          users.map(async (user) => {
            const { user: createdUser, resourcePermission } = await createUser({
              ...user,
              email: user.email.toLowerCase(),
              siteId,
              trx,
            })
            return {
              id: createdUser.id,
              email: createdUser.email,
              role: resourcePermission.role,
            }
          }),
        )
      })

      // TODO: Send welcome email to users
      // Email service is not ready yet

      return createdUsers
    }),

  delete: protectedProcedure
    .input(deleteInputSchema)
    .output(deleteOutputSchema)
    .mutation(async ({ ctx, input: { siteId, userId } }) => {
      await validatePermissionsForManagingUsers({
        siteId,
        userId: ctx.user.id,
        action: "delete",
      })

      if (userId === ctx.user.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You cannot delete your own account",
        })
      }

      const deletedUserPermissions = await db
        .updateTable("ResourcePermission")
        .where("userId", "=", userId)
        .where("siteId", "=", siteId)
        .where("deletedAt", "is", null)
        .set({ deletedAt: new Date() })
        .returningAll()
        .executeTakeFirst()

      if (!deletedUserPermissions) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "User permissions not found",
        })
      }

      return true
    }),

  list: protectedProcedure
    .input(listInputSchema)
    .output(listOutputSchema)
    .query(async ({ ctx, input: { siteId, offset, limit } }) => {
      await validatePermissionsForManagingUsers({
        siteId,
        userId: ctx.user.id,
        action: "read",
      })

      return db
        .selectFrom("User")
        .innerJoin("ResourcePermission", "User.id", "ResourcePermission.userId")
        .where("ResourcePermission.siteId", "=", siteId)
        .orderBy("User.lastLoginAt", sql.raw(`DESC NULLS LAST`))
        .select([
          "User.id",
          "User.email",
          "User.name",
          "User.lastLoginAt",
          "ResourcePermission.role",
        ])
        .limit(limit)
        .offset(offset)
        .execute()
    }),

  update: protectedProcedure
    .input(updateInputSchema)
    .output(updateOutputSchema)
    .mutation(async ({ ctx, input: { siteId, userId, role } }) => {
      await validatePermissionsForManagingUsers({
        siteId,
        userId: ctx.user.id,
        action: "update",
      })

      if (userId === ctx.user.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You cannot update your own role",
        })
      }

      const user = await db
        .selectFrom("User")
        .where("id", "=", userId)
        .selectAll()
        .executeTakeFirst()

      if (!user) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "User not found",
        })
      }

      // Temporary test to ensure that we don't allow creating a user that was deleted before
      // We prevent this as there's no complete audit trail of what happened to the user
      // TODO: Remove this after audit logging is implemented
      if (user.deletedAt) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "User was deleted before. Contact support to restore.",
        })
      }

      validateEmailRoleCombination({ email: user.email, role })

      const updatedUserPermissions = await db
        .updateTable("ResourcePermission")
        .where("userId", "=", userId)
        .where("siteId", "=", siteId)
        .where("resourceId", "is", null) // because we are updating site-wide permissions
        .set({ role })
        .returningAll()
        .executeTakeFirst()

      if (!updatedUserPermissions) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "User permissions not found",
        })
      }

      return true
    }),

  updateDetails: protectedProcedure
    .input(updateDetailsInputSchema)
    .output(updateDetailsOutputSchema)
    .mutation(async ({ ctx, input: { name, phone } }) => {
      // We don't have to check if the user is admin here
      // because we only allow users to update their own details
      // They should be able to update their own details even without any resource permissions

      await db
        .updateTable("User")
        .where("id", "=", ctx.user.id)
        .set({ name, phone })
        .returningAll()
        .executeTakeFirst()

      return true
    }),
})
