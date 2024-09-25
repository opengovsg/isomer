import { Flex, Text } from "@chakra-ui/react"
import { Button, Menu } from "@opengovsg/design-system-react"

import type { MenubarNestedItem } from "./types"
import { MenuItem } from "../../MenuItem"

export interface MenubarVerticalListProps {
  type: "vertical-list"
  defaultTitle: string
  items: MenubarNestedItem[]
  isHidden?: () => boolean
}

export const MenubarVerticalList = ({
  isHidden,
  items,
  defaultTitle,
}: MenubarVerticalListProps): JSX.Element | null => {
  if (isHidden?.()) {
    return null
  }
  return (
    <Menu>
      {({ isOpen }) => {
        const activeItem = items.find((subItem) => subItem.isActive?.())

        return (
          <>
            <Menu.Button
              as={Button}
              isOpen={isOpen}
              variant="clear"
              colorScheme="sub"
              textAlign="start"
              sx={{
                _hover: {
                  bg: "interaction.tinted.neutral.hover",
                },
              }}
              p={0}
              height="fit-content"
              minH="1.75rem"
              fontSize="0.75rem"
              fontWeight={400}
              lineHeight="1rem"
              minW="7.75rem"
              _expanded={{
                bg: "interaction.muted.main.active",
              }}
            >
              {activeItem?.title || defaultTitle}
            </Menu.Button>

            <Menu.List width="12.25rem">
              {items.map((subItem, index) => (
                <Menu.Item key={index} onClick={subItem.action}>
                  {subItem.leftItem}
                  <Flex flexDirection="column">
                    {subItem.title && !subItem.icon && (
                      <Text
                        textStyle="body-2"
                        color="base.content.strong"
                        fontWeight={subItem.isActive?.() ? 500 : undefined}
                      >
                        {subItem.title}
                      </Text>
                    )}
                    {subItem.description && (
                      <Text
                        wordBreak="break-word"
                        color="base.content.medium"
                        textStyle="caption-2"
                      >
                        {subItem.description}
                      </Text>
                    )}
                  </Flex>
                  {subItem.icon && (
                    <MenuItem
                      icon={subItem.icon}
                      title={subItem.title}
                      action={subItem.action}
                      isActive={subItem.isActive}
                    />
                  )}
                </Menu.Item>
              ))}
            </Menu.List>
          </>
        )
      }}
    </Menu>
  )
}
