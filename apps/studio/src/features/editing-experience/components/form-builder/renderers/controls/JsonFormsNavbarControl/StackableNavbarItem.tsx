import { useState } from "react"
import {
  AccordionButton,
  AccordionIcon,
  AccordionItem,
  AccordionPanel,
  Box,
  Flex,
  HStack,
  Icon,
  MenuButton,
  MenuItem,
  MenuList,
  Spacer,
  Text,
  useDisclosure,
  VStack,
} from "@chakra-ui/react"
import { IconButton, Menu } from "@opengovsg/design-system-react"
import {
  BiChevronDown,
  BiDotsHorizontalRounded,
  BiGridVertical,
  BiPencil,
  BiTrash,
} from "react-icons/bi"

import { DeleteGroupModal } from "./DeleteGroupModal"
import { DeleteSubItemModal } from "./DeleteSubItemModal"

interface StackableNavbarItemProps {
  name: string
  onEdit: (subItemIndex?: number) => void
  removeItem: (subItemIndex?: number) => void
  description?: string
  subItems?: Pick<StackableNavbarItemProps, "name" | "description">[]
}

export const StackableNavbarItem = ({
  name,
  onEdit,
  removeItem,
  description,
  subItems,
}: StackableNavbarItemProps) => {
  const {
    isOpen: isDeleteGroupModalOpen,
    onOpen: onDeleteGroupModalOpen,
    onClose: onDeleteGroupModalClose,
  } = useDisclosure()
  const {
    isOpen: isDeleteSubItemModalOpen,
    onOpen: onDeleteSubItemModalOpen,
    onClose: onDeleteSubItemModalClose,
  } = useDisclosure()
  const [subItemToDelete, setSubItemToDelete] = useState<number>()

  return (
    <>
      <DeleteGroupModal
        label={name}
        subItemsCount={subItems ? subItems.length : 0}
        isOpen={isDeleteGroupModalOpen}
        onClose={onDeleteGroupModalClose}
        onDelete={() => {
          removeItem()
          onDeleteGroupModalClose()
        }}
      />

      {!!subItems && (
        <DeleteSubItemModal
          label={subItems[subItemToDelete ?? 0]?.name ?? ""}
          isOpen={isDeleteSubItemModalOpen}
          onClose={onDeleteSubItemModalClose}
          onDelete={() => {
            if (subItemToDelete !== undefined) {
              removeItem(subItemToDelete)
              setSubItemToDelete(undefined)
            }

            onDeleteSubItemModalClose()
          }}
        />
      )}

      <AccordionItem borderTopWidth={0} _last={{ borderBottomWidth: 0 }}>
        <Box>
          <Box
            border="1px solid"
            borderColor="base.divider.medium"
            borderRadius="0.375rem"
            bgColor="utility.ui"
            transitionProperty="common"
            transitionDuration="normal"
            _hover={{
              bg: "interaction.muted.main.hover",
              borderColor: "interaction.main-subtle.hover",
            }}
            _active={{
              bg: "interaction.main-subtle.default",
              borderColor: "interaction.main-subtle.hover",
              shadow: "0px 1px 6px 0px #1361F026",
            }}
          >
            <HStack gap="0.5rem" p="0.5rem" w="full">
              <HStack gap="0.75rem" w="full">
                <Icon as={BiGridVertical} fontSize="1.5rem" color="slate.300" />

                <HStack
                  as="button"
                  gap="0.5rem"
                  w="full"
                  textAlign="start"
                  onClick={() => onEdit()}
                >
                  <VStack gap="0.25rem" alignItems="start">
                    <Text
                      textStyle="subhead-2"
                      textColor="base.content.default"
                    >
                      {name}
                    </Text>

                    <Text
                      textStyle="caption-2"
                      textColor="interaction.support.placeholder"
                      noOfLines={1}
                    >
                      {description || "Add a description for this link"}
                    </Text>
                  </VStack>

                  <Spacer />

                  <Box flexShrink={0}>
                    <Text textStyle="caption-2" textColor="base.content.medium">
                      {!!subItems && subItems.length > 0
                        ? `${subItems.length} nested ${subItems.length > 1 ? "links" : "link"}`
                        : "Single link"}
                    </Text>
                  </Box>
                </HStack>
              </HStack>

              <Menu>
                <MenuButton
                  as={IconButton}
                  aria-label="See more options"
                  variant="clear"
                  colorScheme="sub"
                  minH="1.75rem"
                  minW="1.75rem"
                  h="1.75rem"
                  icon={<BiDotsHorizontalRounded fontSize="1.5rem" />}
                />
                <MenuList>
                  <MenuItem onClick={() => onEdit()}>
                    <Flex
                      alignItems="center"
                      gap="0.5rem"
                      color="base.content.strong"
                    >
                      <Icon as={BiPencil} />
                      <Text textStyle="body-2">Edit link</Text>
                    </Flex>
                  </MenuItem>
                  <MenuItem onClick={onDeleteGroupModalOpen}>
                    <Flex
                      alignItems="center"
                      gap="0.5rem"
                      color="interaction.critical.default"
                    >
                      <Icon as={BiTrash} />
                      <Text textStyle="body-2">Delete group</Text>
                    </Flex>
                  </MenuItem>
                </MenuList>
              </Menu>

              {!!subItems && subItems.length > 0 && (
                <AccordionButton
                  h="1.5rem"
                  w="1.5rem"
                  p={0}
                  justifyContent="center"
                  borderRadius="0.25rem"
                >
                  <AccordionIcon
                    as={BiChevronDown}
                    fontSize="1.5rem"
                    color="interaction.sub.default"
                  />
                </AccordionButton>
              )}
            </HStack>
          </Box>

          {subItems && subItems.length > 0 && (
            <AccordionPanel pt="0.75rem" pb={0} pl="3rem" pr={0} w="full">
              <VStack spacing="0.75rem">
                {subItems.map((subItem, idx) => (
                  <Box
                    key={idx}
                    border="1px solid"
                    borderColor="base.divider.medium"
                    borderRadius="0.375rem"
                    bgColor="utility.ui"
                    w="full"
                    position="relative"
                    transitionProperty="common"
                    transitionDuration="normal"
                    _hover={{
                      bg: "interaction.muted.main.hover",
                      borderColor: "interaction.main-subtle.hover",
                    }}
                    _active={{
                      bg: "interaction.main-subtle.default",
                      borderColor: "interaction.main-subtle.hover",
                      shadow: "0px 1px 6px 0px #1361F026",
                    }}
                  >
                    {/* Vertical trunk line */}
                    <Box
                      position="absolute"
                      left="-1.5rem"
                      top={idx === 0 ? "-24%" : "-80%"}
                      bottom="57%"
                      w="2px"
                      bg="base.divider.strong"
                    />

                    <HStack
                      gap="0.5rem"
                      p="0.5rem"
                      w="full"
                      // Horizontal trunk line
                      _before={{
                        content: '""',
                        position: "absolute",
                        top: "43%",
                        left: "-1.5rem",
                        width: "1.5rem",
                        height: "2px",
                        bg: "base.divider.strong",
                      }}
                    >
                      <HStack gap="0.75rem" w="full">
                        <Icon
                          as={BiGridVertical}
                          fontSize="1.5rem"
                          color="slate.300"
                        />

                        <HStack
                          as="button"
                          gap="0.75rem"
                          w="full"
                          textAlign="start"
                          onClick={() => onEdit(idx)}
                        >
                          <VStack gap="0.25rem" alignItems="start">
                            <Text
                              textStyle="subhead-2"
                              textColor="base.content.default"
                            >
                              {subItem.name}
                            </Text>

                            <Text
                              textStyle="caption-2"
                              textColor="interaction.support.placeholder"
                              noOfLines={1}
                            >
                              {subItem.description ||
                                "Add a description for this link"}
                            </Text>
                          </VStack>

                          <Spacer />

                          <Box flexShrink={0}>
                            <Text
                              textStyle="caption-2"
                              textColor="base.content.medium"
                            >
                              Single link
                            </Text>
                          </Box>
                        </HStack>
                      </HStack>

                      <Menu>
                        <MenuButton
                          as={IconButton}
                          aria-label="See more options"
                          variant="clear"
                          colorScheme="sub"
                          minH="1.75rem"
                          minW="1.75rem"
                          h="1.75rem"
                          icon={<BiDotsHorizontalRounded fontSize="1.5rem" />}
                        />
                        <MenuList>
                          <MenuItem onClick={() => onEdit(idx)}>
                            <Flex
                              alignItems="center"
                              gap="0.5rem"
                              color="base.content.strong"
                            >
                              <Icon as={BiPencil} />
                              <Text textStyle="body-2">Edit link</Text>
                            </Flex>
                          </MenuItem>
                          <MenuItem
                            onClick={() => {
                              setSubItemToDelete(idx)
                              onDeleteSubItemModalOpen()
                            }}
                          >
                            <Flex
                              alignItems="center"
                              gap="0.5rem"
                              color="interaction.critical.default"
                            >
                              <Icon as={BiTrash} />
                              <Text textStyle="body-2">Delete link</Text>
                            </Flex>
                          </MenuItem>
                        </MenuList>
                      </Menu>
                    </HStack>
                  </Box>
                ))}
              </VStack>
            </AccordionPanel>
          )}
        </Box>
      </AccordionItem>
    </>
  )
}
