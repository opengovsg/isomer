import { TRPCError } from "@trpc/server"
import { pick } from "lodash-es"
import { SINGPASS_DISABLED_ERROR_MESSAGE } from "~/constants/customErrorMessage"
import { sendInvitation } from "~/features/mail/service"
import { canResendInviteToUser } from "~/features/users/utils"
import { getIsSingpassEnabled } from "~/lib/growthbook"
import {
  countUsersInputSchema,
  countUsersOutputSchema,
  createUserInputSchema,
  createUserOutputSchema,
  deleteUserInputSchema,
  deleteUserOutputSchema,
  getUserInputSchema,
  getUserOutputSchema,
  isIsomerAdminInputSchema,
  isIsomerAdminOutputSchema,
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
import { db } from "../database/database"
import { RoleType } from "../database/types"
import {
  getResourcePermission,
  isActiveIsomerAdmin,
  updateUserSitewidePermission,
  validatePermissionsForManagingUsers,
} from "../permissions/permissions.service"
import { getSiteNameAndCodeBuildId } from "../site/site.service"
import {
  createUserWithPermission,
  deleteUserPermission,
  getUsersQuery,
  updateUserDetails,
} from "./user.service"

const throwSingpassDisabledError = () => {
  throw new TRPCError({
    code: "FORBIDDEN",
    message: SINGPASS_DISABLED_ERROR_MESSAGE,
  })
}

export const userRouter = router({
  count: protectedProcedure
    .input(countUsersInputSchema)
    .output(countUsersOutputSchema)
    .query(async ({ ctx, input: { siteId, adminType } }) => {
      await validatePermissionsForManagingUsers({
        action: "read",
        siteId,
        userId: ctx.user.id,
      })

      const result = await getUsersQuery({ adminType, siteId })
        .select((eb) => [eb.fn.countAll().as("count")])
        .executeTakeFirstOrThrow()

      return Number(result.count)
    }),

  create: protectedProcedure
    .input(createUserInputSchema)
    .output(createUserOutputSchema)
    // Arbitrary limit to prevent invite email abuse; tune if legitimate usage is blocked
    .meta({ rateLimitOptions: { max: 10, windowMs: 60 * 1000 } })
    .mutation(async ({ ctx, input: { siteId, users } }) => {
      await validatePermissionsForManagingUsers({
        action: "manage",
        siteId,
        userId: ctx.user.id,
      })

      const isSingpassEnabled = getIsSingpassEnabled({
        gb: ctx.gb,
      })
      if (!isSingpassEnabled) {
        throwSingpassDisabledError()
      }

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

      const createdUsers = await db.transaction().execute(
        async (tx) =>
          await Promise.all(
            users.map(async (user) => {
              const { user: createdUser, resourcePermission } =
                await createUserWithPermission({
                  ...user,
                  byUserId: ctx.user.id,
                  email: user.email.toLowerCase(),
                  siteId,
                  tx,
                })
              return {
                email: createdUser.email,
                id: createdUser.id,
                role: resourcePermission.role,
              }
            }),
          ),
      )

      // Send welcome email to users
      const { name: siteName } = await getSiteNameAndCodeBuildId(siteId)
      await Promise.all(
        createdUsers.map(async (createdUser) => {
          await sendInvitation({
            inviterName: actorName,
            isSingpassEnabled,
            recipientEmail: createdUser.email,
            role: createdUser.role,
            siteName,
          })
        }),
      )

      return createdUsers
    }),

  delete: protectedProcedure
    .input(deleteUserInputSchema)
    .output(deleteUserOutputSchema)
    .mutation(async ({ ctx, input: { siteId, userId } }) => {
      await validatePermissionsForManagingUsers({
        action: "manage",
        siteId,
        userId: ctx.user.id,
      })

      const isSingpassEnabled = getIsSingpassEnabled({
        gb: ctx.gb,
      })
      if (!isSingpassEnabled) {
        throwSingpassDisabledError()
      }

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

      const isRequestingUserIsomerAdmin = await isActiveIsomerAdmin(ctx.user.id)
      const isUserToDeleteIsomerAdmin = await isActiveIsomerAdmin(
        userToDeletePermissionsFrom.id,
      )
      if (!isRequestingUserIsomerAdmin && isUserToDeleteIsomerAdmin) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You do not have permission to delete this user",
        })
      }

      await deleteUserPermission({
        byUserId: ctx.user.id,
        siteId,
        userId,
      })

      return {
        email: userToDeletePermissionsFrom.email,
        id: userToDeletePermissionsFrom.id,
      }
    }),

  getUser: protectedProcedure
    .input(getUserInputSchema)
    .output(getUserOutputSchema)
    .query(async ({ ctx, input: { siteId, userId } }) => {
      await validatePermissionsForManagingUsers({
        action: "read",
        siteId,
        userId: ctx.user.id,
      })

      const result = await getUsersQuery({ adminType: "agency", siteId })
        .where("ActiveUser.id", "=", userId)
        .select((eb) => [
          "ActiveUser.id",
          "ActiveUser.email",
          "ActiveUser.name",
          "ActiveUser.createdAt",
          "ActiveUser.lastLoginAt",
          // Agency users always have an explicit ResourcePermission row (enforced
          // by the query filter), so role is guaranteed non-null here.
          eb
            .ref("ActiveResourcePermission.role")
            .$castTo<RoleType>()
            .as("role"),
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

  isIsomerAdmin: protectedProcedure
    .input(isIsomerAdminInputSchema)
    .output(isIsomerAdminOutputSchema)
    .query(
      async ({ ctx, input: { roles } }) =>
        await isActiveIsomerAdmin(ctx.user.id, roles),
    ),

  list: protectedProcedure
    .input(listUsersInputSchema)
    .output(listUsersOutputSchema)
    .query(async ({ ctx, input: { siteId, adminType, offset, limit } }) => {
      await validatePermissionsForManagingUsers({
        action: "read",
        siteId,
        userId: ctx.user.id,
      })

      return await getUsersQuery({ adminType, siteId })
        .orderBy("ActiveUser.email", "asc")
        .select((eb) => [
          "ActiveUser.id",
          "ActiveUser.email",
          "ActiveUser.name",
          "ActiveUser.lastLoginAt",
          "ActiveUser.createdAt",
          // Isomer admins always have an effective Admin role regardless of
          // any explicit ResourcePermission entry; agency users use coalesce
          // to fall back to Admin only when no explicit role exists.
          (adminType === "isomer"
            ? eb.val(RoleType.Admin)
            : eb.fn.coalesce(
                eb.ref("ActiveResourcePermission.role"),
                eb.val(RoleType.Admin),
              )
          ).as("role"),
        ])
        .limit(limit)
        .offset(offset)
        .execute()
    }),

  resendInvite: protectedProcedure
    .input(resendInviteInputSchema)
    .output(resendInviteOutputSchema)
    // Arbitrary limit to prevent invite email abuse; tune if legitimate usage is blocked
    .meta({ rateLimitOptions: { max: 10, windowMs: 60 * 1000 } })
    .mutation(async ({ ctx, input: { siteId, userId } }) => {
      await validatePermissionsForManagingUsers({
        action: "manage",
        siteId,
        userId: ctx.user.id,
      })

      const isSingpassEnabled = getIsSingpassEnabled({
        gb: ctx.gb,
      })
      if (!isSingpassEnabled) {
        throwSingpassDisabledError()
      }

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
      const userPermission = await getResourcePermission({
        siteId,
        userId: user.id,
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
        inviterName: actorName,
        isSingpassEnabled,
        recipientEmail: user.email,
        role: userPermission[0]?.role ?? RoleType.Editor,
        siteName,
      })

      return pick(user, ["email"])
    }),

  update: protectedProcedure
    .input(updateUserInputSchema)
    .output(updateUserOutputSchema)
    .mutation(async ({ ctx, input: { siteId, userId, role } }) => {
      await validatePermissionsForManagingUsers({
        action: "manage",
        siteId,
        userId: ctx.user.id,
      })

      const isSingpassEnabled = getIsSingpassEnabled({
        gb: ctx.gb,
      })
      if (!isSingpassEnabled) {
        throwSingpassDisabledError()
      }

      if (userId === ctx.user.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You cannot update your own role",
        })
      }

      const user = await db
        .selectFrom("User")
        .where("id", "=", userId)
        .where("deletedAt", "is", null)
        .selectAll()
        .executeTakeFirst()

      if (!user) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "User not found",
        })
      }

      const updatedUserPermission = await updateUserSitewidePermission({
        byUserId: ctx.user.id,
        role,
        siteId,
        userId,
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
      const updatedUser = await updateUserDetails({
        name,
        phone,
        userId: ctx.user.id,
      })

      return pick(updatedUser, ["name", "phone"])
    }),
})
