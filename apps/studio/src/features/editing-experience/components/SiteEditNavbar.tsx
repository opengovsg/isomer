import Link from "next/link"
import { BreadcrumbItem, BreadcrumbLink, Flex, TabList } from "@chakra-ui/react"
import { Breadcrumb, Tab } from "@opengovsg/design-system-react"

import { ADMIN_NAVBAR_HEIGHT } from "~/constants/layouts"
import { useQueryParse } from "~/hooks/useQueryParse"
import { editPageSchema } from "../schema"
import PublishButton from "./PublishButton"

export const SiteEditNavbar = (): JSX.Element => {
  const { siteId, pageId } = useQueryParse(editPageSchema)

  return (
    <Flex flex="0 0 auto" gridColumn="1/-1">
      <Flex
        h={ADMIN_NAVBAR_HEIGHT}
        pos="fixed"
        zIndex="docked"
        w="100%"
        justify="space-between"
        align="center"
        px={{ base: "1.5rem", md: "1.8rem", xl: "2rem" }}
        pl={{ base: `calc(1rem + ${ADMIN_NAVBAR_HEIGHT})`, sm: "1.5rem" }}
        py="0.375rem"
        bg="white"
        borderBottomWidth="1px"
        borderColor="base.divider.medium"
        transition="padding 0.1s"
      >
        <Breadcrumb size="xs">
          <BreadcrumbItem>
            <BreadcrumbLink as={Link} href={`/sites/${siteId}`}>
              All pages
            </BreadcrumbLink>
          </BreadcrumbItem>

          <BreadcrumbItem isCurrentPage>
            <BreadcrumbLink href="#">Current page</BreadcrumbLink>
          </BreadcrumbItem>
        </Breadcrumb>
        <TabList>
          <Tab>Edit</Tab>
          <Tab>Page Settings</Tab>
        </TabList>
        {pageId && siteId && (
          <Flex justifyContent={"end"} alignItems={"center"}>
            <PublishButton pageId={pageId} siteId={siteId} />
          </Flex>
        )}
      </Flex>
    </Flex>
  )
}
