import { Infobox } from "@opengovsg/design-system-react"
import { useOptionalStep } from "~/hooks/usePosthogCapture"
import { trpc } from "~/utils/trpc"

// Warns when live redirects point to this page — unpublishing dead-ends them
// (unlike delete, it only warns; the redirects stay).
export const UnpublishRedirectWarning = ({
  pageId,
  siteId,
}: {
  pageId: number
  siteId: number
}) => {
  // Reuses the delete modal's reference-only count, opting in to container
  // references too. Both modals share this cache entry (same query key).
  const {
    data: redirectCount,
    isPending,
    isError,
  } = trpc.redirect.countByDestinationResource.useQuery({
    siteId,
    resourceId: String(pageId),
    includeContainerReference: true,
  })

  // Funnel checkpoint: fires once the count resolves, tagged skipped when there
  // were no redirects — so "warned about N and proceeded" is distinguishable
  // from "nothing to warn about". An errored check stays un-fired (unknown).
  useOptionalStep({
    event: "unpublish_redirect_warning",
    isReady: !isPending && !isError,
    isBypassed: redirectCount === 0,
    properties: { site_id: siteId, redirect_count: redirectCount ?? 0 },
  })

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
