import { Box } from "@chakra-ui/react"
import { merge } from "lodash-es"
import { useEditorDrawerContext } from "~/contexts/EditorDrawerContext"
import { withSuspense } from "~/hocs/withSuspense"
import { trpc } from "~/utils/trpc"

import { LoadingPreview } from "./LoadingPreview"
import PreviewWithCustomSitemap from "./PreviewWithCustomSitemap"
import { ViewportContainer } from "./ViewportContainer"

const LoadingState = (): JSX.Element => {
  return (
    <Box bg="base.canvas.backdrop" height="100%" flexDirection="column">
      <Box
        px="2rem"
        pb="2rem"
        pt="1rem"
        overflowX="auto"
        height="100%"
        width="100%"
      >
        <LoadingPreview />
      </Box>
    </Box>
  )
}

const SuspendableEditPagePreview = (): JSX.Element => {
  const { previewPageState, pageId, updatedAt, siteId, permalink, title } =
    useEditorDrawerContext()

  const [siteMap] = trpc.site.getLocalisedSitemap.useSuspenseQuery({
    siteId,
    resourceId: pageId,
  })

  return (
    <ViewportContainer siteId={siteId}>
      <PreviewWithCustomSitemap
        {...merge(previewPageState, { page: { title } })}
        siteId={siteId}
        permalink={permalink}
        lastModified={updatedAt.toISOString()}
        version="0.1.0"
        siteMap={siteMap}
      />
    </ViewportContainer>
  )
}

export const EditPagePreview = withSuspense(
  SuspendableEditPagePreview,
  <LoadingState />,
)
