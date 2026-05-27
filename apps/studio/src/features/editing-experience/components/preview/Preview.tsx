import { Skeleton } from "@chakra-ui/react"
import { withSuspense } from "~/hocs/withSuspense"
import { trpc } from "~/utils/trpc"

import type { PreviewProps } from "./PreviewWithCustomSitemap"
import PreviewWithCustomSitemap from "./PreviewWithCustomSitemap"

// TypeScript's Omit collapses discriminated unions. This assertion function
// narrows `Omit<PreviewProps, "siteMap"> & Pick<PreviewProps, "siteMap">` to PreviewProps,
// which is structurally equivalent but TypeScript can't infer automatically.
function assertIsPreviewProps(
  _props: Omit<PreviewProps, "siteMap"> & Pick<PreviewProps, "siteMap">,
): asserts _props is PreviewProps {
  // Structural equivalence - no runtime check needed
}

function SuspendablePreview(
  props: Omit<PreviewProps, "siteMap"> & { resourceId: number },
) {
  const { resourceId, siteId } = props
  const [siteMap] = trpc.site.getLocalisedSitemap.useSuspenseQuery({
    siteId,
    resourceId,
  })

  const { resourceId: _, ...rest } = props
  const previewProps = { ...rest, siteMap }
  assertIsPreviewProps(previewProps)
  return <PreviewWithCustomSitemap {...previewProps} />
}

const Preview = withSuspense(
  SuspendablePreview,
  <Skeleton width="100%" height="100%" />,
)
export default Preview
