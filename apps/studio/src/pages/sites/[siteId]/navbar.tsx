import { Grid, GridItem } from "@chakra-ui/react"
import { ResourceType } from "~prisma/generated/generatedEnums"

import { PermissionsBoundary } from "~/components/AuthWrappers"
import { siteSchema } from "~/features/editing-experience/schema"
import { EditNavbarPreview } from "~/features/settings/EditNavbarPreview"
import { useQueryParse } from "~/hooks/useQueryParse"
import { type NextPageWithLayout } from "~/lib/types"
import { SiteSettingsLayout } from "~/templates/layouts/SiteSettingsLayout"

const NavbarSettingsPage: NextPageWithLayout = () => {
  const { siteId } = useQueryParse(siteSchema)

  return (
    <Grid h="full" w="100%" templateColumns="minmax(37.25rem, 1fr) 1fr" gap={0}>
      <GridItem colSpan={1} overflow="auto" minW="30rem">
        <p>Navigation menu</p>
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
