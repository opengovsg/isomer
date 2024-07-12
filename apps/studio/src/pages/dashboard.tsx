import { Box, Flex } from "@chakra-ui/react"

import Suspense from "~/components/Suspense"
import {
  ADMIN_NAVBAR_HEIGHT,
  APP_GRID_COLUMN,
  APP_GRID_TEMPLATE_COLUMN,
} from "~/constants/layouts"
import { type NextPageWithLayout } from "~/lib/types"
import { AppGrid } from "~/templates/AppGrid"
import { AdminLayout } from "~/templates/layouts/AdminLayout"

const Home: NextPageWithLayout = () => {
  return (
    <Flex
      w="100%"
      flexDir="column"
      position={{ base: "absolute", sm: "inherit" }}
      left={{ base: 0, sm: undefined }}
      minH={`calc(100% - ${ADMIN_NAVBAR_HEIGHT})`}
    >
      Hello
    </Flex>
  )
}

Home.getLayout = AdminLayout

export default Home
