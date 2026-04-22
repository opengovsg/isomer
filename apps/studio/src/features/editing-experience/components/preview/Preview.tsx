import { Skeleton } from "@chakra-ui/react"
import { withSuspense } from "~/hocs/withSuspense"
import { trpc } from "~/utils/trpc"

import type { PreviewProps } from "./PreviewWithCustomSitemap"
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

  // Type narrowing issue: PreviewProps is a union and can't narrow from rest params
  return (
    <PreviewWithCustomSitemap
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      {...(rest as any)}
      siteMap={siteMap}
      siteId={siteId}
    />
  )
}

const Preview = withSuspense(
  SuspendablePreview,
  <Skeleton width="100%" height="100%" />,
)
export default Preview
