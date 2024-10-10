import type { ReactNode } from "react"

import { PermissionsErrorBoundary } from "~/features/dashboard/PermissionsErrorPage"
import { PageEditingLayout } from "~/templates/layouts/PageEditingLayout"
import { PermissionsBoundary } from "./PermissionsBoundary"

export const PagePermissionsBoundary = (page: ReactNode) => {
  return (
    <PermissionsBoundary
      fallback={
        <PermissionsErrorBoundary
          title="You don't have access to edit this page."
          description="To have access, ask your site admins to assign this page to you"
          buttonText="Back to Site Content"
        />
      }
    >
      {PageEditingLayout(page)}
    </PermissionsBoundary>
  )
}
