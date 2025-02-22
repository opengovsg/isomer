import { TRPCError } from "@trpc/server"

import {
  countInputSchema,
  countOutputSchema,
  createInputSchema,
  createOutputSchema,
  deleteInputSchema,
  deleteOutputSchema,
  hasInactiveUsersInputSchema,
  hasInactiveUsersOutputSchema,
  listInputSchema,
  listOutputSchema,
  updateInputSchema,
  updateOutputSchema,
} from "~/schemas/user"
import { protectedProcedure, router } from "../../trpc"
import { db, sql } from "../database"
import { validatePermissionsForManagingUsers } from "../permissions/permissions.service"
import {
  createUser,
  getUsersQuery,
  validateEmailRoleCombination,
} from "./user.service"

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
    .query(
      async ({ ctx, input: { siteId, getIsomerAdmins, offset, limit } }) => {
        await validatePermissionsForManagingUsers({
          siteId,
          userId: ctx.user.id,
          action: "read",
        })

        return getUsersQuery({ siteId, getIsomerAdmins })
          .orderBy("ActiveUser.lastLoginAt", sql.raw(`DESC NULLS LAST`))
          .select((eb) => [
            "ActiveUser.id",
            "ActiveUser.email",
            "ActiveUser.name",
            "ActiveUser.lastLoginAt",
            eb.ref("ActiveResourcePermission.role").as("role"),
          ])
          .limit(limit)
          .offset(offset)
          .execute()
      },
    ),

  count: protectedProcedure
    .input(countInputSchema)
    .output(countOutputSchema)
    .query(async ({ ctx, input: { siteId, getIsomerAdmins } }) => {
      await validatePermissionsForManagingUsers({
        siteId,
        userId: ctx.user.id,
        action: "read",
      })

      const result = await getUsersQuery({ siteId, getIsomerAdmins })
        .select((eb) => [eb.fn.countAll().as("count")])
        .executeTakeFirstOrThrow()

      return Number(result.count)
    }),

  hasInactiveUsers: protectedProcedure
    .input(hasInactiveUsersInputSchema)
    .output(hasInactiveUsersOutputSchema)
    .query(async ({ ctx, input: { siteId } }) => {
      await validatePermissionsForManagingUsers({
        siteId,
        userId: ctx.user.id,
        action: "read",
      })

      const ninetyDaysAgo = new Date()
      ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90)

      const result = await getUsersQuery({ siteId, getIsomerAdmins: false })
        .select((eb) => [eb.fn.countAll().as("count")])
        .where("ActiveUser.lastLoginAt", "is not", null)
        .where("ActiveUser.lastLoginAt", "<", ninetyDaysAgo)
        .executeTakeFirstOrThrow()

      return Number(result.count) > 0
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

      const updatedUserPermission = await db
        .transaction()
        .execute(async (trx) => {
          const oldPermissions = await trx
            .updateTable("ResourcePermission")
            .where("userId", "=", userId)
            .where("siteId", "=", siteId)
            .where("resourceId", "is", null) // because we are updating site-wide permissions
            .set({ deletedAt: new Date() }) // soft delete the old permission
            .returningAll()
            .executeTakeFirst()

          if (!oldPermissions) {
            throw new TRPCError({
              code: "NOT_FOUND",
              message: "User permissions not found",
            })
          }

          return await trx
            .insertInto("ResourcePermission")
            .values({ userId, siteId, role, resourceId: null }) // because we are updating site-wide permissions
            .returning(["id", "userId", "siteId", "role"])
            .executeTakeFirstOrThrow()
        })

      return updatedUserPermission
    }),
})
