import { Flex } from "@chakra-ui/react"
import { AppNavbar } from "~/components/AppNavbar"
import { EnforceLoginStatePageWrapper } from "~/components/AuthWrappers"
import { CmsContainer } from "~/components/CmsSidebar"
import { LayoutHead } from "~/components/LayoutHead"
import { type GetLayout } from "~/lib/types"

export const SiteMinimalLayout: GetLayout = (page) => {
  return (
    <EnforceLoginStatePageWrapper>
      <LayoutHead />
      <Flex
        flex={1}
        overflow="hidden"
        flexDir="row"
        bg="base.canvas.alt"
        pos="relative"
      >
        <CmsContainer variant="basic" header={<AppNavbar />}>
          {page}
        </CmsContainer>
      </Flex>
    </EnforceLoginStatePageWrapper>
  )
}
