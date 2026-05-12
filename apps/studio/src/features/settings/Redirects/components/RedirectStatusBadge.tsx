import { Badge } from "@opengovsg/design-system-react"

import type { RedirectStatus } from "../types"

const STATUS_CONFIG: Record<
  RedirectStatus,
  { label: string; colorScheme: string }
> = {
  draft: { label: "Draft", colorScheme: "warning" },
  active: { label: "Active", colorScheme: "success" },
  deleted: { label: "Deleted", colorScheme: "critical" },
}

interface RedirectStatusBadgeProps {
  status: RedirectStatus
}

export const RedirectStatusBadge = ({
  status,
}: RedirectStatusBadgeProps): JSX.Element => {
  const { label, colorScheme } = STATUS_CONFIG[status]
  return (
    <Badge variant="subtle" colorScheme={colorScheme}>
      {label}
    </Badge>
  )
}
