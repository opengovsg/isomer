import type { NavbarItemsSchema } from "@opengovsg/isomer-components"
import type { Static } from "@sinclair/typebox"
import type { Tagged } from "type-fest"

export type NavbarItems = Static<typeof NavbarItemsSchema>
export type NavbarItemPath = Tagged<string, "NavbarItemPath">
export type MoveItemOperation =
  // Reordering subitems within the same parent list
  | "ReorderWithinSameList"
  // Reordering items within the main list
  | "ReorderMainItems"
  // Moving a subitem to become an item in the main list
  | "MoveSubitemToBecomeMainItem"
  // Moving a subitem to become a subitem in another parent's list
  | "CombineSubitemToMainItem"
  // Moving an item in the main list to become a subitem of another item in the
  // main list, provided that the item does not have any subitems
  | "MoveSingleMainItemToBecomeSubitem"
  // No other valid moves
  | "InvalidMove"
export interface NavbarItemIndices {
  index: number
  parentIndex?: number
}
