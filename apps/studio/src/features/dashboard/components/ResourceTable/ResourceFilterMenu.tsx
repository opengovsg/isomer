import type { ResourceStatusFilterOption } from "~/schemas/resource"
import { HStack, Icon, Text } from "@chakra-ui/react"
import { Menu } from "@opengovsg/design-system-react"

import { RESOURCE_TABLE_STATUS_FILTER_OPTIONS } from "./constants"

// Decorative only — the parent Menu.Item's onClick drives the toggle. Raw SVG
// instead of the design system's Checkbox, whose label padding wraps long labels.
const FilterCheckbox = ({ isChecked }: { isChecked: boolean }) => (
  <Icon viewBox="0 0 16 16" boxSize="1rem" flexShrink={0}>
    {isChecked ? (
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M2.66667 0C1.19391 0 0 1.19391 0 2.66667V13.3333C0 14.8061 1.19391 16 2.66667 16H13.3333C14.8061 16 16 14.8061 16 13.3333V2.66667C16 1.19391 14.8061 0 13.3333 0H2.66667ZM4.47144 8.19539L6.66677 10.3907L12.1954 4.86205L13.1381 5.80472L6.66677 12.2761L3.52878 9.13805L4.47144 8.19539Z"
        fill="var(--chakra-colors-interaction-main-default)"
      />
    ) : (
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M2.66667 1.33333C1.93029 1.33333 1.33333 1.93029 1.33333 2.66667V13.3333C1.33333 14.0697 1.93029 14.6667 2.66667 14.6667H13.3333C14.0697 14.6667 14.6667 14.0697 14.6667 13.3333V2.66667C14.6667 1.93029 14.0697 1.33333 13.3333 1.33333H2.66667ZM2.66667 0C1.19391 0 0 1.19391 0 2.66667V13.3333C0 14.8061 1.19391 16 2.66667 16H13.3333C14.8061 16 16 14.8061 16 13.3333V2.66667C16 1.19391 14.8061 0 13.3333 0H2.66667Z"
        fill="var(--chakra-colors-base-content-strong)"
      />
    )}
  </Icon>
)

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
