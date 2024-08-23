import type { PropsWithChildren } from "react"
import { useRouter } from "next/router"
import { Flex } from "@chakra-ui/react"
import {
  BiCog,
  BiFolder,
  BiGroup,
  BiHelpCircle,
  BiLinkExternal,
  BiLogOut,
} from "react-icons/bi"

import type { CmsSidebarItem } from "~/components/CmsSidebar/CmsSidebarItems"
import { EnforceLoginStatePageWrapper } from "~/components/AuthWrappers"
import { CmsSidebar, CmsSidebarOnlyContainer } from "~/components/CmsSidebar"
import { useMe } from "~/features/me/api"
import { type GetLayout } from "~/lib/types"

export const AdminSidebarOnlyLayout: GetLayout = (page) => {
  return (
    <EnforceLoginStatePageWrapper>
      <Flex minH="$100vh" flexDir="row" bg="base.canvas.alt" pos="relative">
        <CmsSidebarWrapper>{page}</CmsSidebarWrapper>
      </Flex>
    </EnforceLoginStatePageWrapper>
  )
}

// Extracted out since this needs to be a child of EnforceLoginStatePageWrapper
const CmsSidebarWrapper = ({ children }: PropsWithChildren) => {
  const router = useRouter()
  const siteId = String(router.query.siteId)

  const { logout } = useMe()

  const pageNavItems: CmsSidebarItem[] = [
    {
      icon: BiFolder,
      label: "Team spaces",
      href: `/sites/${siteId}`,
      isActive:
        router.asPath === `/sites/${siteId}` ||
        router.asPath.startsWith(`/sites/${siteId}/pages`),
    },
    { icon: BiGroup, label: "Manage users", href: `/sites/${siteId}/manage` },
    { icon: BiCog, label: "Settings", href: `/sites/${siteId}/settings` },
  ]

  const userNavItems: CmsSidebarItem[] = [
    {
      icon: BiLinkExternal,
      label: "Open live site",
      // TOOD: Replace with actual live site URL
      href: `/home`,
    },
    {
      icon: BiHelpCircle,
      label: "Isomer Guide ",
      href: "https://guide.isomer.gov.sg/",
    },
    {
      icon: BiLogOut,
      label: "Sign out",
      onClick: logout,
    },
  ]

  return (
    <CmsSidebarOnlyContainer
      sidebar={
        <CmsSidebar topNavItems={pageNavItems} bottomNavItems={userNavItems} />
      }
    >
      {children}
    </CmsSidebarOnlyContainer>
  )
}
