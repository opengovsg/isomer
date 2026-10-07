import { Infobox } from "@opengovsg/design-system-react"
import { useEffect } from "react"
import { trpc } from "~/utils/trpc"

// Warns when live redirects point to this page — unpublishing dead-ends them
// (unlike delete, it only warns; the redirects stay). Reuses the delete modal's
// reference-only count, opting in to container references too.
export const UnpublishRedirectWarning = ({
  pageId,
  siteId,
  onPendingChange,
  onRedirectCountChange,
}: {
  pageId: number
  siteId: number
  // Reports the check's loading state so the caller can gate confirmation.
  onPendingChange?: (isPending: boolean) => void
  // Reports the resolved count (undefined while pending or on error) so the
  // caller can tag its analytics with how many redirects were at stake.
  onRedirectCountChange?: (count: number | undefined) => void
}) => {
  const {
    data: redirectCount,
    isPending,
    isError,
  } = trpc.redirect.countByDestinationResource.useQuery({
    siteId,
    resourceId: String(pageId),
    includeContainerReference: true,
  })

  useEffect(() => {
    onPendingChange?.(isPending)
  }, [isPending, onPendingChange])

  useEffect(() => {
    onRedirectCountChange?.(redirectCount)
  }, [redirectCount, onRedirectCountChange])

  // A pending or failed check must not read as "no redirects" — show both.
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
