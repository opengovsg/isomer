import { RoleType } from "@prisma/client"
import { TRPCError } from "@trpc/server"

import type { ResourcePermission } from "~prisma/generated/generatedTypes"
import {
  createInputSchema,
  createOutputSchema,
  deleteInputSchema,
  deleteOutputSchema,
  listInputSchema,
  listOutputSchema,
  updateInputSchema,
  updateOutputSchema,
} from "~/schemas/user"
import { protectedProcedure, router } from "../../trpc"
import { db, sql } from "../database"
import { validatePermissionsForManagingUsers } from "../permissions/permissions.service"
import { createUser, validateEmailRoleCombination } from "./user.service"

interface RankedResourcePermission extends ResourcePermission {
  rn: number
}

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
        .with("ActiveResourcePermission", (qb) =>
          qb
            .selectFrom(
              sql<RankedResourcePermission>`(
                SELECT *,
                  ROW_NUMBER() OVER (
                    PARTITION BY "userId", "siteId", "resourceId"
                    ORDER BY CASE 
                      WHEN role = ${RoleType.Admin} THEN 1
                      WHEN role = ${RoleType.Publisher} THEN 2
                      WHEN role = ${RoleType.Editor} THEN 3
                    END ASC
                  ) as rn
                FROM "ResourcePermission"
                WHERE "deletedAt" IS NULL
                AND "siteId" = ${siteId}
              )`.as("ranked_permissions"),
            )
            .selectAll()
            .where("rn", "=", 1),
        )
        .with("ActiveUser", (qb) =>
          qb.selectFrom("User").selectAll().where("deletedAt", "is", null),
        )
        .selectFrom("ActiveUser")
        .innerJoin(
          "ActiveResourcePermission",
          "ActiveUser.id",
          "ActiveResourcePermission.userId",
        )
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

      return {
        siteId,
        userId,
        role: updatedUserPermissions.role,
      }
    }),
})
