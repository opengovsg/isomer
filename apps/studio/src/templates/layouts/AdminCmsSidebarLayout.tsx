import { useRouter } from "next/router"
import { Flex } from "@chakra-ui/react"
import { BiCog, BiFolder, BiGroup } from "react-icons/bi"

import type { CmsSidebarItem } from "~/components/CmsSidebar/CmsSidebarItems"
import { EnforceLoginStatePageWrapper } from "~/components/AuthWrappers"
import { CmsSidebar, CmsSidebarContainer } from "~/components/CmsSidebar"
import { type GetLayout } from "~/lib/types"

export const AdminCmsSidebarLayout: GetLayout = (page) => {
  const router = useRouter()
  const siteId = String(router.query.siteId)

  const navItems: CmsSidebarItem[] = [
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

  return (
    <EnforceLoginStatePageWrapper>
      <Flex minH="$100vh" flexDir="row" bg="base.canvas.alt" pos="relative">
        <CmsSidebarContainer sidebar={<CmsSidebar navItems={navItems} />}>
          {page}
        </CmsSidebarContainer>
      </Flex>
    </EnforceLoginStatePageWrapper>
  )
}
