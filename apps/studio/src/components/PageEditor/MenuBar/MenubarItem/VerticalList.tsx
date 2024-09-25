import { Flex, Text } from "@chakra-ui/react"
import { Menu } from "@opengovsg/design-system-react"

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
              isOpen={isOpen}
              variant="clear"
              colorScheme="neutral"
              pl="0.375rem"
              pr="0.75rem"
              py="0.75rem"
              fontSize="0.75rem"
              fontWeight={400}
              lineHeight="1rem"
              minW="9rem"
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
                        textStyle="body-2"
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
