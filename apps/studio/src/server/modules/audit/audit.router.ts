import { TRPCError } from "@trpc/server"
import {
  createAuditLogExportRequestSchema,
  getAuditLogExportWindowSchema,
} from "~/schemas/audit"
import getIP from "~/utils/getClientIp"

import { protectedProcedure, router } from "../../trpc"
import { validateUserIsSiteAdmin } from "../permissions/permissions.service"
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
    .input(createAuditLogExportRequestSchema)
    // Rate-limited because each accepted request eventually triggers downstream
    // work that hits external services (CSV generation, S3 upload, email).
    // Arbitrary low limit to prevent abuse; tune if legitimate usage is blocked.
    .meta({ rateLimitOptions: { max: 5, windowMs: 60_000 } })
    .mutation(async ({ ctx, input: { siteId, month, reportType } }) => {
      // Permission check FIRST, before any mutation. Audit log export is a
      // Site Admin-only capability so we reject any attempts if they are not an admin
      await validateUserIsSiteAdmin({
        siteId,
        userId: ctx.user.id,
      })

      try {
        return await createAuditLogExportRequest({
          siteId,
          userId: ctx.user.id,
          month,
          reportType,
          // Capture the requester IP the same way sibling audit events do
          // (see auth.router.ts), so the AuditLogExportCreate event records
          // who exported the logs AND from where.
          ip: getIP(ctx.req),
        })
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
          siteId,
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
