import type { UseDisclosureReturn } from "@chakra-ui/react"
import type { PropsWithChildren } from "react"
import { Flex, Text, Tooltip } from "@chakra-ui/react"
import { IconButton } from "@opengovsg/design-system-react"

import { CloseSidebarIcon } from "../Svg/CloseSidebarIcon"

interface CmsCollapsibleSidenavProps {
  title: string
  onSidenavClose: UseDisclosureReturn["onClose"]
}

export const CmsCollapsibleSidenav = ({
  title,
  onSidenavClose,
  children,
}: PropsWithChildren<CmsCollapsibleSidenavProps>) => {
  return (
    <Flex flexDir="column" px="1.25rem" py="1.5rem" gap="1.25rem">
      <Flex justify="space-between" align="center">
        <Text as="h2" textStyle="subhead-1">
          {title}
        </Text>

        <Tooltip label="Collapse sidebar" placement="right" gutter={20}>
          <IconButton
            variant="clear"
            aria-label="Collapse sidebar"
            h="1.25rem"
            minH="1.25rem"
            minW="1.25rem"
            icon={<CloseSidebarIcon />}
            onClick={onSidenavClose}
          />
        </Tooltip>
      </Flex>

      {children}
    </Flex>
  )
}
