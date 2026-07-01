import { TRPCError } from "@trpc/server"
import { createAuditLogExportRequestSchema } from "~/schemas/audit"

import { protectedProcedure, router } from "../../trpc"
import { createAuditLogExportRequest } from "./auditLogExport.service"

export const auditRouter = router({
  createExportRequest: protectedProcedure
    .input(createAuditLogExportRequestSchema)
    // Rate-limited because each accepted request eventually triggers downstream
    // work that hits external services (CSV generation, S3 upload, email).
    // Arbitrary low limit to prevent abuse; tune if legitimate usage is blocked.
    .meta({ rateLimitOptions: { max: 5, windowMs: 60_000 } })
    .mutation(async ({ ctx, input: { siteId, month, reportType } }) => {
      try {
        return await createAuditLogExportRequest({
          siteId,
          userId: ctx.user.id,
          month,
          reportType,
        })
      } catch (error) {
        // Permission / validation / dedupe failures are already typed
        // TRPCErrors with safe, user-facing messages — let them through.
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
