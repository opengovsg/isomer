import { TRPCError } from "@trpc/server"
import { PAST_AND_FORMER_ISOMER_MEMBERS_EMAILS } from "~prisma/constants"
import { pick } from "lodash"

import { sendInvitation } from "~/features/mail/service"
import { canResendInviteToUser } from "~/features/users/utils"
import { IS_SINGPASS_ENABLED_FEATURE_KEY } from "~/lib/growthbook"
import {
  countUsersInputSchema,
  countUsersOutputSchema,
  createUserInputSchema,
  createUserOutputSchema,
  deleteUserInputSchema,
  deleteUserOutputSchema,
  getPermissionsInputSchema,
  getUserInputSchema,
  getUserOutputSchema,
  listUsersInputSchema,
  listUsersOutputSchema,
  resendInviteInputSchema,
  resendInviteOutputSchema,
  updateUserDetailsInputSchema,
  updateUserDetailsOutputSchema,
  updateUserInputSchema,
  updateUserOutputSchema,
} from "~/schemas/user"
import { protectedProcedure, router } from "../../trpc"
import { db, RoleType, sql } from "../database"
import {
  getSitePermissions,
  updateUserSitewidePermission,
  validatePermissionsForManagingUsers,
} from "../permissions/permissions.service"
import { getSiteNameAndCodeBuildId } from "../site/site.service"
import {
  createUserWithPermission,
  deleteUserPermission,
  getUsersQuery,
  updateUserDetails,
  validateEmailRoleCombination,
} from "./user.service"

export const userRouter = router({
  getPermissions: protectedProcedure
    .input(getPermissionsInputSchema)
    .query(async ({ ctx, input: { siteId } }) => {
      return await getSitePermissions({ userId: ctx.user.id, siteId })
    }),

  create: protectedProcedure
    .input(createUserInputSchema)
    .output(createUserOutputSchema)
    .mutation(async ({ ctx, input: { siteId, users } }) => {
      await validatePermissionsForManagingUsers({
        siteId,
        userId: ctx.user.id,
        action: "manage",
      })

      const possibleActor = await db
        .selectFrom("User")
        .where("id", "=", ctx.user.id)
        .selectAll()
        .executeTakeFirstOrThrow(
          () =>
            new TRPCError({
              code: "NOT_FOUND",
              message: "User not found",
            }),
        )
      const actorName = possibleActor.name || possibleActor.email
      const isSingpassEnabled = ctx.gb.isOn(IS_SINGPASS_ENABLED_FEATURE_KEY)

      const createdUsers = await db.transaction().execute(async (tx) => {
        return await Promise.all(
          users.map(async (user) => {
            const { user: createdUser, resourcePermission } =
              await createUserWithPermission({
                ...user,
                email: user.email.toLowerCase(),
                siteId,
                byUserId: ctx.user.id,
                tx,
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
            isSingpassEnabled,
            inviterName: actorName,
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
        action: "manage",
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

      if (!ctx.session?.userId)
        throw new TRPCError({
          code: "PRECONDITION_FAILED",
          message: "Please ensure you are logged in!",
        })

      await deleteUserPermission({
        byUserId: ctx.session.userId,
        userId,
        siteId,
      })

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
          "ActiveUser.createdAt",
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
          "ActiveUser.createdAt",
          eb.ref("ActiveResourcePermission.role").as("role"),
        ])
        .limit(limit)
        .offset(offset)
        .execute()
    }),

  count: protectedProcedure
    .input(countUsersInputSchema)
    .output(countUsersOutputSchema)
    .query(async ({ ctx, input: { siteId, adminType, activityType } }) => {
      await validatePermissionsForManagingUsers({
        siteId,
        userId: ctx.user.id,
        action: "read",
      })

      let query = getUsersQuery({ siteId, adminType })

      if (activityType === "inactive") {
        const ninetyDaysAgo = new Date()
        ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90)
        query = query
          .where("ActiveUser.lastLoginAt", "is not", null)
          .where("ActiveUser.lastLoginAt", "<", ninetyDaysAgo)
      }

      const result = await query
        .select((eb) => [eb.fn.countAll().as("count")])
        .executeTakeFirstOrThrow()

      return Number(result.count)
    }),

  update: protectedProcedure
    .input(updateUserInputSchema)
    .output(updateUserOutputSchema)
    .mutation(async ({ ctx, input: { siteId, userId, role } }) => {
      await validatePermissionsForManagingUsers({
        siteId,
        userId: ctx.user.id,
        action: "manage",
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

      const updatedUserPermission = await updateUserSitewidePermission({
        byUserId: ctx.user.id,
        userId,
        siteId,
        role,
      })

      return pick(updatedUserPermission, ["id", "userId", "siteId", "role"])
    }),

  updateDetails: protectedProcedure
    .input(updateUserDetailsInputSchema)
    .output(updateUserDetailsOutputSchema)
    .mutation(async ({ ctx, input: { name, phone } }) => {
      // We don't have to check if the user is admin here
      // because we only allow users to update their own details
      // They should be able to update their own details even without any resource permissions

      if (!ctx.session?.userId)
        throw new TRPCError({
          code: "PRECONDITION_FAILED",
          message: "Please ensure you are logged in!",
        })

      const updatedUser = await updateUserDetails({
        userId: ctx.session.userId,
        name,
        phone,
      })

      return pick(updatedUser, ["name", "phone"])
    }),

  resendInvite: protectedProcedure
    .input(resendInviteInputSchema)
    .output(resendInviteOutputSchema)
    .mutation(async ({ ctx, input: { siteId, userId } }) => {
      await validatePermissionsForManagingUsers({
        siteId,
        userId: ctx.user.id,
        action: "manage",
      })

      const possibleActor = await db
        .selectFrom("User")
        .where("id", "=", ctx.user.id)
        .selectAll()
        .executeTakeFirstOrThrow(
          () =>
            new TRPCError({
              code: "NOT_FOUND",
              message: "User not found",
            }),
        )
      const actorName = possibleActor.name || possibleActor.email
      const isSingpassEnabled = ctx.gb.isOn(IS_SINGPASS_ENABLED_FEATURE_KEY)

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

      if (
        !canResendInviteToUser({
          createdAt: user.createdAt,
          lastLoginAt: user.lastLoginAt,
        })
      ) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "User has already logged in",
        })
      }

      // Defensive programming to check if the user has permissions to receive invite
      const userPermission = await getSitePermissions({
        userId: user.id,
        siteId,
      })
      if (userPermission.length === 0) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "User has no permissions",
        })
      }

      // Send invite
      const { name: siteName } = await getSiteNameAndCodeBuildId(siteId)
      await sendInvitation({
        isSingpassEnabled,
        inviterName: actorName,
        recipientEmail: user.email,
        siteName,
        role: userPermission[0]?.role ?? RoleType.Editor,
      })

      return pick(user, ["email"])
    }),
})
