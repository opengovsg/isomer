/* oxlint-disable eslint/arrow-body-style -- core cleanup deferred */
import type { RouterOutput } from "~/utils/trpc"
import { trpc } from "~/utils/trpc"

// Single source of truth for fetching published tag categories on a collection
// item (via resourceId). Callers gate UI on whether tags.length > 0 — e.g.
// JsonFormsTaggedControl, MetadataEditorStateDrawer, EditLinkPreview.

export type CollectionTags = RouterOutput["collection"]["getCollectionTags"]

interface UseCollectionTagsInput {
  resourceId: number
  siteId: number
  enabled?: boolean
}

export const useCollectionTags = ({
  resourceId,
  siteId,
  enabled = true,
  // oxlint-disable-next-line eslint(arrow-body-style -- core cleanup deferred
}: UseCollectionTagsInput) => {
  return trpc.collection.getCollectionTags.useQuery(
    { resourceId, siteId },
    { enabled },
  )
}

export const useSuspenseCollectionTags = ({
  resourceId,
  siteId,
  // oxlint-disable-next-line eslint(arrow-body-style -- core cleanup deferred
}: Omit<UseCollectionTagsInput, "enabled">) => {
  return trpc.collection.getCollectionTags.useSuspenseQuery({
    resourceId,
    siteId,
  })
}
