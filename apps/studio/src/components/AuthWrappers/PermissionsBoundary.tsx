import type { PropsWithChildren, ReactNode } from "react"

import { Can, PermissionsProvider } from "~/features/permissions"
import { useQueryParse } from "~/hooks/useQueryParse"
import { sitePageSchema } from "~/pages/sites/[siteId]"
import { DefaultLayout } from "~/templates/layouts/DefaultLayout"

interface PermissionsBoundaryProps {
  fallback: ReactNode
}
export const PermissionsBoundary = ({
  fallback,
  children,
}: PropsWithChildren<PermissionsBoundaryProps>) => {
  const { siteId } = useQueryParse(sitePageSchema)
  return (
    <PermissionsProvider siteId={siteId}>
      <Can do="read" on={{ parentId: null }} passThrough>
        {(allowed) => {
          return allowed ? children : <DefaultLayout>{fallback}</DefaultLayout>
        }}
      </Can>
    </PermissionsProvider>
  )
}
