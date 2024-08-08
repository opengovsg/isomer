export const COLLECTION_ITEM_TYPES = ["page", "pdf"] as const
export type CollectionItemType = (typeof COLLECTION_ITEM_TYPES)[number]
