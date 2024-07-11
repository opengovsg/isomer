import Image from "next/image"
import NextLink from "next/link"
import { VStack } from "@chakra-ui/react"
import { IconButton } from "@opengovsg/design-system-react"

import type { CmsSidebarItem } from "./CmsSidebarItems"
import { DASHBOARD } from "~/lib/routes"
import CmsSidebarItems from "./CmsSidebarItems"

export interface CmsSidebarProps {
  navItems: CmsSidebarItem[]
}

export function CmsSidebar({ navItems }: CmsSidebarProps) {
  return (
    <VStack spacing="0.75rem" as="nav">
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
      <CmsSidebarItems navItems={navItems} />
    </VStack>
  )
}

export default CmsSidebar
