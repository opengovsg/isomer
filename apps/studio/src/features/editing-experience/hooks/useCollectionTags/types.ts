import type { RouterOutput } from "~/utils/trpc"

export type CollectionTags = RouterOutput["collection"]["getCollectionTags"]

export interface UseCollectionTagsInput {
  resourceId: number
  siteId: number
  enabled?: boolean
}
