import { TRPCError } from "@trpc/server"
import {
  AuditLogExportScope,
  createAuditLogExportRequestServerSchema,
  getAuditLogExportWindowSchema,
} from "~/schemas/audit"
import getIP from "~/utils/getClientIp"

import { protectedProcedure, router } from "../../trpc"
import { validateUserIsSiteAdmin } from "../permissions/permissions.service"
import { getAdminSiteIds } from "../site/site.service"
import {
  createAuditLogExportRequest,
  getAuditLogExportWindow,
} from "./auditLogExport.service"

export const auditRouter = router({
  // How many months back the export picker may offer for this site — see
  // `getAuditLogExportWindow`. Same Site Admin gate as creating an export,
  // since this is purely a read used to size that same form.
  getExportWindow: protectedProcedure
    .input(getAuditLogExportWindowSchema)
    .query(async ({ ctx, input: { siteId } }) => {
      await validateUserIsSiteAdmin({
        siteId,
        userId: ctx.user.id,
      })

      return getAuditLogExportWindow(siteId)
    }),
  createExportRequest: protectedProcedure
    .input(createAuditLogExportRequestServerSchema)
    // Rate-limited because each accepted request eventually triggers downstream
    // work that hits external services (CSV generation, S3 upload, email).
    // Arbitrary low limit to prevent abuse; tune if legitimate usage is blocked.
    .meta({ rateLimitOptions: { max: 5, windowMs: 60_000 } })
    .mutation(async ({ ctx, input }) => {
      const { scope, month, reportType } = input

      // Permission check FIRST, before any mutation, resolved into the
      // concrete site IDs this ask covers. "site" is always exactly the one
      // requested site (Site Admin-only); "allSites" is resolved server-side
      // from the caller's own Admin access — never trusted from client input
      // — and is authorised as long as they Admin at least one site.
      let siteIds: number[]
      if (scope === AuditLogExportScope.Site) {
        const { siteId } = input
        if (siteId === undefined) {
          // Unreachable: createAuditLogExportRequestServerSchema requires
          // `siteId` whenever `scope` is "site".
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Select a valid site",
          })
        }
        await validateUserIsSiteAdmin({ siteId, userId: ctx.user.id })
        siteIds = [siteId]
      } else {
        siteIds = await getAdminSiteIds(ctx.user.id)
        if (siteIds.length === 0) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "You are not an Admin on any site",
          })
        }
      }

      try {
        // One independent export request per site: for `scope: "site"` this
        // is exactly the pre-existing single-site path (a one-element fan-out);
        // for "allSites" it fans out across every site resolved above, reusing
        // that same path unchanged — its own dedupe, audit event, and CSV job
        // per site, mirroring how the removed "Both" report type used to fan
        // out one row per report type.
        const ip = getIP(ctx.req)
        const results = await Promise.all(
          siteIds.map((siteId) =>
            createAuditLogExportRequest({
              siteId,
              userId: ctx.user.id,
              month,
              reportType,
              ip,
            }),
          ),
        )
        return results.flat()
      } catch (error) {
        // Permission / validation failures are already typed TRPCErrors with
        // safe, user-facing messages — let them through. (Duplicate asks no
        // longer error: they are accepted idempotently by the service.)
        if (error instanceof TRPCError) {
          throw error
        }

        // Anything else (e.g. a DB error) may leak request internals; log it
        // with the request context and surface a generic error to the client.
        ctx.logger.error({
          error,
          message: "Failed to create audit log export request",
          scope,
          month,
          reportType,
        })
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create audit log export request",
        })
      }
    }),
})
