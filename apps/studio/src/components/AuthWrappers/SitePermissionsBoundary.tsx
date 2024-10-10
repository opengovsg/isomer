import type { ReactNode } from "react"

import { PermissionsErrorBoundary } from "~/features/dashboard/PermissionsErrorPage"
import { AdminSidebarOnlyLayout } from "~/templates/layouts/AdminSidebarOnlyLayout"
import { PermissionsBoundary } from "./PermissionsBoundary"

export const SitePermissionsBoundary = (page: ReactNode) => {
  return (
    <PermissionsBoundary
      fallback={
        <PermissionsErrorBoundary
          title="You don't have access to edit this site."
          description="To have access, ask your site admins to add you as an editor. If they’ve already added you, you might need to refresh this page."
          buttonText="Back to My Sites"
        />
      }
    >
      {AdminSidebarOnlyLayout(page)}
    </PermissionsBoundary>
  )
}
