import type { NextPageWithLayout } from "~/lib/types"
import { Stack } from "@chakra-ui/react"
import { PermissionsBoundary } from "~/components/AuthWrappers"
import { siteSchema } from "~/features/editing-experience/schema"
import { AuditLogExportSection } from "~/features/settings/AuditLogExport"
import { UserManagementProvider } from "~/features/users"
import { useQueryParse } from "~/hooks/useQueryParse"
import { SiteSettingsLayout } from "~/templates/layouts/SiteSettingsLayout"
import { ResourceType } from "~prisma/generated/generatedEnums"

const AuditLogExportSettingsPage: NextPageWithLayout = () => {
  const { siteId } = useQueryParse(siteSchema)

  return (
    <UserManagementProvider siteId={Number(siteId)}>
      <Stack spacing="1.5rem" px="2rem" py="1.5rem" w="full">
        <AuditLogExportSection siteId={Number(siteId)} />
      </Stack>
    </UserManagementProvider>
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
