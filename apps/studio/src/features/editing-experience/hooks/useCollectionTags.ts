import { trpc, type RouterOutput } from "~/utils/trpc"

export type CollectionTags = RouterOutput["collection"]["getCollectionTags"]

interface UseCollectionTagsInput {
  resourceId: number
  siteId: number
  enabled?: boolean
}

export function useCollectionTags({
  resourceId,
  siteId,
  enabled = true,
}: UseCollectionTagsInput) {
  return trpc.collection.getCollectionTags.useQuery(
    { resourceId, siteId },
    { enabled },
  )
}

export function useCollectionTagsSuspense({
  resourceId,
  siteId,
}: Omit<UseCollectionTagsInput, "enabled">) {
  return trpc.collection.getCollectionTags.useSuspenseQuery({
    resourceId,
    siteId,
  })
}
