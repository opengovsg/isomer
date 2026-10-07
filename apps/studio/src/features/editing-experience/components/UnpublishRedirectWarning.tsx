import { Infobox } from "@opengovsg/design-system-react"

import { useUnpublishRedirectCount } from "../hooks/useUnpublishRedirectCount"

// Warns when live redirects point to this page — unpublishing dead-ends them
// (unlike delete, it only warns; the redirects stay).
export const UnpublishRedirectWarning = ({
  pageId,
  siteId,
}: {
  pageId: number
  siteId: number
}) => {
  const {
    data: redirectCount,
    isPending,
    isError,
  } = useUnpublishRedirectCount({ pageId, siteId })

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
