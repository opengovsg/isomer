import type { CollectionPagePageProps } from "@opengovsg/isomer-components"
import { trpc } from "~/utils/trpc"

// Reads a collection item's parent collection's index-page content. Chains
// three lookups: item -> parent -> index page -> content. EditLinkPreview.tsx
// does the same chain via useSuspenseQuery for its own unrelated fields
// (showThumbnail/showDate) — keep both in sync if this lookup changes.

interface UseCollectionIndexPageInput {
  resourceId: string
  siteId: number
  enabled?: boolean
}

export function useCollectionIndexPage({
  resourceId,
  siteId,
  enabled = true,
}: UseCollectionIndexPageInput): {
  data: CollectionPagePageProps | undefined
  isError: boolean
} {
  const parentOf = trpc.resource.getParentOf.useQuery(
    { resourceId, siteId },
    { enabled },
  )

  const parentId = parentOf.data?.parent?.id
  const indexPage = trpc.folder.getIndexpage.useQuery(
    { resourceId: String(parentId ?? ""), siteId },
    { enabled: enabled && !!parentId },
  )

  const indexPageId = indexPage.data?.id
  const indexPageContent = trpc.page.readPageAndBlob.useQuery(
    { pageId: Number(indexPageId), siteId },
    { enabled: enabled && !!indexPageId },
  )

  return {
    data: indexPageContent.data?.content.page as
      | CollectionPagePageProps
      | undefined,
    isError: parentOf.isError || indexPage.isError || indexPageContent.isError,
  }
}
