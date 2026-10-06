import { Infobox } from "@opengovsg/design-system-react"
import { useEffect } from "react"
import { trpc } from "~/utils/trpc"

// Redirects whose destination resolves to this page dead-end once it's
// unpublished. Unlike deleting (which soft-deletes them), unpublishing leaves
// them in place, so this only warns — it never removes anything.
//
// Counting mirrors the delete modal exactly (same query): it's reference-only,
// so a redirect stored as a literal path or against a container id is out of
// scope here just as it is for delete — the count stays aligned with the set
// delete would actually remove.
export const UnpublishRedirectWarning = ({
  pageId,
  siteId,
  onPendingChange,
}: {
  pageId: number
  siteId: number
  // Lets the caller block confirmation until this check settles, so a user
  // can't unpublish before (or despite) seeing the warning.
  onPendingChange?: (isPending: boolean) => void
}) => {
  const {
    data: redirectCount,
    isPending,
    isError,
  } = trpc.redirect.countByDestinationResource.useQuery({
    siteId,
    resourceId: String(pageId),
  })

  useEffect(() => {
    onPendingChange?.(isPending)
  }, [isPending, onPendingChange])

  // A pending or failed check must not silently read as "no redirects": the
  // user could otherwise unpublish and break redirects without ever seeing the
  // warning. Surface both states instead of returning nothing.
  if (isPending) {
    return (
      <Infobox size="sm">
        Checking for redirects that point to this page…
      </Infobox>
    )
  }

  if (isError) {
    return (
      <Infobox variant="warning" size="sm">
        We couldn't check whether redirects point to this page. Any that do will
        stop working once it's unpublished.
      </Infobox>
    )
  }

  if (redirectCount === 0) {
    return null
  }

  return (
    <Infobox variant="warning" size="sm">
      {redirectCount === 1
        ? "1 redirect points"
        : `${redirectCount} redirects point`}{" "}
      to this page and will stop working once it's unpublished.
    </Infobox>
  )
}
