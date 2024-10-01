import type { PropsWithChildren } from "react"
import { useRouter } from "next/router"
import { Flex } from "@chakra-ui/react"
import { BiCog, BiFolder, BiHelpCircle, BiLogOut } from "react-icons/bi"
import { z } from "zod"

import type { CmsSidebarItem } from "~/components/CmsSidebar/CmsSidebarItems"
import { EnforceLoginStatePageWrapper } from "~/components/AuthWrappers"
import { CmsSidebar, CmsSidebarContainer } from "~/components/CmsSidebar"
import { CmsSideNav } from "~/components/CmsSidebar/CmsSideNav"
import { LayoutHead } from "~/components/LayoutHead"
import { useMe } from "~/features/me/api"
import { useQueryParse } from "~/hooks/useQueryParse"
import { type GetLayout } from "~/lib/types"

export const AdminCmsSidebarLayout: GetLayout = (page) => {
  return (
    <EnforceLoginStatePageWrapper>
      <LayoutHead />

      <Flex minH="$100vh" flexDir="row" bg="base.canvas.alt" pos="relative">
        <CmsSidebarWrapper>{page}</CmsSidebarWrapper>
      </Flex>
    </EnforceLoginStatePageWrapper>
  )
}

const siteSchema = z.object({
  siteId: z.coerce.string(),
})

// Extracted out since this needs to be a child of EnforceLoginStatePageWrapper
const CmsSidebarWrapper = ({ children }: PropsWithChildren) => {
  const router = useRouter()
  const { siteId } = useQueryParse(siteSchema)

  const { logout } = useMe()

  const pageNavItems: CmsSidebarItem[] = [
    {
      icon: BiFolder,
      label: "Site content",
      href: `/sites/${siteId}`,
      isActive:
        router.asPath === `/sites/${siteId}` ||
        router.asPath.startsWith(`/sites/${siteId}/pages`),
    },

    // TODO(ISOM-1552): Add back manage users functionality when implemented
    { icon: BiCog, label: "Settings", href: `/sites/${siteId}/settings` },
  ]

  const userNavItems: CmsSidebarItem[] = [
    // TODO(ISOM-1552): Add back view live site functionality when implemented
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
    <CmsSidebarContainer
      sidebar={
        <CmsSidebar topNavItems={pageNavItems} bottomNavItems={userNavItems} />
      }
      sidenav={<CmsSideNav siteId={siteId} />}
    >
      {children}
    </CmsSidebarContainer>
  )
}
