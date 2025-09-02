import { Grid, GridItem } from "@chakra-ui/react"
import { ResourceType } from "~prisma/generated/generatedEnums"
import { z } from "zod"

import { PermissionsBoundary } from "~/components/AuthWrappers"
import { EditNavbarPreview } from "~/features/settings/EditNavbarPreview"
import { NavbarEditor } from "~/features/settings/NavbarEditor"
import { useQueryParse } from "~/hooks/useQueryParse"
import { type NextPageWithLayout } from "~/lib/types"
import { SiteSettingsLayout } from "~/templates/layouts/SiteSettingsLayout"

const navbarSettingsSchema = z.object({
  siteId: z.coerce.number(),
})

const NavbarSettingsPage: NextPageWithLayout = () => {
  const { siteId } = useQueryParse(navbarSettingsSchema)

  return (
    <Grid h="full" w="100%" templateColumns="minmax(37.25rem, 1fr) 1fr" gap={0}>
      <GridItem colSpan={1} overflow="auto" minW="30rem">
        <NavbarEditor />
      </GridItem>
      <GridItem colSpan={1}>
        <EditNavbarPreview siteId={siteId} />
      </GridItem>
    </Grid>
  )
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
