import { listRedirectsSchema, publishRedirectsSchema } from "~/schemas/redirect"
import { protectedProcedure, router } from "~/server/trpc"

import { bulkValidateUserPermissionsForResources } from "../permissions/permissions.service"
import { validateUserPermissionsForSite } from "../site/site.service"
import { listRedirects, publishRedirects } from "./redirect.service"

export const redirectRouter = router({
  list: protectedProcedure
    .input(listRedirectsSchema)
    .query(async ({ ctx, input }) => {
      await validateUserPermissionsForSite({
        siteId: input.siteId,
        userId: ctx.user.id,
        action: "read",
      })

      return listRedirects(input)
    }),

  publish: protectedProcedure
    .input(publishRedirectsSchema)
    .mutation(async ({ ctx, input }) => {
      await bulkValidateUserPermissionsForResources({
        siteId: input.siteId,
        userId: ctx.user.id,
        action: "publish",
      })

      await publishRedirects(input)
    }),
})
