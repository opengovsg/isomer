import type { ButtonProps } from "@chakra-ui/react"
import { Button, Tooltip } from "@chakra-ui/react"
import { useFeatureValue } from "@growthbook/growthbook-react"
import { useContext } from "react"
import { BiDownload } from "react-icons/bi"
import { useCreateAuditLogExportRequest } from "~/features/settings/AuditLogExport/useCreateAuditLogExportRequest"
import { UserManagementContext } from "~/features/users"
import { IS_AUDIT_LOG_ENABLED_FEATURE_KEY } from "~/lib/growthbook"
import {
  AuditLogExportRequestedReportType,
  getCurrentSingaporeMonth,
} from "~/schemas/audit"

interface ExportAccessLogsButtonProps extends Omit<ButtonProps, "onClick"> {
  siteId: number
}

// One-click export of the user access review logs from the user-management
// pane. Fires the same createExportRequest mutation as the settings page's
// export form (shared hook: same toasts, same PostHog captures); the CSV is
// generated async and emailed. Access reports are always a point-in-time
// snapshot pinned to the current month server-side, so the current Singapore
// month is submitted.
export const ExportAccessLogsButton = ({
  siteId,
  ...buttonProps
}: ExportAccessLogsButtonProps) => {
  const ability = useContext(UserManagementContext)
  const canManageUsers = ability.can("manage", "UserManagement")

  // Hidden entirely (not just disabled) while the audit-log surface ships
  // dark, mirroring the settings sidenav entry. Defaults to hidden until
  // GrowthBook features load; the button simply appears once the flag arrives.
  const isAuditLogEnabled = useFeatureValue<boolean>(
    IS_AUDIT_LOG_ENABLED_FEATURE_KEY,
    false,
  )

  const { mutate: createExportRequest, isPending } =
    useCreateAuditLogExportRequest({ siteId })

  if (!isAuditLogEnabled) return null

  const button = (
    <Button
      variant="outline"
      leftIcon={<BiDownload />}
      isLoading={isPending}
      isDisabled={!canManageUsers}
      onClick={() =>
        createExportRequest({
          siteId,
          month: getCurrentSingaporeMonth(),
          reportType: AuditLogExportRequestedReportType.Access,
        })
      }
      {...buttonProps}
    >
      Export access logs
    </Button>
  )

  if (!canManageUsers) {
    return (
      <Tooltip label="Only admins can export access logs." placement="bottom">
        {button}
      </Tooltip>
    )
  }

  return button
}
