import type { GetLayout } from "~/lib/types"
import { Flex, Grid } from "@chakra-ui/react"
import { Tabs } from "@opengovsg/design-system-react"
import { EnforceLoginStatePageWrapper } from "~/components/AuthWrappers"
import { LayoutHead } from "~/components/LayoutHead"
import { LinkEditNavbar } from "~/features/editing-experience/components/LinkEditNavbar"
import { PermissionsProvider } from "~/features/permissions"
import { useQueryParse } from "~/hooks/useQueryParse"
import { editLinkPageSchema } from "~/pages/sites/[siteId]/links/[linkId]/editLinkPageSchema"

export const LinkEditingLayout: GetLayout = (page) => {
  const { linkId, siteId } = useQueryParse(editLinkPageSchema)

  return (
    <EnforceLoginStatePageWrapper>
      <PermissionsProvider siteId={siteId} resourceId={linkId}>
        <LayoutHead />
        <Tabs flex={1} height={0}>
          <Flex
            flexDir="column"
            bg="base.canvas.alt"
            pos="relative"
            height={0}
            minH="100%"
          >
            <Grid
              flex={1}
              height={0}
              minH="100%"
              width="100%"
              gridColumnGap={{ base: 0, md: "1rem" }}
              gridTemplateRows="auto 1fr"
            >
              <LinkEditNavbar />
              <Flex bg="base.canvas.alt" w="100%" height={0} minH="100%">
                {page}
              </Flex>
            </Grid>
          </Flex>
        </Tabs>
      </PermissionsProvider>
    </EnforceLoginStatePageWrapper>
  )
}
