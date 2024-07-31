import type { Item, ItemWithChild } from "./types"

export const isNestableItem = (item: Item): item is ItemWithChild => {
  return !!item.childPages
}
