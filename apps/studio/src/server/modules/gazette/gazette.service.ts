import { TRPCError } from "@trpc/server"
import { TOPPAN_EMAIL_DOMAIN } from "~/constants/toppan"
import { IsomerAdminRole } from "~prisma/generated/generatedEnums"

import { db } from "../database"
import { isActiveIsomerAdmin } from "../permissions/permissions.service"

/**
 * Throws FORBIDDEN unless the user is from Toppan or a Core IsomerAdmin.
 *
 * Without this check, anyone with site read/edit permission could call
 * gazette procedures directly with the gazette collection id.
 */
export const assertGazetteAccess = async (userId: string): Promise<void> => {
  const user = await db
    .selectFrom("User")
    .where("id", "=", userId)
    .select("email")
    .executeTakeFirst()

  if (!user) {
    // protectedProcedure already validated the session above us, so a missing
    // User row here is server-state inconsistency, not an auth failure.
    throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" })
  }

  if (user.email.endsWith(TOPPAN_EMAIL_DOMAIN)) return

  const isCoreAdmin = await isActiveIsomerAdmin(userId, [
    IsomerAdminRole.Core,
    IsomerAdminRole.Migrator,
  ])
  if (!isCoreAdmin) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "You do not have access to the gazette feature",
    })
  }
}
