import { z } from "zod"
import {
  AuditLogExportRequestedReportType,
  createAuditLogExportRequestSchema,
} from "~/schemas/audit"

// Client-only: the shared schema's `reportType` is a required enum because
// the server must never accept a `null` request. The form, however, starts
// with no log type picked, so it needs a real "unset" value to hold in that
// state — `null` rather than `undefined`, so `useZodForm`'s inferred types
// stay honest about what the field can be before submission. The type-guard
// refine narrows `null` back out of the validated output, so `handleSubmit`
// still hands the router-facing code a plain, required enum.
export const auditLogExportFormSchema = createAuditLogExportRequestSchema
  .omit({ siteId: true, reportType: true })
  .extend({
    reportType: z
      .enum(AuditLogExportRequestedReportType, {
        message: "Select a report type",
      })
      .nullable()
      .refine(
        (reportType): reportType is AuditLogExportRequestedReportType =>
          reportType !== null,
        { message: "Select a report type" },
      ),
  })
