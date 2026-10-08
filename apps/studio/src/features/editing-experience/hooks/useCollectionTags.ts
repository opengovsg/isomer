import { trpc } from "~/utils/trpc"

import type { UseCollectionTagsInput } from "./collectionTagsTypes"

// Single source of truth for fetching published tag categories on a collection
// item (via resourceId). Callers gate UI on whether tags.length > 0 — e.g.
// JsonFormsTaggedControl, MetadataEditorStateDrawer, EditLinkPreview.

export type { CollectionTags } from "./collectionTagsTypes"

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
