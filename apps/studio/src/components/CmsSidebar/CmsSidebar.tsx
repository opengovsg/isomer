import { VStack } from "@chakra-ui/react"

import type { CmsSidebarItem } from "./CmsSidebarItems"
import { CmsSidebarItems } from "./CmsSidebarItems"

const DEFAULT_NAV_ITEMS: CmsSidebarItem[] = []

interface CmsSidebarProps {
  topNavItems?: CmsSidebarItem[]
  bottomNavItems?: CmsSidebarItem[]
}

export const CmsSidebar = ({
  topNavItems = DEFAULT_NAV_ITEMS,
  bottomNavItems = DEFAULT_NAV_ITEMS,
}: CmsSidebarProps) => 
  (
    <VStack spacing="0.75rem" as="nav" justify="space-between" height="100%">
      <VStack spacing="0.75rem">
        <CmsSidebarItems navItems={topNavItems} />
      </VStack>
      <CmsSidebarItems navItems={bottomNavItems} />
    </VStack>
  )

