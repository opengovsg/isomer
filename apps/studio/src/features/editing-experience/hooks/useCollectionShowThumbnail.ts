import { trpc } from "~/utils/trpc"

// Single source of truth for fetching a collection's `showThumbnail` setting via
// one of its items (resourceId). The collection link preview needs this to render
// item thumbnails the same way the published collection page does.

interface UseCollectionShowThumbnailInput {
  resourceId: number
  siteId: number
}

export function useSuspenseCollectionShowThumbnail({
  resourceId,
  siteId,
}: UseCollectionShowThumbnailInput) {
  return trpc.collection.getCollectionShowThumbnail.useSuspenseQuery({
    resourceId,
    siteId,
  })
}
