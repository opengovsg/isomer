import { createAuditLogExportRequestSchema } from "~/schemas/audit"

// Client-only: omit `siteId` (comes from props) and `reportType` — this
// section only ever requests the Activity log (Access-log export moved to
// its own button on the Users page), so the component supplies that report
// type directly on submit rather than capturing it in the form.
export const auditLogExportFormSchema = createAuditLogExportRequestSchema.omit({
  siteId: true,
  reportType: true,
})
