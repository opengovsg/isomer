import {
  countRedirectsByDestinationSchema,
  countRedirectsSchema,
  createRedirectSchema,
  deleteRedirectSchema,
  getRedirectBySourceSchema,
  listRedirectsSchema,
  resolveRedirectReferencesSchema,
} from "~/schemas/redirect"
import { protectedProcedure, router } from "~/server/trpc"

import { validateUserPermissionsForSite } from "../site/site.service"
import {
  countRedirects,
  countRedirectsPointingToResource,
  createRedirect,
  deleteRedirect,
  getRedirectBySource,
  listRedirects,
  resolveRedirectReferences,
  validateRedirect,
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

  // Preflight a would-be redirect, returning blocking errors and non-blocking
  // warnings so the form can surface them before the user commits. Read-only
  // and gated on "read" like the other queries — it exposes only whether
  // internal pages/redirects exist, which read access already covers.
  validate: protectedProcedure
    .input(createRedirectSchema)
    .query(async ({ ctx, input }) => {
      await validateUserPermissionsForSite({
        siteId: input.siteId,
        userId: ctx.user.id,
        action: "read",
      })

      return validateRedirect(input)
    }),

  // Resolves stored [resource:...] destinations to display permalinks. A read
  // is enough — it only surfaces permalinks the caller can already see.
  resolveReferences: protectedProcedure
    .input(resolveRedirectReferencesSchema)
    .query(async ({ ctx, input }) => {
      await validateUserPermissionsForSite({
        siteId: input.siteId,
        userId: ctx.user.id,
        action: "read",
      })

      return resolveRedirectReferences(input)
    }),

  // Whether a path is the source of a live redirect (and where it points), for
  // the page-settings warning. Read-only — surfaces only the redirect's
  // destination, which read access already covers.
  getBySource: protectedProcedure
    .input(getRedirectBySourceSchema)
    .query(async ({ ctx, input }) => {
      await validateUserPermissionsForSite({
        siteId: input.siteId,
        userId: ctx.user.id,
        action: "read",
      })

      return getRedirectBySource(input)
    }),

  // Counts the live redirects that point at a resource (or any descendant), so
  // the delete-page modal can warn they will be removed. Read-only.
  countByDestinationResource: protectedProcedure
    .input(countRedirectsByDestinationSchema)
    .query(async ({ ctx, input }) => {
      await validateUserPermissionsForSite({
        siteId: input.siteId,
        userId: ctx.user.id,
        action: "read",
      })

      return countRedirectsPointingToResource(input)
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
