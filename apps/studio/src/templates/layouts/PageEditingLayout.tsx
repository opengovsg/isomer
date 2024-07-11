import { Flex, Grid } from "@chakra-ui/react"

import { AppNavbar } from "~/components/AppNavbar"
import { EnforceLoginStatePageWrapper } from "~/components/AuthWrappers"
import { APP_GRID_TEMPLATE_AREA } from "~/constants/layouts"
import { EditorDrawerProvider } from "~/contexts/EditorDrawerContext"
import { type GetLayout } from "~/lib/types"

export const PageEditingLayout: GetLayout = (page) => {
  return (
    <EnforceLoginStatePageWrapper>
      <EditorDrawerProvider>
        <Flex minH="100vh" flexDir="column" bg="base.canvas.alt" pos="relative">
          <Grid
            flex={1}
            width="100vw"
            gridColumnGap={{ base: 0, md: "1rem" }}
            gridTemplate={APP_GRID_TEMPLATE_AREA}
          >
            <AppNavbar />
            <Flex flex={1} bg="base.canvas.alt" w="100vw">
              {page}
            </Flex>
          </Grid>
        </Flex>
      </EditorDrawerProvider>
    </EnforceLoginStatePageWrapper>
  )
}
