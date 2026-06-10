import {
  countRedirectsSchema,
  createRedirectSchema,
  deleteRedirectSchema,
  listRedirectsSchema,
} from "~/schemas/redirect"
import { protectedProcedure, router } from "~/server/trpc"

import { validateUserPermissionsForSite } from "../site/site.service"
import {
  countRedirects,
  createRedirect,
  deleteRedirect,
  listRedirects,
} from "./redirect.service"

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

  count: protectedProcedure
    .input(countRedirectsSchema)
    .query(async ({ ctx, input }) => {
      await validateUserPermissionsForSite({
        siteId: input.siteId,
        userId: ctx.user.id,
        action: "read",
      })

      return countRedirects(input)
    }),

  // NOTE: create and delete publish the site immediately — there is no
  // separate publish step for redirects. Site-wide abilities only define CRUD
  // actions ("publish" exists only for resources), so both gate on "update" —
  // granted solely to site admins, matching other site-wide settings.
  create: protectedProcedure
    .input(createRedirectSchema)
    .mutation(async ({ ctx, input }) => {
      await validateUserPermissionsForSite({
        siteId: input.siteId,
        userId: ctx.user.id,
        action: "update",
      })

      return createRedirect({
        ...input,
        byUserId: ctx.user.id,
        logger: ctx.logger,
      })
    }),

  delete: protectedProcedure
    .input(deleteRedirectSchema)
    .mutation(async ({ ctx, input }) => {
      await validateUserPermissionsForSite({
        siteId: input.siteId,
        userId: ctx.user.id,
        action: "update",
      })

      await deleteRedirect({
        ...input,
        byUserId: ctx.user.id,
        logger: ctx.logger,
      })
    }),
})
