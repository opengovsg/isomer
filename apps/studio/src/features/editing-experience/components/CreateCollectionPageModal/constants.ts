import { ResourceType } from "@isomer/db"

export const COLLECTION_ITEM_TYPES = [
  ResourceType.CollectionPage,
  ResourceType.CollectionLink,
] as const
export type CollectionItemType = (typeof COLLECTION_ITEM_TYPES)[number]
