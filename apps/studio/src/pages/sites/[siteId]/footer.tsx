import { Grid, GridItem } from "@chakra-ui/react"
import { ResourceType } from "~prisma/generated/generatedEnums"
import { z } from "zod"

import { PermissionsBoundary } from "~/components/AuthWrappers"
import { useCmsSidenavContext } from "~/contexts/CmsSidenavContext"
import { EditFooterPreview } from "~/features/settings/EditFooterPreview"
import { useQueryParse } from "~/hooks/useQueryParse"
import { type NextPageWithLayout } from "~/lib/types"
import { SiteSettingsLayout } from "~/templates/layouts/SiteSettingsLayout"

const footerSettingsSchema = z.object({
  siteId: z.coerce.number(),
})

const FooterSettingsPage: NextPageWithLayout = () => {
  const { siteId } = useQueryParse(footerSettingsSchema)
  const { isSidenavOpen } = useCmsSidenavContext()
  // NOTE: Editor spans 54% of the width when sidenav is open, 50% when closed
  const templateColumns = isSidenavOpen ? "repeat(50, 1fr)" : "repeat(2, 1fr)"
  const editorColSpan = isSidenavOpen ? 27 : 1
  const previewColSpan = isSidenavOpen ? 23 : 1

  return (
    <Grid h="full" w="100%" templateColumns={templateColumns} gap={0}>
      <GridItem colSpan={editorColSpan} overflow="auto" minW="30rem">
        <p>Footer menu</p>
      </GridItem>
      <GridItem colSpan={previewColSpan}>
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
