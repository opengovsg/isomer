import { Flex, Text } from "@chakra-ui/react"
import { Link } from "@opengovsg/design-system-react"

import { SiteList } from "~/features/dashboard/SiteList"
import { type NextPageWithLayout } from "~/lib/types"
import { AdminLayout } from "~/templates/layouts/AdminLayout"

const DashboardPage: NextPageWithLayout = () => {
  return (
    <Flex flexDir="column" py="2rem" maxW="57rem" mx="auto" width="100%">
      <Flex gap="0.75rem" flexDirection="column">
        <Text as="h3" size="lg" textStyle="h3">
          My sites
        </Text>
        <Text textStyle="body-2">
          Don't see a site here?{" "}
          <Link variant="inline" href="mailto:support@isomer.gov.sg">
            Let us know
          </Link>
          .
        </Text>
        <SiteList />
      </Flex>
    </Flex>
  )
}

DashboardPage.getLayout = AdminLayout

export default DashboardPage
