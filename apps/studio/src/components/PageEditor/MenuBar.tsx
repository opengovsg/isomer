import {
  BiX,
  BiBold,
  BiItalic,
  BiUnderline,
  BiStrikethrough,
  BiListOl,
  BiListUl,
  BiTable,
  BiPlus,
  BiUndo,
  BiRedo,
} from 'react-icons/bi'
import {
  Bs2Circle,
  Bs3Circle,
  BsSuperscript,
  BsSubscript,
} from 'react-icons/bs'
import type { Editor } from '@tiptap/core'
import { Divider, Wrap } from '@chakra-ui/react'

const MenuBar = ({ editor, schema }: { editor: Editor; schema: any }) => {
  const items: any[] = [
    {
      type: 'vertical-list',
      buttonWidth: '9rem',
      menuWidth: '19rem',
      defaultTitle: 'Heading 2',
      items: [
        {
          type: 'item',
          title: 'Heading 2',
          textStyle: 'h2',
          useSecondaryColor: true,
          action: () =>
            editor.chain().focus().toggleHeading({ level: 2 }).run(),
          isActive: () => editor.isActive('heading', { level: 2 }),
        },
        {
          type: 'item',
          title: 'Heading 3',
          textStyle: 'h3',
          useSecondaryColor: true,
          action: () =>
            editor.chain().focus().toggleHeading({ level: 3 }).run(),
          isActive: () => editor.isActive('heading', { level: 3 }),
        },
        {
          type: 'item',
          title: 'Heading 4',
          textStyle: 'h4',
          useSecondaryColor: true,
          action: () =>
            editor.chain().focus().toggleHeading({ level: 4 }).run(),
          isActive: () => editor.isActive('heading', { level: 4 }),
        },
        {
          type: 'item',
          title: 'Heading 5',
          textStyle: 'h5',
          useSecondaryColor: true,
          action: () =>
            editor.chain().focus().toggleHeading({ level: 5 }).run(),
          isActive: () => editor.isActive('heading', { level: 5 }),
        },
        {
          type: 'item',
          title: 'Heading 6',
          textStyle: 'h6',
          useSecondaryColor: true,
          action: () =>
            editor.chain().focus().toggleHeading({ level: 6 }).run(),
          isActive: () => editor.isActive('heading', { level: 6 }),
        },
        // {
        //   type: "item",
        //   title: "Quote block",
        //   textStyle: "body-1",
        //   useSecondaryColor: true,
        //   leftItem: (
        //     <Divider
        //       orientation="vertical"
        //       border="1px solid"
        //       borderColor="chakra-body-text"
        //       h="1.625rem"
        //       mr="0.75rem"
        //     />
        //   ),
        //   action: () => editor.chain().focus().toggleBlockquote().run(),
        //   isActive: () => editor.isActive("blockquote"),
        // },
        {
          type: 'item',
          title: 'Paragraph',
          textStyle: 'body-1',
          action: () =>
            editor.chain().focus().clearNodes().unsetAllMarks().run(),
          isActive: () => editor.isActive('paragraph'),
        },
      ],
    },
    {
      type: 'item',
      icon: Bs2Circle,
      title: 'Heading 2',
      action: () => editor.chain().focus().toggleHeading({ level: 2 }).run(),
      isActive: () => editor.isActive('heading', { level: 2 }),
    },
    {
      type: 'item',
      icon: Bs3Circle,
      title: 'Heading 3',
      action: () => editor.chain().focus().toggleHeading({ level: 3 }).run(),
      isActive: () => editor.isActive('heading', { level: 3 }),
    },
    {
      type: 'item',
      icon: BiX,
      title: 'Paragraph',
      action: () => editor.chain().focus().clearNodes().unsetAllMarks().run(),
      isActive: () => editor.isActive('paragraph'),
    },
    {
      type: 'divider',
    },
    {
      type: 'item',
      icon: BiBold,
      title: 'Bold',
      action: () => editor.chain().focus().toggleBold().run(),
      isActive: () => editor.isActive('bold'),
    },
    {
      type: 'item',
      icon: BiItalic,
      title: 'Italicise',
      action: () => editor.chain().focus().toggleItalic().run(),
      isActive: () => editor.isActive('italic'),
    },
    {
      type: 'item',
      icon: BiUnderline,
      title: 'Underline',
      action: () => editor.chain().focus().toggleUnderline().run(),
      isActive: () => editor.isActive('underline'),
    },
    {
      type: 'item',
      icon: BiStrikethrough,
      title: 'Strikethrough',
      action: () => editor.chain().focus().toggleStrike().run(),
      isActive: () => editor.isActive('strike'),
    },
    {
      type: 'item',
      icon: BsSuperscript,
      title: 'Superscript',
      action: () => editor.chain().focus().toggleSuperscript().run(),
      isActive: () => editor.isActive('superscript'),
    },
    {
      type: 'item',
      icon: BsSubscript,
      title: 'Subscript',
      action: () => editor.chain().focus().toggleSubscript().run(),
      isActive: () => editor.isActive('subscript'),
    },
    {
      type: 'divider',
    },
    {
      type: 'horizontal-list',
      label: 'Lists',
      defaultIcon: BiListOl,
      items: [
        {
          type: 'item',
          icon: BiListOl,
          title: 'Ordered list',
          action: () => editor.chain().focus().toggleOrderedList().run(),
          isActive: () => editor.isActive('orderedlist'),
        },

        {
          type: 'item',
          icon: BiListUl,
          title: 'Bullet list',
          action: () => editor.chain().focus().toggleBulletList().run(),
          isActive: () => editor.isActive('unorderedlist'),
        },
      ],
    },
    {
      type: 'divider',
    },
    // {
    //   type: "item",
    //   icon: BiLink,
    //   title: "Add link",
    //   action: () => showModal("hyperlink"),
    // },
    // {
    //   type: "item",
    //   icon: BiImageAdd,
    //   title: "Add image",
    //   action: () => showModal("images"),
    // },
    {
      type: 'item',
      icon: BiTable,
      title: 'Add table',
      action: () =>
        editor
          .chain()
          .focus()
          // NOTE: Default to smallest multi table
          .insertTable({ rows: 3, cols: 3, withHeaderRow: true })
          .run(),
    },
    // {
    //   type: "item",
    //   icon: BiFile,
    //   title: "Add file",
    //   action: () => showModal("files"),
    // },
    // {
    //   type: "item",
    //   icon: BiCodeAlt,
    //   title: "Insert embed",
    //   action: () => showModal("embed"),
    // },
    {
      type: 'divider',
    },
    {
      type: 'detailed-list',
      label: 'Add complex blocks',
      icon: BiPlus,
      items: Object.keys(schema.components.complex).map((component) => ({
        name: `${component.charAt(0).toUpperCase()}${component.slice(1)}`,
        action: () =>
          editor.chain().focus().createComplexComponent(component).run(),
      })),
    },
    {
      type: 'divider',
    },
    {
      type: 'item',
      icon: BiUndo,
      title: 'Undo',
      action: () => editor.chain().focus().undo().run(),
    },
    {
      type: 'item',
      icon: BiRedo,
      title: 'Redo',
      action: () => editor.chain().focus().redo().run(),
    },
  ]

  return (
    <Wrap flexGrow="0" flexShrink="0" p="0.25rem" gap="0.25rem">
      {items.map((item) => (
        <>
          {item.type === 'divider' && !item.isHidden && (
            <Divider orientation="vertical" height="1.25rem" />
          )}

          {/* {item.type === "horizontal-list" && (
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
                        )
                    )}
                  </VStack>
                </PopoverBody>
              </PopoverContent>
            </Popover>
          )} */}

          {item.type === 'item' && (
            <button onClick={item.action}>
              <item.icon />
            </button>
          )}
        </>
      ))}
    </Wrap>
  )
}

export default MenuBar
