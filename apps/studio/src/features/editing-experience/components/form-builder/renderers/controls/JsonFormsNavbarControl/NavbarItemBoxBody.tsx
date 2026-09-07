/* oxlint-disable typescript/strict-boolean-expressions, unicorn/no-unsafe-type-assertion -- core cleanup deferred */
import type { Edge } from "@atlaskit/pragmatic-drag-and-drop-hitbox/closest-edge"
import type { Dispatch, SetStateAction } from "react"
import {
  AccordionButton,
  AccordionIcon,
  Box,
  Divider,
  Flex,
  HStack,
  Icon,
  MenuButton,
  MenuItem,
  MenuList,
  Spacer,
  Text,
  VStack,
} from "@chakra-ui/react"
import { IconButton, Menu } from "@opengovsg/design-system-react"
import {
  BiChevronDown,
  BiDotsHorizontalRounded,
  BiGridVertical,
  BiPencil,
  BiSolidErrorCircle,
  BiTrash,
} from "react-icons/bi"
import {
  hasNonEmptyString,
  isDefinedNumber,
  isNullableBooleanTrue,
  isNonEmptyArray,
} from "~/utils/truthiness"

import {
  DEFAULT_NAVBAR_ITEM_DESCRIPTION,
  DEFAULT_NAVBAR_ITEM_TITLE,
} from "./constants"
import { getNavbarItemPath } from "./utils"

export interface NavbarItemBoxDragPresentation {
  isNavbarItemDragging?: boolean
  isSubItem?: boolean
  isItemBeingDraggedOver?: boolean
  setIsItemBeingDraggedOver?: Dispatch<SetStateAction<boolean>>
  isInvalid?: boolean
}

interface NavbarItemBoxBodyProps {
  index: number
  parentIndex?: number
  name?: string
  description?: string
  subItems?: { name?: string; description?: string }[]
  itemDragHandleRef?: React.RefObject<HTMLDivElement>
  itemRef: React.RefObject<HTMLDivElement | null>
  itemDefaultDragHandleRef: React.RefObject<HTMLDivElement | null>
  isSubItemDragging: boolean
  navbarItemClosestEdge: Edge | null
  dragPresentation: NavbarItemBoxDragPresentation
  onEditItem: () => void
  onDeleteItem: () => void
}

// oxlint-disable-next-line eslint/complexity -- core cleanup deferred
export const NavbarItemBoxBody = ({
  index,
  parentIndex,
  name = DEFAULT_NAVBAR_ITEM_TITLE,
  description = DEFAULT_NAVBAR_ITEM_DESCRIPTION,
  subItems,
  itemDragHandleRef,
  itemRef,
  itemDefaultDragHandleRef,
  isSubItemDragging,
  navbarItemClosestEdge,
  dragPresentation: {
    isNavbarItemDragging,
    isSubItem,
    isItemBeingDraggedOver,
    setIsItemBeingDraggedOver,
    isInvalid,
  },
  onEditItem,
  onDeleteItem,
}: NavbarItemBoxBodyProps) => (
  <>
    {isNullableBooleanTrue(isSubItem) &&
      navbarItemClosestEdge === "top" &&
      !isNullableBooleanTrue(isItemBeingDraggedOver) && (
        <Divider borderColor="base.divider.brand" borderWidth="2px" />
      )}

    <Box
      // SAFETY: JSON Forms control narrows schema/data to the expected editor shape
      ref={itemRef as React.Ref<HTMLDivElement>}
      aria-invalid={isNullableBooleanTrue(isInvalid) && !isItemBeingDraggedOver}
      data-id={getNavbarItemPath(index, parentIndex)}
      borderWidth="1.5px"
      borderStyle="solid"
      borderColor={
        isNullableBooleanTrue(isItemBeingDraggedOver)
          ? "base.divider.brand"
          : "base.divider.medium"
      }
      borderRadius="0.375rem"
      bgColor={
        isNullableBooleanTrue(isItemBeingDraggedOver)
          ? "interaction.main-subtle.default"
          : "utility.ui"
      }
      w="full"
      position="relative"
      transitionProperty="common"
      transitionDuration="normal"
      _hover={{
        bg: "interaction.muted.main.hover",
        borderColor: "interaction.main-subtle.hover",
      }}
      _active={
        isNullableBooleanTrue(isNavbarItemDragging) || isSubItemDragging
          ? {
              bg: "utility.ui",
              borderColor: "utility.ui",
            }
          : {
              bg: "utility.ui",
              borderColor: "interaction.main-subtle.hover",
              shadow: "0px 1px 6px 0px #1361F026",
            }
      }
      _invalid={{
        bgColor: "utility.feedback.critical-subtle",
        borderColor: "utility.feedback.critical",
        borderWidth: "1.5px",
      }}
      onDragOver={(e) => {
        e.preventDefault()
        setIsItemBeingDraggedOver?.(true)
      }}
      onDragLeave={(e) => {
        e.preventDefault()
        setIsItemBeingDraggedOver?.(false)
      }}
      onDrop={(e) => {
        e.preventDefault()
        setIsItemBeingDraggedOver?.(false)
      }}
    >
      {isNullableBooleanTrue(isSubItem) && (
        <Box
          position="absolute"
          left="-1.5rem"
          top={index === 0 ? "-24%" : "-80%"}
          bottom="57%"
          w="2px"
          bg="base.divider.strong"
          sx={{
            ".hide-trunk-line &": { bg: "transparent" },
          }}
        />
      )}

      <HStack
        gap="0.5rem"
        p="0.5rem"
        w="full"
        _before={
          isNullableBooleanTrue(isSubItem)
            ? {
                bg: "base.divider.strong",
                content: '""',
                height: "2px",
                left: "-1.5rem",
                position: "absolute",
                top: "43%",
                width: "1.5rem",
              }
            : undefined
        }
        sx={{
          ".hide-trunk-line &::before": { bg: "transparent" },
        }}
      >
        <HStack gap="0.75rem" w="full">
          <Box
            display="flex"
            ref={
              // SAFETY: drag handle ref is attached to either the custom or default handle element
              (itemDragHandleRef ??
                itemDefaultDragHandleRef) as React.Ref<HTMLDivElement>
            }
            cursor="grab"
            layerStyle="focusRing"
          >
            <Icon as={BiGridVertical} fontSize="1.5rem" color="slate.300" />
          </Box>

          <HStack
            as="button"
            gap="0.5rem"
            w="full"
            textAlign="start"
            onClick={() => {
              onEditItem()
            }}
          >
            <VStack gap="0.25rem" alignItems="start">
              <Text
                textStyle="subhead-2"
                textColor="base.content.default"
                noOfLines={1}
              >
                {name}
              </Text>

              <HStack gap="0.25rem" justifyContent="center">
                {isNullableBooleanTrue(isInvalid) && (
                  <Icon
                    as={BiSolidErrorCircle}
                    fontSize="1rem"
                    color="utility.feedback.critical"
                  />
                )}

                <Text
                  textStyle="caption-2"
                  textColor={
                    isNullableBooleanTrue(isInvalid)
                      ? "utility.feedback.critical"
                      : "interaction.support.placeholder"
                  }
                  noOfLines={1}
                >
                  {description}
                </Text>
              </HStack>
            </VStack>

            <Spacer />

            <Box flexShrink={0}>
              <Text textStyle="caption-2" textColor="base.content.medium">
                {!isNullableBooleanTrue(isSubItem) &&
                !!subItems &&
                subItems.length > 0
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
            <MenuItem
              onClick={() => {
                onEditItem()
              }}
            >
              <Flex
                alignItems="center"
                gap="0.5rem"
                color="base.content.strong"
              >
                <Icon as={BiPencil} />
                <Text textStyle="body-2">Edit link</Text>
              </Flex>
            </MenuItem>
            <MenuItem onClick={onDeleteItem}>
              <Flex
                alignItems="center"
                gap="0.5rem"
                color="interaction.critical.default"
              >
                <Icon as={BiTrash} />
                <Text textStyle="body-2">
                  Delete{" "}
                  {isNullableBooleanTrue(isSubItem) ||
                  !subItems ||
                  subItems.length === 0
                    ? "link"
                    : "group"}
                </Text>
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

    {isNullableBooleanTrue(isSubItem) &&
      navbarItemClosestEdge === "bottom" &&
      !isNullableBooleanTrue(isItemBeingDraggedOver) && (
        <Divider borderColor="base.divider.brand" borderWidth="2px" />
      )}
  </>
)
