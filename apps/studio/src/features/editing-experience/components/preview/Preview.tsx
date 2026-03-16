import { Skeleton } from "@chakra-ui/react"

import type { PreviewProps } from "./PreviewWithCustomSitemap"
import { withSuspense } from "~/hocs/withSuspense"
import { trpc } from "~/utils/trpc"
import PreviewWithCustomSitemap from "./PreviewWithCustomSitemap"

function SuspendablePreview({
  siteId,
  resourceId,
  ...rest
}: Omit<PreviewProps, "siteMap"> & { resourceId: number }) {
  const [siteMap] = trpc.site.getLocalisedSitemap.useSuspenseQuery({
    siteId,
    resourceId,
  })

  return (
    <PreviewWithCustomSitemap {...rest} siteMap={siteMap} siteId={siteId} />
  )
}

const Preview = withSuspense(
  SuspendablePreview,
  <Skeleton width="100%" height="100%" />,
)
export default Preview
