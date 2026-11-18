import type { CollectionPagePageProps } from "@opengovsg/isomer-components"
import { trpc } from "~/utils/trpc"

/**
 * Reads the "Layout" setting ("collection" or "blog") from the index page of
 * a collection item's parent collection, so the thumbnail preview matches it.
 * Chains three lookups: item, parent collection, index page content.
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
  const { data: parentOf } = trpc.resource.getParentOf.useQuery(
    { siteId, resourceId: String(pageId) },
    { enabled },
  )

  const parentId = parentOf?.parent?.id
  const { data: indexPage } = trpc.folder.getIndexpage.useQuery(
    { siteId, resourceId: String(parentId ?? "") },
    { enabled: enabled && !!parentId },
  )

  const indexPageId = indexPage?.id
  const { data: indexPageContent } = trpc.page.readPageAndBlob.useQuery(
    { siteId, pageId: Number(indexPageId) },
    { enabled: enabled && !!indexPageId },
  )

  // A new collection saves no layout, and the published site then renders
  // "collection". Only a page that hasn't loaded is pending.
  if (!indexPageContent) return "pending"
  const page = indexPageContent.content.page as CollectionPagePageProps
  return page.variant ?? "collection"
}
