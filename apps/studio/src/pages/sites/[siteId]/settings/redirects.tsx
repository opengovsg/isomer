import type { NextPageWithLayout } from "~/lib/types"
import { PermissionsBoundary } from "~/components/AuthWrappers"
import { siteSchema } from "~/features/editing-experience/schema"
import { RedirectsSettings } from "~/features/settings/Redirects"
import { useQueryParse } from "~/hooks/useQueryParse"
import { SiteSettingsLayout } from "~/templates/layouts/SiteSettingsLayout"
import { ResourceType } from "~prisma/generated/generatedEnums"

const RedirectsSettingsPage: NextPageWithLayout = () => {
  const { siteId } = useQueryParse(siteSchema)

  return <RedirectsSettings siteId={Number(siteId)} />
}

RedirectsSettingsPage.getLayout = (page) => {
  return (
    <PermissionsBoundary
      resourceType={ResourceType.RootPage}
      page={SiteSettingsLayout(page)}
    />
  )
}

export default RedirectsSettingsPage
