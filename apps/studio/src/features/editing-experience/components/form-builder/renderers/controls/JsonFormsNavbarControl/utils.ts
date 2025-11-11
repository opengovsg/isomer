import type { Edge } from "@atlaskit/pragmatic-drag-and-drop-hitbox/dist/types/closest-edge"
import { reorder } from "@atlaskit/pragmatic-drag-and-drop/reorder"
import cloneDeep from "lodash/cloneDeep"
import get from "lodash/get"
import set from "lodash/set"

import type {
  MoveItemOperation,
  NavbarItemIndices,
  NavbarItemPath,
  NavbarItems,
} from "./types"

// Helper function to get the JSON Forms path of a navbar item or subitem
export const getNavbarItemPath = (
  index: number,
  parentIndex?: number,
): NavbarItemPath => {
  if (parentIndex !== undefined) {
    return `items.${parentIndex}.items.${index}` as NavbarItemPath
  }

  return `items.${index}` as NavbarItemPath
}

export const isSubItemPath = (path: string): path is NavbarItemPath =>
  path.includes(".items.")

export const getInstancePathFromNavbarItemPath = (path: NavbarItemPath) => {
  return `/${path.replace(/\./g, "/")}`
}

// Helper function to extract the indices from the navbar item path in the
// format "items.{index}" or "items.{parentIndex}.items.{index}"
const getNavbarItemIndices = (path: string): NavbarItemIndices => {
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

// Helper function to determine the final index to be dropped into
const getFinishIndex = (
  moveItemIndices: NavbarItemIndices,
  targetLocationIndices: NavbarItemIndices,
  closestEdge?: Edge | null,
) => {
  const startIndex = moveItemIndices.index
  const finishIndex = targetLocationIndices.index

  if (closestEdge === "top" && startIndex < finishIndex) {
    return finishIndex - 1
  }

  if (closestEdge === "bottom" && startIndex > finishIndex) {
    return finishIndex + 1
  }

  return finishIndex
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

// Helper function to determine the move item operation type, based on the
// parameters provided
export const getMoveItemOperation = (
  originalPath: string,
  newPath: string,
  instruction?: "reorder-before" | "reorder-after" | "combine",
): MoveItemOperation => {
  const isItemASubitem = isSubItemPath(originalPath)
  const isNewPathASubitem = isSubItemPath(newPath)
  const isCombineOperation = instruction === "combine"
  const isInstructionProvided = instruction !== undefined

  if (
    !isCombineOperation &&
    isNewPathASubitem &&
    originalPath.split(".items.")[0] === newPath.split(".items.")[0]
  ) {
    return "ReorderWithinSameList"
  }

  if (!isCombineOperation && !isItemASubitem && !isNewPathASubitem) {
    return "ReorderMainItems"
  }

  if (!isCombineOperation && isItemASubitem && !isNewPathASubitem) {
    return "MoveSubitemToBecomeMainItem"
  }

  if (
    // Case when someone drags the subitem over the unexpanded main item
    (isCombineOperation && isItemASubitem && !isNewPathASubitem) ||
    // Case when someone drags the subitem over the expanded main item
    (!isInstructionProvided && isItemASubitem && isNewPathASubitem)
  ) {
    return "CombineSubitemToMainItem"
  }

  if (
    // Case when someone drags the main item over the unexpanded main item
    (isCombineOperation && !isItemASubitem) ||
    // Case when someone drags the main item over the expanded main item
    (!isInstructionProvided && !isItemASubitem && isNewPathASubitem)
  ) {
    return "MoveSingleMainItemToBecomeSubitem"
  }

  return "InvalidMove"
}

// Handle moving main items to become a subitem of another main item
const moveSingleMainItemToBecomeSubitem = (
  data: NavbarItems["items"],
  originalPath: string,
  moveItemIndices: NavbarItemIndices,
  targetLocationIndices: NavbarItemIndices,
) => {
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

// Handle moving subitem from one parent to another
const moveSubItemToBecomeSubItemOfAnother = (
  data: NavbarItems["items"],
  moveItemIndices: NavbarItemIndices,
  targetLocationIndices: NavbarItemIndices,
) => {
  if (moveItemIndices.parentIndex === undefined) {
    return data
  }

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

// Handle reordering a subitem within the same parent list
const reorderWithinSameList = (
  data: NavbarItems["items"],
  moveItemIndices: NavbarItemIndices,
  startIndex: number,
  finishIndex: number,
) =>
  data.map((item, parentIndex) => {
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

// Handle moving a subitem to become a main item
const moveSubItemToBecomeMainItem = (
  data: NavbarItems["items"],
  isMaxItemsReached: boolean,
  originalPath: string,
  moveItemIndices: NavbarItemIndices,
  targetLocationIndices: NavbarItemIndices,
  closestEdge?: Edge | null,
) => {
  if (isMaxItemsReached) {
    // Disallow subitems from being dropped into the main navbar if the
    // maxItems limit has been reached
    return data
  }

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

  const finishIndex = getFinishIndex(
    { index: newData.length - 1 },
    targetLocationIndices,
    closestEdge,
  )

  return reorder({
    list: newData,
    startIndex: newData.length - 1,
    finishIndex,
  })
}

// Helper function to handle moving navbar items and subitems based on
// drag-and-drop operations. Returns the updated navbar items array.
export const handleMoveItem = (
  existingData: NavbarItems["items"],
  isMaxItemsReached: boolean,
  originalPath: string,
  newPath: string,
  instruction?: "reorder-before" | "reorder-after" | "combine",
  closestEdge?: Edge | null,
) => {
  const operation = getMoveItemOperation(originalPath, newPath, instruction)

  if (operation === "InvalidMove") {
    return existingData
  }

  const data = cloneDeep<NavbarItems["items"]>(existingData)
  const moveItemIndices = getNavbarItemIndices(originalPath)
  const targetLocationIndices = getNavbarItemIndices(newPath)
  // Used for reordering operations
  const startIndex = moveItemIndices.index
  const finishIndex = getFinishIndex(
    moveItemIndices,
    targetLocationIndices,
    closestEdge,
  )

  switch (operation) {
    case "MoveSingleMainItemToBecomeSubitem":
      return moveSingleMainItemToBecomeSubitem(
        data,
        originalPath,
        moveItemIndices,
        targetLocationIndices,
      )
    case "CombineSubitemToMainItem":
      return moveSubItemToBecomeSubItemOfAnother(
        data,
        moveItemIndices,
        targetLocationIndices,
      )
    case "ReorderWithinSameList":
      return reorderWithinSameList(
        data,
        moveItemIndices,
        startIndex,
        finishIndex,
      )
    case "ReorderMainItems":
      return reorder({
        list: data,
        startIndex,
        finishIndex,
      })
    case "MoveSubitemToBecomeMainItem":
      return moveSubItemToBecomeMainItem(
        data,
        isMaxItemsReached,
        originalPath,
        moveItemIndices,
        targetLocationIndices,
        closestEdge,
      )
    default:
      const _: never = operation
      return data
  }
}
