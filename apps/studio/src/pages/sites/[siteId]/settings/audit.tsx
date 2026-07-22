import type { NextPageWithLayout } from "~/lib/types"
import { Stack } from "@chakra-ui/react"
import { useRouter } from "next/router"
import { useContext, useEffect } from "react"
import { PermissionsBoundary } from "~/components/AuthWrappers"
import { FullscreenSpinner } from "~/components/FullscreenSpinner"
import { siteSchema } from "~/features/editing-experience/schema"
import { AuditLogExportSection } from "~/features/settings/AuditLogExport"
import { UserManagementContext } from "~/features/users"
import { useQueryParse } from "~/hooks/useQueryParse"
import { SiteSettingsLayout } from "~/templates/layouts/SiteSettingsLayout"
import { trpc } from "~/utils/trpc"
import { ResourceType } from "~prisma/generated/generatedEnums"

const AuditLogExportSettingsPage: NextPageWithLayout = () => {
  const { siteId } = useQueryParse(siteSchema)
  const router = useRouter()

  // The admin ability is derived once by `UserManagementProvider` (mounted by
  // `SiteSettingsLayout`); read it here rather than re-deriving. This separate
  // `getRolesFor` query only supplies the loading signal — react-query dedupes
  // it against the provider's identical query, so it issues no extra request.
  const ability = useContext(UserManagementContext)
  const canManageUsers = ability.can("manage", "UserManagement")
  const { isPending: isRolesPending } = trpc.resource.getRolesFor.useQuery({
    siteId: Number(siteId),
    resourceId: null,
  })

  // Audit log export is admin-only. The sidenav hides the entry from
  // non-admins, but the route is still reachable directly (e.g. a shared
  // link). Redirect them to the default settings page rather than showing a
  // blank pane, mirroring how `/settings` redirects. Server-side authorization
  // is enforced independently by the mutation.
  useEffect(() => {
    if (!isRolesPending && !canManageUsers) {
      void router.replace(`/sites/${siteId}/settings/agency`)
    }
  }, [isRolesPending, canManageUsers, router, siteId])

  if (isRolesPending || !canManageUsers) {
    return <FullscreenSpinner />
  }

  return (
    <Stack spacing="1.5rem" px="2rem" py="1.5rem" w="full">
      <AuditLogExportSection siteId={Number(siteId)} />
    </Stack>
  )
}

AuditLogExportSettingsPage.getLayout = (page) => {
  return (
    <PermissionsBoundary
      resourceType={ResourceType.RootPage}
      page={SiteSettingsLayout(page)}
    />
  )
}

export default AuditLogExportSettingsPage
