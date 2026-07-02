import { trpc, type RouterOutput } from "~/utils/trpc"

// Single source of truth for fetching published tag categories on a collection
// item (via resourceId). Callers gate UI on whether tags.length > 0 — e.g.
// JsonFormsTaggedControl, MetadataEditorStateDrawer, EditLinkPreview.

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

export function useSuspenseCollectionTags({
  resourceId,
  siteId,
}: UseCollectionTagsInput) {
  return trpc.collection.getCollectionTags.useSuspenseQuery({
    resourceId,
    siteId,
  })
}
