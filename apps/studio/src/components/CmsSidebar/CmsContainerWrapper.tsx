import type { UseDisclosureReturn } from "@chakra-ui/react"
import type { PropsWithChildren } from "react"
import { useRouter } from "next/router"
import { Flex } from "@chakra-ui/react"
import { BiCog, BiFolder, BiGroup, BiHelpCircle, BiStar } from "react-icons/bi"

import type { CmsSidebarItem } from "~/components/CmsSidebar/CmsSidebarItems"
import { CmsContainer, CmsSidebar } from "~/components/CmsSidebar"
import { SearchableHeader } from "~/components/SearchableHeader"
import { useIsUserIsomerAdmin } from "~/hooks/useIsUserIsomerAdmin"
import { ADMIN_ROLE } from "~/lib/growthbook"
import { OpenSidebarIcon } from "../Svg/OpenSidebarIcon"

interface CmsContainerWrapperProps {
  siteId: string
  sidenav?: React.ReactElement
  onSidenavOpen?: UseDisclosureReturn["onOpen"]
}

export const CmsContainerWrapper = ({
  siteId,
  sidenav,
  onSidenavOpen,
  children,
}: PropsWithChildren<CmsContainerWrapperProps>) => {
  const router = useRouter()

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
      icon: BiGroup,
      label: "Collaborators",
      href: `/sites/${siteId}/users`,
    },
    {
      icon: BiCog,
      label: "Settings",
      href: `/sites/${siteId}/settings`,
      isActive: router.asPath.startsWith(`/sites/${siteId}/settings`),
    },
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
    ...(!!onSidenavOpen && !sidenav
      ? [
          {
            icon: OpenSidebarIcon,
            label: "Expand sidebar",
            onClick: onSidenavOpen,
          },
        ]
      : []),
    {
      icon: BiHelpCircle,
      label: "Get support",
      href: "https://support.isomer.gov.sg",
    },
  ]

  return (
    <Flex
      flex={1}
      overflow="hidden"
      flexDir="row"
      bg="base.canvas.alt"
      pos="relative"
    >
      <CmsContainer
        sidebar={
          <CmsSidebar
            topNavItems={pageNavItems}
            bottomNavItems={userNavItems}
          />
        }
        sidenav={sidenav}
        header={<SearchableHeader siteId={siteId} />}
      >
        {children}
      </CmsContainer>
    </Flex>
  )
}
