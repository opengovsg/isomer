import { trpc } from "~/utils/trpc"

// Reuses the delete modal's reference-only count, opting in to container
// references too. Callers share the cache entry, so the modal can read the
// result (to gate confirmation, tag analytics) without mirroring it into state.
export const useUnpublishRedirectCount = ({
  pageId,
  siteId,
  enabled = true,
}: {
  pageId: number
  siteId: number
  enabled?: boolean
}) =>
  trpc.redirect.countByDestinationResource.useQuery(
    { siteId, resourceId: String(pageId), includeContainerReference: true },
    { enabled },
  )
