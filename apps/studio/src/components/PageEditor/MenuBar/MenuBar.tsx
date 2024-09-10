import type { MenuButtonProps, MenuListProps } from "@chakra-ui/react"
import type { IconType } from "react-icons/lib"
import {
  Box,
  Divider,
  HStack,
  Icon,
  Popover,
  PopoverBody,
  PopoverContent,
  PopoverTrigger,
  Text,
  VStack,
} from "@chakra-ui/react"
import { Button, Menu } from "@opengovsg/design-system-react"
import { BiChevronDown, BiChevronUp } from "react-icons/bi"

import { MenuItem } from "../MenuItem"

export interface MenuBarItem {
  type: "item"
  title: string
  icon?: IconType
  textStyle?: string
  useSecondaryColor?: boolean
  leftItem?: JSX.Element
  action: () => void
  isActive?: () => boolean
  isHidden?: () => boolean
}

export interface MenuBarDivider {
  type: "divider"
  isHidden?: () => boolean
}

export interface MenuBarVerticalList {
  type: "vertical-list"
  buttonWidth: MenuButtonProps["width"]
  menuWidth: MenuListProps["width"]
  defaultTitle: string
  items: MenuBarItem[]
  isHidden?: () => boolean
}

export interface MenuBarHorizontalList {
  type: "horizontal-list"
  label: string
  defaultIcon: IconType
  items: MenuBarItem[]
  isHidden?: () => boolean
}

export interface MenuBarDetailedItem {
  name: string
  description: string
  icon: IconType
  action: () => void
  isHidden?: () => boolean
}

export interface MenuBarDetailedList {
  type: "detailed-list"
  label: string
  icon: IconType
  items: MenuBarDetailedItem[]
  isHidden?: () => boolean
}

export type MenuBarEntry =
  | MenuBarDivider
  | MenuBarVerticalList
  | MenuBarHorizontalList
  | MenuBarDetailedList
  | MenuBarItem

export const MenuBar = ({ items }: { items: MenuBarEntry[] }) => {
  return (
    <HStack
      bgColor="base.canvas.alt"
      flex="0 0 auto"
      flexWrap="wrap"
      pl="0.75rem"
      pr="0.25rem"
      py="0.25rem"
      w="100%"
      borderBottom="1px solid"
      borderColor="base.divider.strong"
      borderTopRadius="0.25rem"
      spacing="0.25rem"
    >
      {items.map((item, index) => (
        <>
          {item.type === "divider" && !item.isHidden?.() && (
            <Divider
              key={index}
              orientation="vertical"
              borderColor="base.divider.strong"
              h="1.25rem"
              mx="0.25rem"
            />
          )}

          {item.type === "vertical-list" && !item.isHidden?.() && (
            <Menu key={index}>
              {({ isOpen }) => {
                const activeItem = item.items.find((subItem) =>
                  subItem.isActive?.(),
                )

                return (
                  <>
                    <Menu.Button
                      variant="clear"
                      colorScheme="grey"
                      isOpen={isOpen}
                      size="lg"
                      pl="0.375rem"
                      pr="0.75rem"
                      py="0.75rem"
                      w={item.buttonWidth}
                    >
                      {activeItem?.title || item.defaultTitle}
                    </Menu.Button>

                    <Menu.List w={item.menuWidth}>
                      {item.items.map((subItem) => (
                        <Menu.Item onClick={subItem.action}>
                          {subItem.leftItem}
                          {subItem.title && !subItem.icon && (
                            <Text
                              textStyle={subItem.textStyle}
                              fontWeight={
                                subItem.textStyle !== "body-1" ? 400 : undefined
                              }
                              color="chakra-body-text"
                            >
                              {subItem.title}
                            </Text>
                          )}
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
          )}

          {item.type === "horizontal-list" && (
            <Popover placement="bottom" key={index}>
              {({ isOpen }) => (
                <>
                  <PopoverTrigger>
                    <HStack>
                      <Button
                        _hover={{ bg: "gray.100" }}
                        _active={{ bg: "gray.200" }}
                        bgColor="transparent"
                        border="none"
                        h="1.75rem"
                        px={0}
                        py="0.25rem"
                        aria-label={item.label}
                      >
                        <HStack spacing={0}>
                          <Icon
                            as={item.defaultIcon}
                            fontSize="1.25rem"
                            color="base.content.medium"
                          />
                          <Icon
                            as={isOpen ? BiChevronUp : BiChevronDown}
                            fontSize="1.25rem"
                            color="base.content.medium"
                          />
                        </HStack>
                      </Button>
                    </HStack>
                  </PopoverTrigger>
                  <PopoverContent w="5.75rem">
                    <PopoverBody>
                      <HStack>
                        {item.items.map((subItem) => (
                          <MenuItem
                            icon={subItem.icon}
                            title={subItem.title}
                            action={subItem.action}
                            isActive={subItem.isActive}
                          />
                        ))}
                      </HStack>
                    </PopoverBody>
                  </PopoverContent>
                </>
              )}
            </Popover>
          )}

          {item.type === "detailed-list" && !item.isHidden?.() && (
            <Popover placement="bottom" offset={[0, 16]} key={index}>
              <PopoverTrigger>
                <Button
                  _hover={{ bg: "gray.100" }}
                  _active={{ bg: "gray.200" }}
                  bgColor="transparent"
                  border="none"
                  h="1.75rem"
                  w="1.75rem"
                  minH="1.75rem"
                  minW="1.75rem"
                  p={0}
                  aria-label={item.label}
                >
                  <Icon
                    as={item.icon}
                    fontSize="1.25rem"
                    color="base.content.medium"
                  />
                </Button>
              </PopoverTrigger>
              <PopoverContent>
                <PopoverBody px={0} py="0.75rem">
                  <VStack spacing="0.75rem">
                    {item.items.map(
                      (subItem) =>
                        !subItem.isHidden?.() && (
                          <Button
                            onClick={subItem.action}
                            variant="clear"
                            colorScheme="neutral"
                            border="none"
                            h="fit-content"
                            w="100%"
                            textAlign="left"
                            px={0}
                            py="0.25rem"
                            aria-label={item.label}
                            borderRadius={0}
                            _hover={{ bg: "base.canvas.brand-subtle" }}
                          >
                            <HStack
                              w="100%"
                              px="1rem"
                              py="0.75rem"
                              spacing="0.75rem"
                              alignItems="flex-start"
                            >
                              <Icon
                                as={subItem.icon}
                                fontSize="3rem"
                                borderWidth="1px"
                                borderStyle="solid"
                              />
                              <Box>
                                <Text textStyle="subhead-2" mb="0.25rem">
                                  {subItem.name}
                                </Text>
                                <Text textStyle="body-2">
                                  {subItem.description}
                                </Text>
                              </Box>
                            </HStack>
                          </Button>
                        ),
                    )}
                  </VStack>
                </PopoverBody>
              </PopoverContent>
            </Popover>
          )}

          {item.type === "item" && !item.isHidden?.() && (
            <MenuItem key={index} {...item} />
          )}
        </>
      ))}
    </HStack>
  )
}
