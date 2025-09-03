import { Grid, GridItem } from "@chakra-ui/react"
import { ResourceType } from "~prisma/generated/generatedEnums"
import { z } from "zod"

import { PermissionsBoundary } from "~/components/AuthWrappers"
import { EditFooterPreview } from "~/features/settings/EditFooterPreview"
import { useQueryParse } from "~/hooks/useQueryParse"
import { type NextPageWithLayout } from "~/lib/types"
import { SiteSettingsLayout } from "~/templates/layouts/SiteSettingsLayout"

const footerSettingsSchema = z.object({
  siteId: z.coerce.number(),
})

const FooterSettingsPage: NextPageWithLayout = () => {
  const { siteId } = useQueryParse(footerSettingsSchema)

  return (
    <Grid h="full" w="100%" templateColumns="minmax(37.25rem, 1fr) 1fr" gap={0}>
      <GridItem colSpan={1} overflow="auto" minW="30rem">
        <p>Footer menu</p>
      </GridItem>
      <GridItem colSpan={1}>
        <EditFooterPreview siteId={siteId} />
      </GridItem>
    </Grid>
  )
}

FooterSettingsPage.getLayout = (page) => {
  return (
    <PermissionsBoundary
      resourceType={ResourceType.RootPage}
      page={SiteSettingsLayout(page)}
    />
  )
}

export default FooterSettingsPage
