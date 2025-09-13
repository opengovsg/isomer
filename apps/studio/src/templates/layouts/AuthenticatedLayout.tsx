import { Flex } from "@chakra-ui/react"

import { AppNavbar } from "~/components/AppNavbar"
import { EnforceLoginStatePageWrapper } from "~/components/AuthWrappers"
import { LayoutHead } from "~/components/LayoutHead"
import { APP_GRID_COLUMN } from "~/constants/layouts"
import { type GetLayout } from "~/lib/types"
import { AppGrid } from "../AppGrid"

export const AuthenticatedLayout: GetLayout = (page) => {
  return (
    <EnforceLoginStatePageWrapper>
      <LayoutHead />

      <Flex flex={1} flexDir="column" bg="base.canvas.alt" pos="relative">
        <AppNavbar />
        <AppGrid flex={1}>
          <Flex
            flex={1}
            bg="base.canvas.alt"
            justifyItems="center"
            gridColumn={APP_GRID_COLUMN}
            width="100%"
          >
            {page}
          </Flex>
        </AppGrid>
      </Flex>
    </EnforceLoginStatePageWrapper>
  )
}
