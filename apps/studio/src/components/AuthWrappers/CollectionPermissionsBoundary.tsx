import type { ReactNode } from "react"

import { PermissionsErrorBoundary } from "~/features/dashboard/PermissionsErrorPage"
import { AdminCmsSidebarLayout } from "~/templates/layouts/AdminCmsSidebarLayout"
import { PermissionsBoundary } from "./PermissionsBoundary"

export const CollectionPermissionsBoundary = (page: ReactNode) => {
  return (
    <PermissionsBoundary
      fallback={
        <PermissionsErrorBoundary
          title="You don't have access to edit this collection."
          description="To have access, ask your site admins to assign this collection to you"
          buttonText="Back to My Sites"
        />
      }
    >
      {AdminCmsSidebarLayout(page)}
    </PermissionsBoundary>
  )
}
