import {
  isEmailWhitelistedInputSchema,
  isEmailWhitelistedOutputSchema,
} from "~/schemas/whitelist"
import { protectedProcedure, router } from "../../trpc"
import { validatePermissionsForManagingUsers } from "../permissions/permissions.service"
import { isEmailWhitelisted } from "./whitelist.service"

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
        action: "create",
      })

      return await isEmailWhitelisted(email)
    }),
})
