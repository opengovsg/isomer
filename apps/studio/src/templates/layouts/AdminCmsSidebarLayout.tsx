import type { PropsWithChildren } from "react"
import { useRouter } from "next/router"
import { Flex } from "@chakra-ui/react"
import { BiCog, BiFolder, BiLogOut, BiStar } from "react-icons/bi"
import { LuUsers } from "react-icons/lu"
import { z } from "zod"

import type { CmsSidebarItem } from "~/components/CmsSidebar/CmsSidebarItems"
import { EnforceLoginStatePageWrapper } from "~/components/AuthWrappers"
import { CmsContainer, CmsSidebar } from "~/components/CmsSidebar"
import { LayoutHead } from "~/components/LayoutHead"
import { SearchableHeader } from "~/components/SearchableHeader"
import { DirectorySidebar } from "~/features/dashboard/components/DirectorySidebar"
import { useMe } from "~/features/me/api"
import { useIsUserIsomerAdmin } from "~/hooks/useIsUserIsomerAdmin"
import { useQueryParse } from "~/hooks/useQueryParse"
import { type GetLayout } from "~/lib/types"

export const AdminCmsSearchableLayout: GetLayout = (page) => {
  return (
    <EnforceLoginStatePageWrapper>
      <LayoutHead />
      <Flex
        flex={1}
        overflow="hidden"
        flexDir="row"
        bg="base.canvas.alt"
        pos="relative"
      >
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
  const isUserIsomerAdmin = useIsUserIsomerAdmin()

  const pageNavItems: CmsSidebarItem[] = [
    {
      icon: BiFolder,
      label: "Site content",
      href: `/sites/${siteId}`,
      isActive:
        router.asPath === `/sites/${siteId}` ||
        router.asPath.startsWith(`/sites/${siteId}/pages`),
    },
    // TODO: find another icon for users
    { icon: LuUsers, label: "Users", href: `/sites/${siteId}/users` },
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
    <CmsContainer
      sidebar={
        <CmsSidebar topNavItems={pageNavItems} bottomNavItems={userNavItems} />
      }
      sidenav={<DirectorySidebar siteId={siteId} />}
      header={<SearchableHeader siteId={siteId} />}
    >
      {children}
    </CmsContainer>
  )
}
