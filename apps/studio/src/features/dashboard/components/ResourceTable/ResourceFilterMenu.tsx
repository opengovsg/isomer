import type { ResourceStatusFilterOption } from "~/schemas/resource"
import { HStack, Text } from "@chakra-ui/react"
import { Menu } from "@opengovsg/design-system-react"
import { BiCheckbox, BiCheckboxChecked } from "react-icons/bi"

import { RESOURCE_TABLE_STATUS_FILTER_OPTIONS } from "./constants"

interface ResourceFilterMenuProps {
  value: ResourceStatusFilterOption[]
  onChange: (value: ResourceStatusFilterOption[]) => void
}

export const ResourceFilterMenu = ({
  value,
  onChange,
}: ResourceFilterMenuProps): JSX.Element => {
  const toggleOption = (option: ResourceStatusFilterOption) => {
    onChange(
      value.includes(option)
        ? value.filter((tag) => tag !== option)
        : [...value, option],
    )
  }

  return (
    <HStack>
      <Text textStyle="caption-1" color="base.content.default">
        Filter by:
      </Text>
      <Menu size="sm" variant="clear" closeOnSelect={false}>
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
              {value.length === 0 ? "All" : `${value.length} selected`}
            </Menu.Button>
            <Menu.List pt="0.75rem" pb="0.5rem">
              <Menu.Item
                icon={
                  value.length === 0 ? <BiCheckboxChecked /> : <BiCheckbox />
                }
                onClick={() => onChange([])}
              >
                All
              </Menu.Item>
              <Menu.Divider />
              {Object.entries(RESOURCE_TABLE_STATUS_FILTER_OPTIONS).map(
                ([option, label]) => {
                  const isSelected = value.includes(
                    option as ResourceStatusFilterOption,
                  )
                  return (
                    <Menu.Item
                      key={option}
                      icon={isSelected ? <BiCheckboxChecked /> : <BiCheckbox />}
                      onClick={() =>
                        toggleOption(option as ResourceStatusFilterOption)
                      }
                    >
                      {label}
                    </Menu.Item>
                  )
                },
              )}
              <Menu.Divider />
              <Menu.Item
                isDisabled={value.length === 0}
                color="base.content.medium"
                onClick={() => onChange([])}
              >
                Clear filter
              </Menu.Item>
            </Menu.List>
          </>
        )}
      </Menu>
    </HStack>
  )
}
