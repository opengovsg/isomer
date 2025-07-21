import type { PropsWithChildren } from "react"
import { useRouter } from "next/router"
import { Flex } from "@chakra-ui/react"
import { BiCog, BiFolder, BiLogOut, BiStar } from "react-icons/bi"
import { PiUsersBold } from "react-icons/pi"

import type { CmsSidebarItem } from "~/components/CmsSidebar/CmsSidebarItems"
import { EnforceLoginStatePageWrapper } from "~/components/AuthWrappers"
import { CmsSidebar, CmsSidebarContainer } from "~/components/CmsSidebar"
import { LayoutHead } from "~/components/LayoutHead"
import { SearchableHeader } from "~/components/SearchableHeader"
import { siteSchema } from "~/features/editing-experience/schema"
import { useMe } from "~/features/me/api"
import { useIsUserIsomerAdmin } from "~/hooks/useIsUserIsomerAdmin"
import { useQueryParse } from "~/hooks/useQueryParse"
import { ADMIN_ROLE } from "~/lib/growthbook"
import { type GetLayout } from "~/lib/types"

export const AdminSidebarOnlyLayout: GetLayout = (page) => {
  return (
    <EnforceLoginStatePageWrapper>
      <LayoutHead />
      <Flex
        flex={1}
        flexDir="row"
        bg="base.canvas.alt"
        pos="relative"
        overflow="hidden"
      >
        <CmsSidebarWrapper>{page}</CmsSidebarWrapper>
      </Flex>
    </EnforceLoginStatePageWrapper>
  )
}

// Extracted out since this needs to be a child of EnforceLoginStatePageWrapper
const CmsSidebarWrapper = ({ children }: PropsWithChildren) => {
  const router = useRouter()
  const { siteId } = useQueryParse(siteSchema)

  const { logout } = useMe()
  const isUserIsomerAdmin = useIsUserIsomerAdmin({
    roles: [ADMIN_ROLE.CORE, ADMIN_ROLE.MIGRATORS],
  })

  const pageNavItems: CmsSidebarItem[] = [
    {
      icon: BiFolder,
      label: "Site content",
      href: `/sites/${siteId}`,
      isActive:
        router.asPath === `/sites/${siteId}` ||
        router.asPath.startsWith(`/sites/${siteId}/pages`),
    },
    {
      icon: PiUsersBold,
      label: "Collaborators",
      href: `/sites/${siteId}/users`,
    },
    { icon: BiCog, label: "Settings", href: `/sites/${siteId}/settings` },
    ...(isUserIsomerAdmin
      ? [
          {
            icon: BiStar,
            label: "Isomer Admin Settings",
            href: `/sites/${siteId}/admin`,
          },
        ]
      : []),
  ]

  const userNavItems: CmsSidebarItem[] = [
    // TODO(ISOM-1552): Add back view live site functionality when implemented
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
      header={<SearchableHeader siteId={siteId} />}
    >
      {children}
    </CmsSidebarContainer>
  )
}
