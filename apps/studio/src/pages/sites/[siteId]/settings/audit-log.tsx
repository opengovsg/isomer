import type { NextPageWithLayout } from "~/lib/types"
import { Stack } from "@chakra-ui/react"
import { useFeatureValue, useGrowthBook } from "@growthbook/growthbook-react"
import { useRouter } from "next/router"
import { useContext, useEffect } from "react"
import { PermissionsBoundary } from "~/components/AuthWrappers"
import { FullscreenSpinner } from "~/components/FullscreenSpinner"
import { siteSchema } from "~/features/editing-experience/schema"
import { AuditLogExportSection } from "~/features/settings/AuditLogExport"
import { getAgencySettingsHref } from "~/features/settings/constants"
import { UserManagementContext } from "~/features/users"
import { useQueryParse } from "~/hooks/useQueryParse"
import { IS_AUDIT_LOG_ENABLED_FEATURE_KEY } from "~/lib/growthbook"
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

  // Feature-flagged alongside the admin gate. GrowthBook loads features
  // asynchronously, so wait for `gb.ready` before acting on the flag —
  // otherwise an admin visiting during the flag fetch would be bounced by the
  // `false` fallback. The `useFeatureValue` subscription re-renders this page
  // when features arrive, at which point `gb.ready` reads true.
  const gb = useGrowthBook()
  const isGbReady = gb.ready
  const isAuditLogEnabled = useFeatureValue<boolean>(
    IS_AUDIT_LOG_ENABLED_FEATURE_KEY,
    false,
  )

  // Audit log export is admin-only and feature-flagged. The sidenav hides the
  // entry, but the route is still reachable directly (e.g. a shared link).
  // Redirect to the default settings page rather than showing a blank pane,
  // mirroring how `/settings` redirects. Server-side authorization is
  // enforced independently by the mutation.
  useEffect(() => {
    if (isRolesPending || !isGbReady) return
    if (!canManageUsers || !isAuditLogEnabled) {
      void router.replace(getAgencySettingsHref(siteId))
    }
  }, [
    isRolesPending,
    isGbReady,
    canManageUsers,
    isAuditLogEnabled,
    router,
    siteId,
  ])

  if (isRolesPending || !isGbReady || !canManageUsers || !isAuditLogEnabled) {
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
