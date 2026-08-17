import { useToast } from "@opengovsg/design-system-react"
import posthog from "posthog-js"
import { ISOMER_SUPPORT_EMAIL } from "~/constants/misc"
import { BRIEF_TOAST_SETTINGS } from "~/constants/toast"
import { AuditLogExportRequestedReportType } from "~/schemas/audit"
import { trpc } from "~/utils/trpc"

interface UseCreateAuditLogExportRequestProps {
  siteId: number
  // Extra success work for the caller (e.g. the settings form resets itself).
  // Runs before the shared success toast.
  onSuccess?: () => void
}

// The one way to ask for an audit-log export from the client. Wraps the
// createExportRequest mutation with the shared success/error toasts and the
// PostHog capture per requested log type, so every surface that offers an
// export (the settings page form, the user-management export button) reports
// and reads identically.
export const useCreateAuditLogExportRequest = ({
  siteId,
  onSuccess,
}: UseCreateAuditLogExportRequestProps) => {
  const toast = useToast(BRIEF_TOAST_SETTINGS)

  return trpc.audit.createExportRequest.useMutation({
    onSuccess: (_data, { reportType: requestedReportType, month }) => {
      // `Both` fans out into two DB rows server-side (see auditLogExport.service.ts),
      // so mirror that here with one event per log type actually requested.
      if (
        requestedReportType === AuditLogExportRequestedReportType.Access ||
        requestedReportType === AuditLogExportRequestedReportType.Both
      ) {
        posthog.capture("user_access_log_requested", { site_id: siteId })
      }
      if (
        requestedReportType === AuditLogExportRequestedReportType.Activity ||
        requestedReportType === AuditLogExportRequestedReportType.Both
      ) {
        posthog.capture("audit_log_requested", { site_id: siteId, month })
      }

      onSuccess?.()
      toast({
        title: "Export requested",
        description:
          "Your export is being generated. We'll email you a download link when it's ready.",
        status: "success",
      })
    },
    // The server returns typed, user-facing messages for the expected
    // rejections (future month, not an admin). Duplicate requests never
    // fail — they are accepted idempotently. Surface server messages
    // directly; fall back to a generic message for anything else.
    onError: (error) => {
      if (error.data?.code === "FORBIDDEN") {
        toast({
          title: "You don't have permission to export audit logs",
          description: "Only site admins can request an audit log export.",
          status: "error",
        })
        return
      }

      toast({
        title: "Couldn't request export",
        description:
          error.message ||
          `If this persists, please report this issue at ${ISOMER_SUPPORT_EMAIL}`,
        status: "error",
      })
    },
  })
}
