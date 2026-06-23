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

  // create/delete publish immediately (no separate publish step). Site-wide
  // CRUD actions, granted only to site admins like other site settings.
  create: protectedProcedure
    .input(createRedirectSchema)
    .mutation(async ({ ctx, input }) => {
      await validateUserPermissionsForSite({
        siteId: input.siteId,
        userId: ctx.user.id,
        action: "create",
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
        action: "delete",
      })

      await deleteRedirect({
        ...input,
        byUserId: ctx.user.id,
        logger: ctx.logger,
      })
    }),
})
