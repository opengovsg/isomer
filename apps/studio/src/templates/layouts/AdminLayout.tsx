import { Flex } from "@chakra-ui/react"

import { AppNavbar } from "~/components/AppNavbar"
import { EnforceLoginStatePageWrapper } from "~/components/AuthWrappers"
import { APP_GRID_COLUMN } from "~/constants/layouts"
import { type GetLayout } from "~/lib/types"
import { AppGrid } from "../AppGrid"

export const AdminLayout: GetLayout = (page) => {
  return (
    <EnforceLoginStatePageWrapper>
      <Flex minH="$100vh" flexDir="column" bg="base.canvas.alt" pos="relative">
        <AppNavbar />
        <AppGrid flex={1}>
          <Flex
            flex={1}
            bg="base.canvas.alt"
            justifyItems="center"
            gridColumn={APP_GRID_COLUMN}
            maxW="57rem"
            width="100%"
          >
            {page}
          </Flex>
        </AppGrid>
      </Flex>
    </EnforceLoginStatePageWrapper>
  )
}
