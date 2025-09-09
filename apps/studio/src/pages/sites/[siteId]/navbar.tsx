import { ResourceType } from "~prisma/generated/generatedEnums"

import { PermissionsBoundary } from "~/components/AuthWrappers"
import { siteSchema } from "~/features/editing-experience/schema"
import { useQueryParse } from "~/hooks/useQueryParse"
import { type NextPageWithLayout } from "~/lib/types"
import { SiteSettingsLayout } from "~/templates/layouts/SiteSettingsLayout"

const NavbarSettingsPage: NextPageWithLayout = () => {
  const { siteId } = useQueryParse(siteSchema)

  return <p>Site {siteId}</p>
}

NavbarSettingsPage.getLayout = (page) => {
  return (
    <PermissionsBoundary
      resourceType={ResourceType.RootPage}
      page={SiteSettingsLayout(page)}
    />
  )
}

export default NavbarSettingsPage
