import type { CollectionPagePageProps } from "@opengovsg/isomer-components"
import { trpc } from "~/utils/trpc"

/**
 * Reads the "Layout" setting ("collection" or "blog") from the index page of
 * a collection item's parent collection, so the thumbnail preview matches it.
 * Chains three lookups: item, parent collection, index page content.
 * Returns undefined while loading or on failure, and the registry then falls
 * back to the "collection" shape.
 */
export const useCollectionIndexVariant = ({
  siteId,
  pageId,
  enabled,
}: {
  siteId: number
  pageId: number
  enabled: boolean
}): "collection" | "blog" | undefined => {
  const { data: parentOf } = trpc.resource.getParentOf.useQuery(
    { siteId, resourceId: String(pageId) },
    { enabled },
  )

  const parentId = parentOf?.parent?.id
  const { data: indexPage } = trpc.folder.getIndexpage.useQuery(
    { siteId, resourceId: String(parentId) },
    { enabled: enabled && !!parentId },
  )

  const indexPageId = indexPage?.id
  const { data: indexPageContent } = trpc.page.readPageAndBlob.useQuery(
    { siteId, pageId: Number(indexPageId) },
    { enabled: enabled && !!indexPageId },
  )

  return (indexPageContent?.content.page as CollectionPagePageProps)?.variant
}
