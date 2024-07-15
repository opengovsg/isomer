import Image from "next/image"
import NextLink from "next/link"
import { VStack } from "@chakra-ui/react"
import { IconButton } from "@opengovsg/design-system-react"

import type { CmsSidebarItem } from "./CmsSidebarItems"
import { DASHBOARD } from "~/lib/routes"
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
        <IconButton
          as={NextLink}
          href={DASHBOARD}
          variant="clear"
          aria-label="Back to dashboard"
          icon={
            <Image
              src="/assets/isomer-logo-color.svg"
              height={24}
              width={22}
              alt="Back to dashboard"
              priority
            />
          }
        />
        <CmsSidebarItems navItems={topNavItems} />
      </VStack>
      <CmsSidebarItems navItems={bottomNavItems} />
    </VStack>
  )
}

export default CmsSidebar
