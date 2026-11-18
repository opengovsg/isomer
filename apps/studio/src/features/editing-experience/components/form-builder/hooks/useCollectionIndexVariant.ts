import { useCollectionIndexPage } from "~/features/editing-experience/hooks/useCollectionIndexPage"

/**
 * Reads the "Layout" setting ("collection" or "blog") from the index page of
 * a collection item's parent collection, so the thumbnail preview matches it.
 * Returns "pending" while loading or on failure, and the registry then shows
 * "Preview unavailable" instead of guessing a frame.
 */
export const useCollectionIndexVariant = ({
  siteId,
  pageId,
  enabled,
}: {
  siteId: number
  pageId: number
  enabled: boolean
}): "collection" | "blog" | "pending" => {
  const { data } = useCollectionIndexPage({
    resourceId: String(pageId),
    siteId,
    enabled,
  })

  // A new collection saves no layout, and the published site then renders
  // "collection". Only a page that hasn't loaded is pending.
  if (!data) return "pending"
  return data.variant ?? "collection"
}
