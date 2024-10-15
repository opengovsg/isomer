import { Flex, Grid } from "@chakra-ui/react"
import { Tabs } from "@opengovsg/design-system-react"

import { EnforceLoginStatePageWrapper } from "~/components/AuthWrappers"
import { LayoutHead } from "~/components/LayoutHead"
import { LinkEditNavbar } from "~/features/editing-experience/components/LinkEditNavbar"
import { type GetLayout } from "~/lib/types"

export const LinkEditingLayout: GetLayout = (page) => {
  return (
    <EnforceLoginStatePageWrapper>
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
    </EnforceLoginStatePageWrapper>
  )
}
