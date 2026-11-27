import type { UseDisclosureReturn } from "@chakra-ui/react"
import type { PropsWithChildren } from "react"
import type { CmsSidebarItem } from "~/components/CmsSidebar/CmsSidebarItems"
import { Flex } from "@chakra-ui/react"
import { useRouter } from "next/router"
import { BiCog, BiFolder, BiGroup, BiHelpCircle, BiStar } from "react-icons/bi"
import { CmsContainer, CmsSidebar } from "~/components/CmsSidebar"
import { SearchableHeader } from "~/components/SearchableHeader"
import { useCanUsePolyglot } from "~/hooks/useCanUsePolyglot"
import { useIsUserIsomerAdmin } from "~/hooks/useIsUserIsomerAdmin"
import { IsomerAdminRole } from "~prisma/generated/generatedEnums"

import { OpenSidebarIcon } from "../Svg/OpenSidebarIcon"
import { PolyglotIcon } from "../Svg/PolyglotIcon"

interface CmsContainerWrapperProps {
  siteId: string
  sidenav?: React.ReactElement
  onSidenavOpen?: UseDisclosureReturn["onOpen"]
  variant?: "gsib" | "basic"
}

export const CmsContainerWrapper = ({
  siteId,
  sidenav,
  onSidenavOpen,
  children,
  variant,
}: PropsWithChildren<CmsContainerWrapperProps>) => {
  const router = useRouter()

  const { isAdmin: isUserIsomerAdmin } = useIsUserIsomerAdmin({
    roles: [IsomerAdminRole.Core, IsomerAdminRole.Migrator],
  })
  const canUsePolyglot = useCanUsePolyglot(Number(siteId))

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
      href: `/sites/${siteId}/settings/agency`,
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
    ...(canUsePolyglot
      ? [
          {
            icon: PolyglotIcon,
            label: "Polyglot Studio",
            // Mints a Polyglot SSO token server-side, then redirects
            href: `/api/polyglot/sso?siteId=${siteId}`,
            isExternal: true,
            // Let Polyglot see the request came from Studio (origin only,
            // per the global strict-origin-when-cross-origin policy)
            rel: "noopener",
          },
        ]
      : []),
    {
      icon: BiHelpCircle,
      label: "Get support",
      href: "https://support.isomer.gov.sg",
      isExternal: true,
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
        variant={variant}
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
