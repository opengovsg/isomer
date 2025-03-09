import { TRPCError } from "@trpc/server"
import { PAST_AND_FORMER_ISOMER_MEMBERS_EMAILS } from "~prisma/constants"

import { sendInvitation } from "~/features/mail/service"
import {
  countUsersInputSchema,
  countUsersOutputSchema,
  createUserInputSchema,
  createUserOutputSchema,
  deleteUserInputSchema,
  deleteUserOutputSchema,
  getUserInputSchema,
  getUserOutputSchema,
  hasInactiveUsersInputSchema,
  hasInactiveUsersOutputSchema,
  listUsersInputSchema,
  listUsersOutputSchema,
  updateUserInputSchema,
  updateUserOutputSchema,
} from "~/schemas/user"
import { protectedProcedure, router } from "../../trpc"
import { db, sql } from "../database"
import { validatePermissionsForManagingUsers } from "../permissions/permissions.service"
import { getSiteNameAndCodeBuildId } from "../site/site.service"
import {
  createUser,
  getUsersQuery,
  validateEmailRoleCombination,
} from "./user.service"

export const userRouter = router({
  create: protectedProcedure
    .input(createUserInputSchema)
    .output(createUserOutputSchema)
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

      // Send welcome email to users
      const { name: siteName } = await getSiteNameAndCodeBuildId(siteId)
      await Promise.all(
        createdUsers.map((createdUser) =>
          sendInvitation({
            recipientEmail: createdUser.email,
            siteName,
            role: createdUser.role,
          }),
        ),
      )

      return createdUsers
    }),

  delete: protectedProcedure
    .input(deleteUserInputSchema)
    .output(deleteUserOutputSchema)
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

      const userToDeletePermissionsFrom = await db
        .selectFrom("User")
        .where("id", "=", userId)
        .where("deletedAt", "is", null)
        .selectAll()
        .executeTakeFirst()

      if (!userToDeletePermissionsFrom) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "User not found",
        })
      }

      const isRequestingUserIsomerAdmin =
        PAST_AND_FORMER_ISOMER_MEMBERS_EMAILS.includes(ctx.user.email)
      const isUserToDeleteIsomerAdmin =
        PAST_AND_FORMER_ISOMER_MEMBERS_EMAILS.includes(
          userToDeletePermissionsFrom.email,
        )
      if (!isRequestingUserIsomerAdmin && isUserToDeleteIsomerAdmin) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You do not have permission to delete this user",
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

      return {
        id: userToDeletePermissionsFrom.id,
        email: userToDeletePermissionsFrom.email,
      }
    }),

  getUser: protectedProcedure
    .input(getUserInputSchema)
    .output(getUserOutputSchema)
    .query(async ({ ctx, input: { siteId, userId } }) => {
      await validatePermissionsForManagingUsers({
        siteId,
        userId: ctx.user.id,
        action: "read",
      })

      const result = await getUsersQuery({ siteId, adminType: "agency" })
        .where("ActiveUser.id", "=", userId)
        .select((eb) => [
          "ActiveUser.id",
          "ActiveUser.email",
          "ActiveUser.name",
          "ActiveUser.lastLoginAt",
          eb.ref("ActiveResourcePermission.role").as("role"),
        ])
        .executeTakeFirst()

      if (!result) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "User not found",
        })
      }

      return result
    }),

  list: protectedProcedure
    .input(listUsersInputSchema)
    .output(listUsersOutputSchema)
    .query(async ({ ctx, input: { siteId, adminType, offset, limit } }) => {
      await validatePermissionsForManagingUsers({
        siteId,
        userId: ctx.user.id,
        action: "read",
      })

      return getUsersQuery({ siteId, adminType })
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
    }),

  count: protectedProcedure
    .input(countUsersInputSchema)
    .output(countUsersOutputSchema)
    .query(async ({ ctx, input: { siteId, adminType } }) => {
      await validatePermissionsForManagingUsers({
        siteId,
        userId: ctx.user.id,
        action: "read",
      })

      const result = await getUsersQuery({ siteId, adminType })
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

      const result = await getUsersQuery({ siteId, adminType: "agency" })
        .select((eb) => [eb.fn.countAll().as("count")])
        .where("ActiveUser.lastLoginAt", "is not", null)
        .where("ActiveUser.lastLoginAt", "<", ninetyDaysAgo)
        .executeTakeFirstOrThrow()

      return Number(result.count) > 0
    }),

  update: protectedProcedure
    .input(updateUserInputSchema)
    .output(updateUserOutputSchema)
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

      validateEmailRoleCombination({ email: user.email, role })

      const updatedUserPermission = await db
        .transaction()
        .execute(async (trx) => {
          const oldPermission = await trx
            .updateTable("ResourcePermission")
            .where("userId", "=", userId)
            .where("siteId", "=", siteId)
            .where("resourceId", "is", null) // because we are updating site-wide permissions
            .where("deletedAt", "is", null) // ensure deleted persmission deletedAt is not overwritten
            .set({ deletedAt: new Date() }) // soft delete the old permission
            .returningAll()
            .executeTakeFirst()

          if (!oldPermission) {
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
