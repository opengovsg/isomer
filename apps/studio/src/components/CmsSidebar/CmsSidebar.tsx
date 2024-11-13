import { VStack } from "@chakra-ui/react"

import type { CmsSidebarItem } from "./CmsSidebarItems"
import CmsSidebarItems from "./CmsSidebarItems"

export interface CmsSidebarProps {
  topNavItems?: CmsSidebarItem[]
  bottomNavItems?: CmsSidebarItem[]
}

export function CmsSidebar({
  topNavItems = [],
  bottomNavItems = [],
}: CmsSidebarProps) {
  return (
    <VStack spacing="0.75rem" as="nav" justify="space-between" height="100%">
      <VStack spacing="0.75rem">
        <CmsSidebarItems navItems={topNavItems} />
      </VStack>
      <CmsSidebarItems navItems={bottomNavItems} />
    </VStack>
  )
}

export default CmsSidebar
