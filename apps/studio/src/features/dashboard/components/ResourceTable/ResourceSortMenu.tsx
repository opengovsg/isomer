import type { ResourceOrderByOption } from "~/schemas/resource"
import { HStack, Text } from "@chakra-ui/react"
import { Menu } from "@opengovsg/design-system-react"

import { RESOURCE_TABLE_SORT_OPTIONS } from "./constants"

interface ResourceSortMenuProps {
  value: ResourceOrderByOption
  onChange: (option: ResourceOrderByOption) => void
}

export const ResourceSortMenu = ({
  value,
  onChange,
}: ResourceSortMenuProps): JSX.Element => (
  <HStack>
    <Text textStyle="caption-1" color="base.content.default">
      Sort by:
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
            {RESOURCE_TABLE_SORT_OPTIONS[value]}
          </Menu.Button>
          <Menu.List pt="0.75rem" pb="0.5rem">
            {Object.entries(RESOURCE_TABLE_SORT_OPTIONS).map(
              ([option, label]) => (
                <Menu.Item
                  key={option}
                  onClick={() => onChange(option as ResourceOrderByOption)}
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
