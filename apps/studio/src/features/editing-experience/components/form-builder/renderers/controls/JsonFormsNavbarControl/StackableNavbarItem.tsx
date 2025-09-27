import type { Edge } from "@atlaskit/pragmatic-drag-and-drop-hitbox/dist/types/types"
import type {
  BaseEventPayload,
  DropTargetLocalizedData,
  ElementDragType,
} from "@atlaskit/pragmatic-drag-and-drop/dist/types/internal-types"
import type { ErrorObject } from "ajv"
import { useEffect, useMemo, useRef, useState } from "react"
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

import {
  DEFAULT_NAVBAR_ITEM_DESCRIPTION,
  DEFAULT_NAVBAR_ITEM_TITLE,
  NAVBAR_ITEM_ERROR_DESCRIPTION,
} from "./constants"
import { DeleteGroupModal } from "./DeleteGroupModal"
import { DeleteSubItemModal } from "./DeleteSubItemModal"
import { NavbarItemBox } from "./NavbarItemBox"
import { getInstancePathFromNavbarItemPath, getNavbarItemPath } from "./utils"

const getNumberOfErrors = (
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  errors: ErrorObject<string, Record<string, any>, unknown>[],
  path: string,
) => {
  const instancePath = `/${path.replace(/\./g, "/")}`
  return errors.filter((error) => error.instancePath.startsWith(instancePath))
    .length
}

interface StackableNavbarItemProps {
  index: number
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  errors: ErrorObject<string, Record<string, any>, unknown>[]
  onEdit: (subItemIndex?: number) => void
  removeItem: (subItemIndex?: number) => void
  name?: string
  description?: string
  subItems?: Pick<StackableNavbarItemProps, "name" | "description">[]
}

export const StackableNavbarItem = ({
  index,
  errors,
  onEdit,
  removeItem,
  name,
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

  const numberOfErrors = getNumberOfErrors(errors, getNavbarItemPath(index))
  const itemDescription = useMemo(() => {
    const instancePath = getInstancePathFromNavbarItemPath(
      getNavbarItemPath(index),
    )
    const isSubItemInvalid = errors.some((error) =>
      error.instancePath.startsWith(`${instancePath}/`),
    )

    if (isSubItemInvalid) {
      return "Expand to see errors"
    } else if (numberOfErrors > 0) {
      return NAVBAR_ITEM_ERROR_DESCRIPTION
    }

    return description || DEFAULT_NAVBAR_ITEM_DESCRIPTION
  }, [description, errors, index, numberOfErrors])

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
                  combine: "available",
                  // We don't want reordering to happen when dropping directly
                  // on top of the item
                  "reorder-before": "blocked",
                  "reorder-after": "blocked",
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
        canDrop: () => true,
        getIsSticky: () => true,
      }),
    )
  }, [index])

  return (
    <>
      <DeleteGroupModal
        label={name || DEFAULT_NAVBAR_ITEM_TITLE}
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
          label={
            subItems[subItemToDelete ?? 0]?.name ?? DEFAULT_NAVBAR_ITEM_TITLE
          }
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
            description={itemDescription}
            subItems={subItems}
            index={index}
            itemDragHandleRef={mainItemDragHandleRef}
            isNavbarItemDragging={isNavbarItemDragging}
            onEditItem={onEdit}
            onDeleteItem={onDeleteGroupModalOpen}
            isItemBeingDraggedOver={isItemBeingDraggedOver}
            setIsItemBeingDraggedOver={setIsItemBeingDraggedOver}
            isInvalid={numberOfErrors > 0}
          />

          {hasSubItems ? (
            <AccordionPanel
              ref={subItemsDroppableZoneRef}
              pt="0.75rem"
              pb={0}
              pl="3rem"
              pr={0}
              w="full"
            >
              <VStack spacing="0.75rem">
                {subItems.map((subItem, idx) => {
                  const numberOfSubItemErrors = getNumberOfErrors(
                    errors,
                    getNavbarItemPath(idx, index),
                  )
                  const isInvalid = numberOfSubItemErrors > 0

                  return (
                    <NavbarItemBox
                      name={subItem.name}
                      description={
                        isInvalid
                          ? "Fix errors before publishing"
                          : subItem.description
                      }
                      index={idx}
                      parentIndex={index}
                      isSubItem
                      onEditItem={() => onEdit(idx)}
                      onDeleteItem={() => {
                        setSubItemToDelete(idx)
                        onDeleteSubItemModalOpen()
                      }}
                      isInvalid={isInvalid}
                    />
                  )
                })}
              </VStack>
            </AccordionPanel>
          ) : (
            <Box ref={subItemsDroppableZoneRef} />
          )}
        </Box>
      </AccordionItem>

      {navbarItemClosestEdge === "bottom" && !isItemBeingDraggedOver && (
        <Divider borderColor="base.divider.brand" borderWidth="2px" />
      )}
    </>
  )
}
