import Link from "next/link"
import { useRouter } from "next/router"
import {
  BreadcrumbItem,
  BreadcrumbLink,
  Button,
  Flex,
  HStack,
  Menu,
} from "@chakra-ui/react"
import {
  AvatarMenu,
  AvatarMenuDivider,
  Breadcrumb,
} from "@opengovsg/design-system-react"
import { BiLinkExternal } from "react-icons/bi"

import { ADMIN_NAVBAR_HEIGHT } from "~/constants/layouts"
import { useMe } from "~/features/me/api"
import { useQueryParse } from "~/hooks/useQueryParse"
import { DASHBOARD, SETTINGS_PROFILE } from "~/lib/routes"
import { editPageSchema } from "../schema"

export const SiteEditNavbar = (): JSX.Element => {
  const { siteId } = useQueryParse(editPageSchema)
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
      </Flex>
    </Flex>
  )
}
