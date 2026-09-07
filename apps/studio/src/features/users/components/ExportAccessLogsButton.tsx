import type { ButtonProps } from "@chakra-ui/react"
import { Button } from "@chakra-ui/react"
import { useFeatureValue } from "@growthbook/growthbook-react"
import { useSetAtom } from "jotai"
import { useContext } from "react"
import { BiDownload } from "react-icons/bi"
import { UserManagementContext } from "~/features/users"
import { exportAccessLogsModalAtom } from "~/features/users/atoms"
import { IS_AUDIT_LOG_ENABLED_FEATURE_KEY } from "~/lib/growthbook"

interface ExportAccessLogsButtonProps extends Omit<ButtonProps, "onClick"> {
  siteId: number
}

// Opens the "Export access history" modal (ExportAccessLogsModal, rendered
// once at the page level), which lets the admin pick the export scope before
// firing the request.
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

  const setExportAccessLogsModalState = useSetAtom(exportAccessLogsModalAtom)

  // Exporting access logs is admin-only: the button is not rendered at all
  // for other roles (unlike AddNewUserButton's disabled-with-tooltip, there
  // is nothing a non-admin can do to unlock it on this page). The server
  // enforces the same rule independently on the mutation.
  if (!isAuditLogEnabled || !canManageUsers) return null

  return (
    <Button
      variant="outline"
      leftIcon={<BiDownload />}
      onClick={() => setExportAccessLogsModalState({ siteId, isOpen: true })}
      {...buttonProps}
    >
      Export user access
    </Button>
  )
}
