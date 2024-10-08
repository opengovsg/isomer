import { Flex, Grid } from "@chakra-ui/react"
import { Tabs } from "@opengovsg/design-system-react"

import { EnforceLoginStatePageWrapper } from "~/components/AuthWrappers"
import { LayoutHead } from "~/components/LayoutHead"
import { APP_GRID_TEMPLATE_AREA } from "~/constants/layouts"
import { SiteEditNavbar } from "~/features/editing-experience/components/SiteEditNavbar"
import { editPageSchema } from "~/features/editing-experience/schema"
import { PermissionsProvider } from "~/features/permissions"
import { useQueryParse } from "~/hooks/useQueryParse"
import { type GetLayout } from "~/lib/types"

export const PageEditingLayout: GetLayout = (page) => {
  const { pageId, siteId } = useQueryParse(editPageSchema)

  return (
    <EnforceLoginStatePageWrapper>
      <PermissionsProvider siteId={siteId} resourceId={String(pageId)}>
        <LayoutHead />
        <Tabs>
          <Flex
            minH="100vh"
            flexDir="column"
            bg="base.canvas.alt"
            pos="relative"
          >
            <Grid
              flex={1}
              width="100vw"
              gridColumnGap={{ base: 0, md: "1rem" }}
              gridTemplate={APP_GRID_TEMPLATE_AREA}
            >
              <SiteEditNavbar />
              <Flex flex={1} bg="base.canvas.alt" w="100vw">
                {page}
              </Flex>
            </Grid>
          </Flex>
        </Tabs>
      </PermissionsProvider>
    </EnforceLoginStatePageWrapper>
  )
}
