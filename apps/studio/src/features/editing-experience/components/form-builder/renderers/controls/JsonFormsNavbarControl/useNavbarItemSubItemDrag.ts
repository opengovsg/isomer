import type { Edge } from "@atlaskit/pragmatic-drag-and-drop-hitbox/closest-edge"
import type {
  BaseEventPayload,
  DropTargetLocalizedData,
  ElementDragType,
} from "@atlaskit/pragmatic-drag-and-drop/dist/types/internal-types"
import {
  attachClosestEdge,
  extractClosestEdge,
} from "@atlaskit/pragmatic-drag-and-drop-hitbox/closest-edge"
import { combine } from "@atlaskit/pragmatic-drag-and-drop/combine"
import {
  draggable,
  dropTargetForElements,
} from "@atlaskit/pragmatic-drag-and-drop/element/adapter"
import { useEffect, useRef, useState } from "react"

import { getNavbarItemPath } from "./utils"

interface UseNavbarItemSubItemDragProps {
  index: number
  parentIndex?: number
  isSubItem?: boolean
}

export const useNavbarItemSubItemDrag = ({
  index,
  parentIndex,
  isSubItem,
}: UseNavbarItemSubItemDragProps) => {
  const itemRef = useRef<HTMLDivElement | null>(null)
  const itemDefaultDragHandleRef = useRef<HTMLDivElement | null>(null)
  const [isSubItemDragging, setIsSubItemDragging] = useState(false)
  const [navbarItemClosestEdge, setNavbarItemClosestEdge] =
    useState<Edge | null>(null)

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
        // SAFETY: JSON Forms control narrows schema/data to the expected editor shape
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
      draggable({
        dragHandle: dragHandleElement,
        element: itemElement,
        getInitialData: () => ({
          dropTargetId: getNavbarItemPath(index, parentIndex),
          navbarId: itemElement.dataset.id,
          type: "navbar-item",
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
          itemElement.style.opacity = "0.01"
          itemElement.classList.add("hide-trunk-line")
        },
      }),
      dropTargetForElements({
        element: itemElement,
        getData: ({ input, element }) =>
          attachClosestEdge(
            {
              type: "navbar-item",
              // SAFETY: JSON Forms control narrows schema/data to the expected editor shape
              navbarId: (element as HTMLDivElement).dataset.id,
              dropTargetId: getNavbarItemPath(index, parentIndex),
            },
            {
              allowedEdges: ["top", "bottom"],
              element,
              input,
            },
          ),
        getIsSticky: () => true,
        onDrag: handleDrag,
        onDragEnter: handleDrag,
        onDragLeave: () => {
          setNavbarItemClosestEdge(null)
        },
        onDrop: () => {
          setNavbarItemClosestEdge(null)
        },
      }),
    )
  }, [index, isSubItem, parentIndex])

  return {
    isSubItemDragging,
    itemDefaultDragHandleRef,
    itemRef,
    navbarItemClosestEdge,
  }
}
