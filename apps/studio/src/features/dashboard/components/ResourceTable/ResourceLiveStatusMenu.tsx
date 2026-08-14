import type { ResourceLiveStatus } from "~/schemas/resource"
import { HStack, Text } from "@chakra-ui/react"
import { Menu } from "@opengovsg/design-system-react"

import { RESOURCE_TABLE_LIVE_STATUS_OPTIONS } from "./constants"

interface ResourceLiveStatusMenuProps {
  value: "all" | ResourceLiveStatus
  onChange: (option: "all" | ResourceLiveStatus) => void
}

export const ResourceLiveStatusMenu = ({
  value,
  onChange,
}: ResourceLiveStatusMenuProps): JSX.Element => (
  <HStack>
    <Text textStyle="caption-1" color="base.content.default">
      Status:
    </Text>
    <Menu size="sm" variant="clear">
      {({ isOpen }) => (
        <>
          <Menu.Button
            variant="clear"
            size="sm"
            p="0"
            minH="auto"
            colorScheme="sub"
            fontSize="0.75rem"
            isOpen={isOpen}
          >
            {RESOURCE_TABLE_LIVE_STATUS_OPTIONS[value]}
          </Menu.Button>
          <Menu.List pt="0.75rem" pb="0.5rem">
            {Object.entries(RESOURCE_TABLE_LIVE_STATUS_OPTIONS).map(
              ([option, label]) => (
                <Menu.Item
                  key={option}
                  onClick={() => onChange(option as "all" | ResourceLiveStatus)}
                >
                  {label}
                </Menu.Item>
              ),
            )}
          </Menu.List>
        </>
      )}
    </Menu>
  </HStack>
)
