import {
  isEmailWhitelistedInputSchema,
  isEmailWhitelistedOutputSchema,
  whitelistEmailsInputSchema,
} from "~/schemas/whitelist";
import { IsomerAdminRole } from "~prisma/generated/generatedEnums";

import { protectedProcedure, router } from "../../trpc";
import {
  validatePermissionsForManagingUsers,
  validateUserIsIsomerAdmin,
} from "../permissions/permissions.service";
import { isEmailWhitelisted, whitelistEmails } from "./whitelist.service";

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
      });

      return await isEmailWhitelisted(email);
    }),
  whitelistEmails: protectedProcedure
    .input(whitelistEmailsInputSchema)
    .mutation(async ({ ctx, input: { adminEmails, vendorEmails } }) => {
      await validateUserIsIsomerAdmin({
        userId: ctx.user.id,
        roles: [IsomerAdminRole.Core, IsomerAdminRole.Migrator],
      });

      return whitelistEmails({ adminEmails, vendorEmails });
    }),
});
