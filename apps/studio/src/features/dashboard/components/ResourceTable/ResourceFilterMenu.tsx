import type { ResourceStatusFilterOption } from "~/schemas/resource"
import { Box, HStack, Icon, Text, useMultiStyleConfig } from "@chakra-ui/react"
import { BxCheckAnimated, Menu } from "@opengovsg/design-system-react"

import { RESOURCE_TABLE_STATUS_FILTER_OPTIONS } from "./constants"

// Decorative only — the surrounding Menu.Item's onClick drives the actual
// toggle. Renders just the design system Checkbox's `control`/`icon` parts
// (skipping `container`/`label`, whose padding doesn't collapse to zero even
// with no label and was eating into the row's width, wrapping longer option
// labels onto two lines) — same pattern as MultiSelect's ItemCheckboxIcon.
const FilterCheckbox = ({ isChecked }: { isChecked: boolean }) => {
  const styles = useMultiStyleConfig("Checkbox", { size: "sm" })
  return (
    <Box __css={styles.control} flexShrink={0}>
      <Icon as={BxCheckAnimated} __css={styles.icon} isChecked={isChecked} />
    </Box>
  )
}

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
            <Menu.List minW="13.3125rem" py="0.5rem">
              <Menu.Item
                gap="0.75rem"
                px="0.75rem"
                py="0.5rem"
                onClick={() => onChange([])}
              >
                <FilterCheckbox isChecked={value.length === 0} />
                <Text textStyle="body-2" color="base.content.strong">
                  All
                </Text>
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
                      gap="0.75rem"
                      px="0.75rem"
                      py="0.5rem"
                      onClick={() =>
                        toggleOption(option as ResourceStatusFilterOption)
                      }
                    >
                      <FilterCheckbox isChecked={isSelected} />
                      <Text textStyle="body-2" color="base.content.strong">
                        {label}
                      </Text>
                    </Menu.Item>
                  )
                },
              )}
              <Menu.Divider />
              <Menu.Item
                px="0.75rem"
                py="0.5rem"
                isDisabled={value.length === 0}
                onClick={() => onChange([])}
              >
                <Text
                  textStyle="body-2"
                  color={
                    value.length === 0
                      ? "interaction.support.disabled-content"
                      : "base.content.strong"
                  }
                >
                  Clear filter
                </Text>
              </Menu.Item>
            </Menu.List>
          </>
        )}
      </Menu>
    </HStack>
  )
}
