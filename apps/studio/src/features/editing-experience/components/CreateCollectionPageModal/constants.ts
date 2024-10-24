import { ResourceType } from "~prisma/generated/generatedEnums"

export const COLLECTION_ITEM_TYPES = [
  ResourceType.CollectionPage,
  ResourceType.CollectionLink,
] as const
export type CollectionItemType = (typeof COLLECTION_ITEM_TYPES)[number]
