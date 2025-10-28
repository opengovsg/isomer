import type { UseDisclosureReturn } from "@chakra-ui/react"
import { useRouter } from "next/router"
import { VStack } from "@chakra-ui/react"
import { IconType } from "react-icons"
import { BiDirections, BiPaint, BiWrench } from "react-icons/bi"

import { CmsCollapsibleSidenav } from "~/components/CmsSidebar/CmsCollapsibleSidenav"
import { siteSchema } from "~/features/editing-experience/schema"
import { useQueryParse } from "~/hooks/useQueryParse"
import { HeaderRow } from "./components"
import { SettingsItem } from "./components/SettingsItem"

interface SettingsSidenavProps {
  onSidenavClose: UseDisclosureReturn["onClose"]
}

interface SideNavItem {
  header: {
    label: string
    icon: IconType
  }
  items: {
    label: string
    href: string
  }[]
}

export const SettingsSidenav = ({ onSidenavClose }: SettingsSidenavProps) => {
  const { siteId } = useQueryParse(siteSchema)
  const router = useRouter()

  const SIDENAV_ITEMS: SideNavItem[] = [
    {
      header: { label: "General", icon: BiWrench },
      items: [
        { label: "Name and agency", href: `/sites/${siteId}/settings/agency` },
        {
          label: "Notification banner",
          href: `/sites/${siteId}/settings/notification`,
        },
        {
          label: "Integrations",
          href: `/sites/${siteId}/settings/integrations`,
        },
      ],
    },
    {
      header: { label: "Navigation", icon: BiDirections },
      items: [
        {
          label: "Navigation menu",
          href: `/sites/${siteId}/settings/navbar`,
        },
        {
          label: "Footer",
          href: `/sites/${siteId}/settings/footer`,
        },
      ],
    },
    {
      header: { label: "Branding", icon: BiPaint },
      items: [
        {
          label: "Colours",
          href: `/sites/${siteId}/settings/colours`,
        },
        {
          label: "Logos and favicon",
          href: `/sites/${siteId}/settings/logo`,
        },
      ],
    },
  ]

  return (
    <CmsCollapsibleSidenav
      title="Site settings"
      onSidenavClose={onSidenavClose}
    >
      {SIDENAV_ITEMS.map(({ header, items }) => {
        return (
          <VStack align="start">
            <HeaderRow {...header} />
            <VStack
              borderLeft="1px solid"
              borderColor="base.divider.medium"
              px="0.75rem"
              align="start"
              w="100%"
            >
              {items.map((item) => (
                <SettingsItem
                  {...item}
                  isActive={router.asPath === item.href}
                  key={item.href}
                />
              ))}
            </VStack>
          </VStack>
        )
      })}
    </CmsCollapsibleSidenav>
  )
}
