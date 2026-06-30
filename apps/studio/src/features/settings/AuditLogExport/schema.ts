import type { z } from "zod"
import { createAuditLogExportRequestSchema } from "~/schemas/audit"

// The section component injects `siteId` from props on submit, so the form
// itself only owns the user-editable fields. Derived from the shared schema so
// the field shapes and messages stay in lockstep with the server input.
export const auditLogExportFormSchema = createAuditLogExportRequestSchema.omit({
  siteId: true,
})

export type AuditLogExportFormInput = z.input<typeof auditLogExportFormSchema>
