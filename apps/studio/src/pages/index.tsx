import { Flex, Text } from "@chakra-ui/react"

import { OutdatedBrowserWarning } from "~/components/OutdatedBrowserWarning"
import { SiteList } from "~/features/dashboard/SiteList"
import { type NextPageWithLayout } from "~/lib/types"
import { AdminLayout } from "~/templates/layouts/AdminLayout"

const DashboardPage: NextPageWithLayout = () => {
  return (
    <>
      <Flex flexDir="column" py="2rem" maxW="57rem" mx="auto" width="100%">
        <OutdatedBrowserWarning mb="2rem" />
        <Flex flexDirection="column">
          <Text as="h3" size="lg" textStyle="h3">
            My sites
          </Text>
          <SiteList />
        </Flex>
      </Flex>
    </>
  )
}

DashboardPage.getLayout = AdminLayout

export default DashboardPage
