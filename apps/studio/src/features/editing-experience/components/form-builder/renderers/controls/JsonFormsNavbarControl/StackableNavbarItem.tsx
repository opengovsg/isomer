import type { Edge } from "@atlaskit/pragmatic-drag-and-drop-hitbox/dist/types/types"
import type {
  BaseEventPayload,
  DropTargetLocalizedData,
  ElementDragType,
} from "@atlaskit/pragmatic-drag-and-drop/dist/types/internal-types"
import { useEffect, useRef, useState } from "react"
import {
  attachClosestEdge,
  extractClosestEdge,
} from "@atlaskit/pragmatic-drag-and-drop-hitbox/closest-edge"
import { attachInstruction } from "@atlaskit/pragmatic-drag-and-drop-hitbox/list-item"
import { combine } from "@atlaskit/pragmatic-drag-and-drop/combine"
import {
  draggable,
  dropTargetForElements,
} from "@atlaskit/pragmatic-drag-and-drop/element/adapter"
import {
  AccordionItem,
  AccordionPanel,
  Box,
  Divider,
  useDisclosure,
  VStack,
} from "@chakra-ui/react"

import { DeleteGroupModal } from "./DeleteGroupModal"
import { DeleteSubItemModal } from "./DeleteSubItemModal"
import { NavbarItemBox } from "./NavbarItemBox"
import { getNavbarItemPath } from "./utils"

interface StackableNavbarItemProps {
  name: string
  index: number
  onEdit: (subItemIndex?: number) => void
  removeItem: (subItemIndex?: number) => void
  description?: string
  subItems?: Pick<StackableNavbarItemProps, "name" | "description">[]
}

export const StackableNavbarItem = ({
  name,
  index,
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
  const [isNavbarItemDragging, setIsNavbarItemDragging] = useState(false)
  const [isItemBeingDraggedOver, setIsItemBeingDraggedOver] = useState(false)
  const [navbarItemClosestEdge, setNavbarItemClosestEdge] =
    useState<Edge | null>(null)

  const mainItemRef = useRef<HTMLDivElement | null>(null)
  const mainItemDragHandleRef = useRef<HTMLDivElement | null>(null)
  const subItemsDroppableZoneRef = useRef<HTMLDivElement | null>(null)

  const hasSubItems = !!subItems && subItems.length > 0

  // This useEffect sets up the drag and drop functionality for this particular
  // navbar item
  useEffect(() => {
    const mainItemElement = mainItemRef.current
    const mainItemDragHandleElement = mainItemDragHandleRef.current
    const subItemsDroppableZoneElement = subItemsDroppableZoneRef.current

    if (
      !mainItemElement ||
      !mainItemDragHandleElement ||
      !subItemsDroppableZoneElement
    ) {
      return
    }

    const handleDrag = (
      args: BaseEventPayload<ElementDragType> & DropTargetLocalizedData,
    ) => {
      const isDraggedItemTheSame =
        args.source.data.navbarId === getNavbarItemPath(index)
      const isDraggedItemDirectlyOver =
        args.location.current.dropTargets[0]?.data.dropTargetId ===
        getNavbarItemPath(index)

      if (!isDraggedItemTheSame && isDraggedItemDirectlyOver) {
        setNavbarItemClosestEdge(extractClosestEdge(args.self.data))
      } else {
        setNavbarItemClosestEdge(null)
      }
    }

    return combine(
      // This allows the main navbar item to be draggable via the drag handle
      draggable({
        element: mainItemElement,
        dragHandle: mainItemDragHandleElement,
        getInitialData: () => ({
          type: "navbar-item",
          navbarId: mainItemElement.dataset.id,
          dropTargetId: getNavbarItemPath(index),
        }),
        onDragStart: () => {
          mainItemElement.style.opacity = "0.5"
          setIsNavbarItemDragging(true)
        },
        onDrop: () => {
          mainItemElement.style.opacity = "unset"
          setIsNavbarItemDragging(false)
        },
        onGenerateDragPreview: () => {
          // NOTE: This does not actually apply to the preview, but is required
          // to ensure only the element itself is captured in the native drag
          // preview
          mainItemElement.style.opacity = "0.01"
        },
      }),

      // Navbar item dropzone, determines the closest edge and also allows
      // other items to be dropped on top of this item to be placed as a subitem
      dropTargetForElements({
        element: mainItemElement,
        getData: ({ input, element }) =>
          attachClosestEdge(
            attachInstruction(
              {
                type: "navbar-item",
                navbarId: (element as HTMLDivElement).dataset.id,
                dropTargetId: getNavbarItemPath(index),
              },
              {
                input,
                element,
                operations: {
                  "reorder-before": "available",
                  "reorder-after": "available",
                  combine: "available",
                },
              },
            ),
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

      // Subitems dropzone, for subitems within the same group to be rearranged
      dropTargetForElements({
        element: subItemsDroppableZoneElement,
        canDrop: () => {
          // TODO: Add logic to only allow dropping of subitems that have the
          // same parent as this item
          return true
        },
        getIsSticky: () => true,
      }),
    )
  }, [index])

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

      {hasSubItems && (
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

      {navbarItemClosestEdge === "top" && !isItemBeingDraggedOver && (
        <Divider borderColor="base.divider.brand" borderWidth="2px" />
      )}

      <AccordionItem
        borderTopWidth={0}
        _last={{ borderBottomWidth: 0 }}
        ref={mainItemRef}
        data-id={getNavbarItemPath(index)}
      >
        <Box>
          <NavbarItemBox
            name={name}
            description={description}
            subItems={subItems}
            index={index}
            itemDragHandleRef={mainItemDragHandleRef}
            isNavbarItemDragging={isNavbarItemDragging}
            onEditItem={onEdit}
            onDeleteItem={onDeleteGroupModalOpen}
            isItemBeingDraggedOver={isItemBeingDraggedOver}
            setIsItemBeingDraggedOver={setIsItemBeingDraggedOver}
          />

          {hasSubItems && (
            <AccordionPanel
              ref={subItemsDroppableZoneRef}
              pt="0.75rem"
              pb={0}
              pl="3rem"
              pr={0}
              w="full"
            >
              <VStack spacing="0.75rem">
                {subItems.map((subItem, idx) => (
                  <NavbarItemBox
                    key={JSON.stringify(subItem)}
                    name={subItem.name}
                    description={subItem.description}
                    index={idx}
                    parentIndex={index}
                    isSubItem
                    onEditItem={() => onEdit(idx)}
                    onDeleteItem={() => {
                      setSubItemToDelete(idx)
                      onDeleteSubItemModalOpen()
                    }}
                  />
                ))}
              </VStack>
            </AccordionPanel>
          )}
        </Box>
      </AccordionItem>

      {navbarItemClosestEdge === "bottom" && !isItemBeingDraggedOver && (
        <Divider borderColor="base.divider.brand" borderWidth="2px" />
      )}
    </>
  )
}
