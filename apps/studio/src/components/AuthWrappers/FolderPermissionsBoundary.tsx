import type { ReactNode } from "react"

import { PermissionsErrorBoundary } from "~/features/dashboard/PermissionsErrorPage"
import { AdminCmsSidebarLayout } from "~/templates/layouts/AdminCmsSidebarLayout"
import { PermissionsBoundary } from "./PermissionsBoundary"

export const FolderPermissionsBoundary = (page: ReactNode) => {
  return (
    <PermissionsBoundary
      fallback={
        <PermissionsErrorBoundary
          title="You don't have access to edit this folder."
          description="To have access, ask your site admins to assign this folder to you"
          buttonText="Back to My Sites"
        />
      }
    >
      {AdminCmsSidebarLayout(page)}
    </PermissionsBoundary>
  )
}
