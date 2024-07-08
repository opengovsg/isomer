import {
  Box,
  Divider,
  HStack,
  Icon,
  MenuButtonProps,
  MenuListProps,
  Popover,
  PopoverBody,
  PopoverContent,
  PopoverTrigger,
  Text,
  VStack,
} from "@chakra-ui/react"
import { Button, Menu } from "@opengovsg/design-system-react"
import { Editor } from "@tiptap/react"
import {
  BiBold,
  BiChevronDown,
  BiChevronUp,
  BiCodeAlt,
  BiFile,
  BiImageAdd,
  BiItalic,
  BiLink,
  BiListOl,
  BiListUl,
  BiPlus,
  BiRedo,
  BiStrikethrough,
  BiTable,
  BiUnderline,
  BiUndo,
} from "react-icons/bi"
import { IconType } from "react-icons/lib"
import { MdSubscript, MdSuperscript } from "react-icons/md"

import { MenuItem } from "./MenuItem"

interface MenuBarItem {
  type: "item"
  title: string
  icon?: IconType
  textStyle?: string
  useSecondaryColor?: boolean
  leftItem?: JSX.Element
  action: () => void
  isActive?: () => boolean
}

interface MenuBarDivider {
  type: "divider"
  isHidden?: boolean
}

interface MenuBarVerticalList {
  type: "vertical-list"
  buttonWidth: MenuButtonProps["width"]
  menuWidth: MenuListProps["width"]
  defaultTitle: string
  items: MenuBarItem[]
  isHidden?: boolean
}

interface MenuBarHorizontalList {
  type: "horizontal-list"
  label: string
  defaultIcon: IconType
  items: MenuBarItem[]
  isHidden?: boolean
}

interface MenuBarDetailedItem {
  name: string
  description: string
  icon: IconType
  action: () => void
  isHidden?: boolean
}

interface MenuBarDetailedList {
  type: "detailed-list"
  label: string
  icon: IconType
  items: MenuBarDetailedItem[]
  isHidden?: boolean
}

type MenuBarEntry =
  | MenuBarDivider
  | MenuBarVerticalList
  | MenuBarHorizontalList
  | MenuBarDetailedList
  | MenuBarItem

export const MenuBar = ({ editor }: { editor: Editor }) => {
  const items: MenuBarEntry[] = [
    {
      type: "vertical-list",
      buttonWidth: "9rem",
      menuWidth: "19rem",
      defaultTitle: "Heading 1",
      items: [
        {
          type: "item",
          title: "Title",
          textStyle: "h1",
          useSecondaryColor: true,
          action: () =>
            editor.chain().focus().toggleHeading({ level: 1 }).run(),
          isActive: () => editor.isActive("heading", { level: 1 }),
        },
        {
          type: "item",
          title: "Heading 1",
          textStyle: "h2",
          useSecondaryColor: true,
          action: () =>
            editor.chain().focus().toggleHeading({ level: 2 }).run(),
          isActive: () => editor.isActive("heading", { level: 2 }),
        },
        {
          type: "item",
          title: "Heading 2",
          textStyle: "h3",
          useSecondaryColor: true,
          action: () =>
            editor.chain().focus().toggleHeading({ level: 3 }).run(),
          isActive: () => editor.isActive("heading", { level: 3 }),
        },
        {
          type: "item",
          title: "Heading 3",
          textStyle: "h4",
          useSecondaryColor: true,
          action: () =>
            editor.chain().focus().toggleHeading({ level: 4 }).run(),
          isActive: () => editor.isActive("heading", { level: 4 }),
        },
        {
          type: "item",
          title: "Quote block",
          textStyle: "body-1",
          useSecondaryColor: true,
          leftItem: (
            <Divider
              orientation="vertical"
              border="1px solid"
              borderColor="chakra-body-text"
              h="1.625rem"
              mr="0.75rem"
            />
          ),
          action: () => editor.chain().focus().toggleBlockquote().run(),
          isActive: () => editor.isActive("blockquote"),
        },
        {
          type: "item",
          title: "Paragraph",
          textStyle: "body-1",
          action: () =>
            editor.chain().focus().clearNodes().unsetAllMarks().run(),
          isActive: () => editor.isActive("paragraph"),
        },
      ],
    },
    {
      type: "divider",
    },
    {
      type: "item",
      icon: BiBold,
      title: "Bold",
      action: () => editor.chain().focus().toggleBold().run(),
      isActive: () => editor.isActive("bold"),
    },
    {
      type: "item",
      icon: BiItalic,
      title: "Italicise",
      action: () => editor.chain().focus().toggleItalic().run(),
      isActive: () => editor.isActive("italic"),
    },
    {
      type: "item",
      icon: BiUnderline,
      title: "Underline",
      action: () => editor.chain().focus().toggleUnderline().run(),
      isActive: () => editor.isActive("underline"),
    },
    {
      type: "item",
      icon: BiStrikethrough,
      title: "Strikethrough",
      action: () => editor.chain().focus().toggleStrike().run(),
      isActive: () => editor.isActive("strike"),
    },
    {
      type: "item",
      icon: MdSuperscript,
      title: "Superscript",
      action: () => editor.chain().focus().toggleSuperscript().run(),
      isActive: () => editor.isActive("superscript"),
    },
    {
      type: "item",
      icon: MdSubscript,
      title: "Subscript",
      action: () => editor.chain().focus().toggleSubscript().run(),
      isActive: () => editor.isActive("subscript"),
    },
    {
      type: "divider",
    },
    {
      type: "horizontal-list",
      label: "Lists",
      defaultIcon: BiListOl,
      items: [
        {
          type: "item",
          icon: BiListOl,
          title: "Ordered list",
          action: () => editor.chain().focus().toggleOrderedList().run(),
          isActive: () => editor.isActive("orderedList"),
        },

        {
          type: "item",
          icon: BiListUl,
          title: "Bullet list",
          action: () => editor.chain().focus().toggleBulletList().run(),
          isActive: () => editor.isActive("bulletList"),
        },
      ],
    },
    {
      type: "divider",
    },
    // {
    //   type: 'item',
    //   icon: BiLink,
    //   title: 'Add link',
    //   action: () => showModal('hyperlink'),
    // },
    {
      type: "item",
      icon: BiTable,
      title: "Add table",
      action: () =>
        editor
          .chain()
          .focus()
          // NOTE: Default to smallest multi table
          .insertTable({ rows: 3, cols: 3, withHeaderRow: true })
          .run(),
    },
    // {
    //   type: 'item',
    //   icon: BiFile,
    //   title: 'Add file',
    //   action: () => showModal('files'),
    // },
    {
      type: "divider",
    },
    {
      type: "item",
      icon: BiUndo,
      title: "Undo",
      action: () => editor.chain().focus().undo().run(),
    },
    {
      type: "item",
      icon: BiRedo,
      title: "Redo",
      action: () => editor.chain().focus().redo().run(),
    },
  ]

  return (
    <HStack
      bgColor="base.canvas.alt"
      flex="0 0 auto"
      flexWrap="wrap"
      pl="0.75rem"
      pr="0.25rem"
      py="0.25rem"
      borderBottom="1px solid"
      borderColor="base.divider.strong"
      borderTopRadius="0.25rem"
      spacing="0.25rem"
    >
      {items.map((item) => (
        <>
          {item.type === "divider" && !item.isHidden && (
            <Divider
              orientation="vertical"
              borderColor="base.divider.strong"
              h="1.25rem"
              mx="0.25rem"
            />
          )}

          {item.type === "vertical-list" && (
            <Menu>
              {({ isOpen }) => {
                const activeItem = item.items.find(
                  (subItem) => subItem.isActive && subItem.isActive(),
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
            <Popover placement="bottom">
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

          {item.type === "detailed-list" && !item.isHidden && (
            <Popover placement="bottom" offset={[0, 16]}>
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
                        !subItem.isHidden && (
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

          {item.type === "item" && <MenuItem {...item} />}
        </>
      ))}
    </HStack>
  )
}
