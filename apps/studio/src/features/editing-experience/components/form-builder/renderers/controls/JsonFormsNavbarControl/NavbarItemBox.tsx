import type { Edge } from "@atlaskit/pragmatic-drag-and-drop-hitbox/closest-edge"
import type {
  BaseEventPayload,
  DropTargetLocalizedData,
  ElementDragType,
} from "@atlaskit/pragmatic-drag-and-drop/dist/types/internal-types"
import type { Dispatch, SetStateAction } from "react"
import { useEffect, useRef, useState } from "react"
import {
  attachClosestEdge,
  extractClosestEdge,
} from "@atlaskit/pragmatic-drag-and-drop-hitbox/closest-edge"
import { combine } from "@atlaskit/pragmatic-drag-and-drop/combine"
import {
  draggable,
  dropTargetForElements,
} from "@atlaskit/pragmatic-drag-and-drop/element/adapter"
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
  DEFAULT_NAVBAR_ITEM_DESCRIPTION,
  DEFAULT_NAVBAR_ITEM_TITLE,
} from "./constants"
import { getNavbarItemPath } from "./utils"

interface NavbarItemBoxProps {
  index: number
  onEditItem: () => void
  onDeleteItem: () => void
  name?: string
  description?: string
  subItems?: Pick<NavbarItemBoxProps, "name" | "description">[]
  parentIndex?: number
  itemDragHandleRef?: React.RefObject<HTMLDivElement>
  isNavbarItemDragging?: boolean
  isSubItem?: boolean
  isItemBeingDraggedOver?: boolean
  setIsItemBeingDraggedOver?: Dispatch<SetStateAction<boolean>>
  isInvalid?: boolean
}

export const NavbarItemBox = ({
  index,
  onEditItem,
  onDeleteItem,
  name = DEFAULT_NAVBAR_ITEM_TITLE,
  description = DEFAULT_NAVBAR_ITEM_DESCRIPTION,
  subItems,
  parentIndex,
  itemDragHandleRef,
  isNavbarItemDragging,
  isSubItem,
  isItemBeingDraggedOver,
  setIsItemBeingDraggedOver,
  isInvalid,
}: NavbarItemBoxProps) => {
  const itemRef = useRef<HTMLDivElement | null>(null)
  const itemDefaultDragHandleRef = useRef<HTMLDivElement | null>(null)
  const [isSubItemDragging, setIsSubItemDragging] = useState(false)
  const [navbarItemClosestEdge, setNavbarItemClosestEdge] =
    useState<Edge | null>(null)

  // NOTE: This useEffect is used for subItems, otherwise we depend on the
  // caller to provide the drag handle ref only
  useEffect(() => {
    const itemElement = itemRef.current
    const dragHandleElement = itemDefaultDragHandleRef.current

    if (!isSubItem || !itemElement || !dragHandleElement) {
      return
    }

    const handleDrag = (
      args: BaseEventPayload<ElementDragType> & DropTargetLocalizedData,
    ) => {
      const isDraggedItemTheSame =
        args.source.data.navbarId === getNavbarItemPath(index, parentIndex)
      const isDraggedItemAChild =
        parentIndex !== undefined &&
        (args.source.data.navbarId as string).startsWith(
          getNavbarItemPath(parentIndex),
        )

      if (!isDraggedItemTheSame && isDraggedItemAChild) {
        setNavbarItemClosestEdge(extractClosestEdge(args.self.data))
      } else {
        setNavbarItemClosestEdge(null)
      }
    }

    return combine(
      // This allows the item box to be draggable via the drag handle
      // Only applies to subitems, as main navbar items are set up in the parent
      draggable({
        element: itemElement,
        dragHandle: dragHandleElement,
        getInitialData: () => ({
          type: "navbar-item",
          navbarId: itemElement.dataset.id,
          dropTargetId: getNavbarItemPath(index, parentIndex),
        }),
        onDragStart: () => {
          itemElement.style.opacity = "0.5"
          setIsSubItemDragging(true)
        },
        onDrop: () => {
          itemElement.style.opacity = "unset"
          itemElement.classList.remove("hide-trunk-line")
          setIsSubItemDragging(false)
        },
        onGenerateDragPreview: () => {
          // NOTE: This does not actually apply to the preview, but is required
          // to ensure only the element itself is captured in the native drag
          // preview
          itemElement.style.opacity = "0.01"
          itemElement.classList.add("hide-trunk-line")
        },
      }),

      // Subitem dropzone, only used to determine closest edge
      // The navbar item dropzone is set up in the parent component
      dropTargetForElements({
        element: itemElement,
        getData: ({ input, element }) =>
          attachClosestEdge(
            {
              type: "navbar-item",
              navbarId: (element as HTMLDivElement).dataset.id,
              dropTargetId: getNavbarItemPath(index, parentIndex),
            },
            {
              input,
              element,
              allowedEdges: ["top", "bottom"],
            },
          ),
        getIsSticky: () => true,
        onDragEnter: handleDrag,
        onDrag: handleDrag,
        onDragLeave: () => setNavbarItemClosestEdge(null),
        onDrop: () => setNavbarItemClosestEdge(null),
      }),
    )
  }, [index, isSubItem, parentIndex])

  return (
    <>
      {isSubItem &&
        navbarItemClosestEdge === "top" &&
        !isItemBeingDraggedOver && (
          <Divider borderColor="base.divider.brand" borderWidth="2px" />
        )}

      <Box
        ref={itemRef}
        aria-invalid={isInvalid && !isItemBeingDraggedOver}
        data-id={getNavbarItemPath(index, parentIndex)}
        borderWidth="1px"
        borderStyle="solid"
        borderColor={
          isItemBeingDraggedOver ? "base.divider.brand" : "base.divider.medium"
        }
        borderRadius="0.375rem"
        bgColor={
          isItemBeingDraggedOver
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
          isNavbarItemDragging || isSubItemDragging
            ? // NOTE: These styles apply to the item that remains on the list
              // while its preview clone is being dragged around. An additional
              // opacity style is applied onDragStart
              {
                bg: "utility.ui",
                borderColor: "utility.ui",
              }
            : // NOTE: These styles apply to the preview of the item that is
              // being dragged
              {
                bg: "utility.ui",
                borderColor: "interaction.main-subtle.hover",
                shadow: "0px 1px 6px 0px #1361F026",
              }
        }
        _invalid={{
          borderWidth: "1.5px",
          borderColor: "utility.feedback.critical",
          bgColor: "utility.feedback.critical-subtle",
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
        {/* Vertical trunk line for subitems only */}
        {isSubItem && (
          <Box
            position="absolute"
            left="-1.5rem"
            top={index === 0 ? "-24%" : "-80%"}
            bottom="57%"
            w="2px"
            bg="base.divider.strong"
            sx={{
              // Hide the trunk line if a child item has the "hide-trunk-line"
              // class (used when dragging an item to avoid visual clutter)
              ".hide-trunk-line &": { bg: "transparent" },
            }}
          />
        )}

        <HStack
          gap="0.5rem"
          p="0.5rem"
          w="full"
          // Horizontal trunk line for subitems only
          _before={
            isSubItem
              ? {
                  content: '""',
                  position: "absolute",
                  top: "43%",
                  left: "-1.5rem",
                  width: "1.5rem",
                  height: "2px",
                  bg: "base.divider.strong",
                }
              : undefined
          }
          sx={{
            // Hide the trunk line if a child item has the "hide-trunk-line"
            // class (used when dragging an item to avoid visual clutter)
            ".hide-trunk-line &::before": { bg: "transparent" },
          }}
        >
          <HStack gap="0.75rem" w="full">
            <Box
              ref={itemDragHandleRef ?? itemDefaultDragHandleRef}
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
              onClick={() => onEditItem()}
            >
              <VStack gap="0.25rem" alignItems="start">
                <Text textStyle="subhead-2" textColor="base.content.default">
                  {name}
                </Text>

                <HStack gap="0.25rem" justifyContent="center">
                  {isInvalid && (
                    <Icon
                      as={BiSolidErrorCircle}
                      fontSize="1rem"
                      color="utility.feedback.critical"
                    />
                  )}

                  <Text
                    textStyle="caption-2"
                    textColor={
                      isInvalid
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
                  {!isSubItem && !!subItems && subItems.length > 0
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
              <MenuItem onClick={() => onEditItem()}>
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
                    Delete {isSubItem ? "link" : "group"}
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

      {isSubItem &&
        navbarItemClosestEdge === "bottom" &&
        !isItemBeingDraggedOver && (
          <Divider borderColor="base.divider.brand" borderWidth="2px" />
        )}
    </>
  )
}
