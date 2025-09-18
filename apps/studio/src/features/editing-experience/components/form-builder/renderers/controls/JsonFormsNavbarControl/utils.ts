import type { Edge } from "@atlaskit/pragmatic-drag-and-drop-hitbox/dist/types/closest-edge"
import type { NavbarItemsSchema } from "@opengovsg/isomer-components"
import type { Static } from "@sinclair/typebox"
import { reorder } from "@atlaskit/pragmatic-drag-and-drop/reorder"
import cloneDeep from "lodash/cloneDeep"
import get from "lodash/get"
import set from "lodash/set"

export type NavbarItems = Static<typeof NavbarItemsSchema>

// Helper function to get the JSON Forms path of a navbar item or subitem
export const getNavbarItemPath = (index: number, parentIndex?: number) => {
  if (parentIndex !== undefined) {
    return `items.${parentIndex}.items.${index}`
  }

  return `items.${index}`
}

export const isSubItemPath = (path: string) => path.includes(".items.")

// Helper function to extract the indices from the navbar item path in the
// format "items.{index}" or "items.{parentIndex}.items.{index}"
const getNavbarItemIndices = (path: string) => {
  const pathSegments = path.split(".")

  if (pathSegments.length === 2) {
    return {
      index: Number(pathSegments[1]),
    }
  }

  if (pathSegments.length === 4) {
    return {
      index: Number(pathSegments[3]),
      parentIndex: Number(pathSegments[1]),
    }
  }

  throw new Error(`Invalid navbar item path: ${path}`)
}

// Helper function to insert a subitem into the navbar items at the specified
// parent index, creating the subitems array if it does not exist
const insertSubItem = (
  items: NavbarItems["items"],
  parentIndex: number,
  item: NavbarItems["items"][number],
) => {
  const data = cloneDeep(items)

  if (!items[parentIndex]?.items) {
    set(data, [parentIndex, "items"], [item])
  } else {
    data[parentIndex]?.items?.push(item)
  }

  return data
}

// Helper function to handle moving navbar items and subitems based on
// drag-and-drop operations. Returns the updated navbar items array.
export const handleMoveItem = (
  existingData: NavbarItems["items"],
  originalPath: string,
  newPath: string,
  instruction?: "reorder-before" | "reorder-after" | "combine",
  closestEdge?: Edge | null,
) => {
  // NOTE: A move is valid when:
  // 1. Moving subitems within the same parent list (reorder)
  // 2. Moving main items within the main list (reorder)
  // 3. Moving a subitem to become a main item (reorder)
  // 4. Moving a subitem to become a subitem of another main item (combine)
  // 5. Moving a main item to become a subitem of another main item, if
  //    the main item does not have any subitems (combine)
  // All other moves are invalid, and we should not update the data
  const isItemASubitem = isSubItemPath(originalPath)
  const isNewPathASubitem = isSubItemPath(newPath)
  const isCombineOperation = instruction === "combine"
  const isInstructionProvided = instruction !== undefined

  const isReorderingWithinSameList =
    !isCombineOperation &&
    isNewPathASubitem &&
    originalPath.split(".items.")[0] === newPath.split(".items.")[0]
  const isReorderingMainItems =
    !isCombineOperation && !isItemASubitem && !isNewPathASubitem
  const isMovingSubitemToBecomeMainItem =
    !isCombineOperation && isItemASubitem && !isNewPathASubitem
  const isCombiningSubitemToMainItem =
    // Case when someone drags the subitem over the unexpanded main item
    (isCombineOperation && isItemASubitem && !isNewPathASubitem) ||
    // Case when someone drags the subitem over the expanded main item
    (!isInstructionProvided &&
      isItemASubitem &&
      isNewPathASubitem &&
      !isReorderingWithinSameList)
  const isMovingSingleMainItemToBecomeSubitem =
    // Case when someone drags the main item over the unexpanded main item
    (isCombineOperation && !isItemASubitem) ||
    // Case when someone drags the main item over the expanded main item
    (!isInstructionProvided && !isItemASubitem && isNewPathASubitem)

  if (
    !isReorderingWithinSameList &&
    !isReorderingMainItems &&
    !isMovingSubitemToBecomeMainItem &&
    !isCombiningSubitemToMainItem &&
    !isMovingSingleMainItemToBecomeSubitem
  ) {
    return existingData
  }

  const data = cloneDeep<NavbarItems["items"]>(existingData)
  const moveItemIndices = getNavbarItemIndices(originalPath)
  const targetLocationIndices = getNavbarItemIndices(newPath)

  // Handle the combine case separately from reordering
  if (isMovingSingleMainItemToBecomeSubitem) {
    // Moving a main item to become a subitem of another main item
    const itemToMove = get({ items: data }, originalPath) as
      | NavbarItems["items"][number]
      | undefined

    if (
      !itemToMove ||
      (itemToMove.items !== undefined && itemToMove.items.length > 0)
    ) {
      return data
    }

    const newData = insertSubItem(
      data,
      targetLocationIndices.parentIndex ?? targetLocationIndices.index,
      itemToMove,
    )
    newData.splice(moveItemIndices.index, 1)
    return newData
  }

  if (isCombiningSubitemToMainItem && moveItemIndices.parentIndex) {
    // Moving a subitem to become a subitem of another main item,
    const itemToMove = data[moveItemIndices.parentIndex]?.items?.splice(
      moveItemIndices.index,
      1,
    )[0]

    if (!itemToMove) {
      return data
    }

    return insertSubItem(
      data,
      targetLocationIndices.parentIndex ?? targetLocationIndices.index,
      itemToMove,
    )
  }

  // Handle reordering cases
  const startIndex = moveItemIndices.index
  const finishIndex =
    instruction === "reorder-before" ||
    (instruction === undefined && closestEdge === "top")
      ? targetLocationIndices.index
      : targetLocationIndices.index + 1

  if (isReorderingWithinSameList) {
    return data.map((item, parentIndex) => {
      if (parentIndex === moveItemIndices.parentIndex) {
        return {
          ...item,
          items: reorder({
            list: item.items ?? [],
            startIndex,
            finishIndex,
          }),
        }
      }

      return item
    })
  }

  if (isReorderingMainItems) {
    // Reordering main items within the main list
    return reorder({
      list: data,
      startIndex,
      finishIndex,
    })
  }

  if (isMovingSubitemToBecomeMainItem) {
    // Moving a subitem to become a main item
    const itemToMove = get({ items: data }, originalPath) as
      | NavbarItems["items"][number]
      | undefined

    if (!itemToMove) {
      return data
    }

    const newData = [
      ...data.map((item, parentIndex) => {
        if (parentIndex === moveItemIndices.parentIndex) {
          return {
            ...item,
            items: item.items?.filter(
              (_, subItemIndex) => subItemIndex !== moveItemIndices.index,
            ),
          }
        }

        return item
      }),
      itemToMove,
    ]

    return reorder({
      list: newData,
      startIndex: newData.length - 1,
      finishIndex,
    })
  }

  // Exhausted all cases
  return data
}
