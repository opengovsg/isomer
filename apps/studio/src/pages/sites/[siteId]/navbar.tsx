import { ResourceType } from "~prisma/generated/generatedEnums"
import { z } from "zod"

import { PermissionsBoundary } from "~/components/AuthWrappers"
import { useQueryParse } from "~/hooks/useQueryParse"
import { type NextPageWithLayout } from "~/lib/types"
import { SiteSettingsLayout } from "~/templates/layouts/SiteSettingsLayout"

const navbarSettingsSchema = z.object({
  siteId: z.coerce.number(),
})

const NavbarSettingsPage: NextPageWithLayout = () => {
  const { siteId } = useQueryParse(navbarSettingsSchema)

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
