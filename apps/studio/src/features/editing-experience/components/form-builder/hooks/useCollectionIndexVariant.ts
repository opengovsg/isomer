import type { CollectionPagePageProps } from "@opengovsg/isomer-components"
import { trpc } from "~/utils/trpc"

/**
 * Resolves the "Layout" setting (collection-variant format: "collection" =
 * 1-column CollectionCard, "blog" = 2-column BlogCard) of a collection
 * item's parent collection index page. Used so the thumbnail adjustment
 * preview mimics what the editor has already chosen there, instead of
 * showing every possible destination.
 *
 * Chains three page/resource lookups (collection item → parent collection →
 * its index page → that page's content) since nothing else fetches the
 * parent collection's content as a side effect of opening one of its items.
 * Disabled entirely unless the field being resolved is actually a collection
 * thumbnail, so every other image field's render stays free of this.
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

  const variant = (indexPageContent?.content.page as CollectionPagePageProps)
    ?.variant

  return variant === "blog"
    ? "blog"
    : variant === "collection"
      ? variant
      : undefined
}
