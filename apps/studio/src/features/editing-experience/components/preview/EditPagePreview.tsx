import type { IframeCallbackFnProps } from "~/types/dom"
import { Box } from "@chakra-ui/react"
import { merge } from "lodash-es"
import { useCallback } from "react"
import { createPortal } from "react-dom"
import { useEditorDrawerContext } from "~/contexts/EditorDrawerContext"
import { useBlockHighlight } from "~/features/editing-experience/hooks/useBlockHighlight"
import { withSuspense } from "~/hocs/withSuspense"
import { trpc } from "~/utils/trpc"

import { BlockHighlightOverlay } from "./BlockHighlightOverlay"
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
  const {
    previewPageState,
    pageId,
    updatedAt,
    siteId,
    permalink,
    title,
    hoveredBlockIndex,
    iframeDocument,
    setIframeDocument,
  } = useEditorDrawerContext()

  const [siteMap] = trpc.site.getLocalisedSitemap.useSuspenseQuery({
    siteId,
    resourceId: pageId,
  })

  const handleIframeMount = useCallback(
    ({ document }: IframeCallbackFnProps) => {
      setIframeDocument(document ?? null)
    },
    [setIframeDocument],
  )

  const { rect: highlightRect, label: highlightLabel } = useBlockHighlight({
    iframeDocument,
    hoveredBlockIndex,
    content: previewPageState.content,
  })

  return (
    <ViewportContainer siteId={siteId} callback={handleIframeMount}>
      <PreviewWithCustomSitemap
        {...merge(previewPageState, { page: { title } })}
        siteId={siteId}
        permalink={permalink}
        lastModified={updatedAt.toISOString()}
        version="0.1.0"
        siteMap={siteMap}
      />
      {/* Use a positioned overlay rather than styling the block directly —
      a background colour would paint behind the block's own content
      (invisible over opaque images/video), and an outline drawn on the
      block itself can only sit inside or across its edge, overlapping
      its content either way. */}
      {iframeDocument &&
        highlightRect &&
        createPortal(
          <BlockHighlightOverlay {...highlightRect} label={highlightLabel} />,
          iframeDocument.body,
        )}
    </ViewportContainer>
  )
}

export const EditPagePreview = withSuspense(
  SuspendableEditPagePreview,
  <LoadingState />,
)
