import { trpc, type RouterOutput } from "~/utils/trpc"

// Single source of truth for fetching published tag categories on a collection
// item (via resourceId). Callers gate UI on whether tags.length > 0 — e.g.
// JsonFormsTaggedControl, MetadataEditorStateDrawer, EditLinkPreview.

export type CollectionTags = RouterOutput["collection"]["getCollectionTags"]

interface UseCollectionTagsQueryInput {
  resourceId: number
  siteId: number
  enabled?: boolean
}

interface UseCollectionTagsSuspenseInput {
  resourceId: number
  siteId: number
}

export function useCollectionTags({
  resourceId,
  siteId,
  enabled = true,
}: UseCollectionTagsQueryInput) {
  return trpc.collection.getCollectionTags.useQuery(
    { resourceId, siteId },
    { enabled },
  )
}

export function useSuspenseCollectionTags({
  resourceId,
  siteId,
}: UseCollectionTagsSuspenseInput) {
  return trpc.collection.getCollectionTags.useSuspenseQuery({
    resourceId,
    siteId,
  })
}
