import { Flex, Text } from "@chakra-ui/react"

import { SiteList } from "~/features/dashboard/SiteList"
import { type NextPageWithLayout } from "~/lib/types"
import { AuthenticatedLayout } from "~/templates/layouts/AuthenticatedLayout"

const DashboardPage: NextPageWithLayout = () => {
  return (
    <Flex flexDir="column" py="2rem" maxW="57rem" mx="auto" width="100%">
      <Flex flexDirection="column">
        <Text as="h3" size="lg" textStyle="h3">
          Your sites
        </Text>
        <SiteList />
      </Flex>
    </Flex>
  )
}

DashboardPage.getLayout = AuthenticatedLayout

export default DashboardPage
