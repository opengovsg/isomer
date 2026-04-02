import { ADMIN_ROLE } from "~/lib/growthbook"
import {
  isEmailWhitelistedInputSchema,
  isEmailWhitelistedOutputSchema,
  whitelistEmailsInputSchema,
} from "~/schemas/whitelist"

import { protectedProcedure, router } from "../../trpc"
import {
  validatePermissionsForManagingUsers,
  validateUserIsIsomerCoreAdmin,
} from "../permissions/permissions.service"
import { isEmailWhitelisted, whitelistEmails } from "./whitelist.service"

export const whitelistRouter = router({
  isEmailWhitelisted: protectedProcedure
    .input(isEmailWhitelistedInputSchema)
    .output(isEmailWhitelistedOutputSchema)
    .query(async ({ ctx, input: { siteId, email } }) => {
      // Validate permissions as this endpoint is used for user management
      // and allows checking if emails are whitelisted. This ensures proper
      // access control even though the operation itself is read-only.
      await validatePermissionsForManagingUsers({
        siteId,
        userId: ctx.user.id,
        action: "manage",
      })

      return await isEmailWhitelisted(email)
    }),
  whitelistEmails: protectedProcedure
    .input(whitelistEmailsInputSchema)
    .mutation(async ({ ctx, input: { adminEmails, vendorEmails } }) => {
      await validateUserIsIsomerCoreAdmin({
        userId: ctx.user.id,
        gb: ctx.gb,
        roles: [ADMIN_ROLE.CORE, ADMIN_ROLE.MIGRATORS],
      })

      return whitelistEmails({ adminEmails, vendorEmails })
    }),
})
