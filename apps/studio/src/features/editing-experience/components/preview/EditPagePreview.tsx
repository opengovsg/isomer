import type { IframeCallbackFnProps } from "~/types/dom"
import { Box } from "@chakra-ui/react"
import { merge } from "lodash-es"
import { useCallback } from "react"
import { createPortal } from "react-dom"
import { useEditorDrawerContext } from "~/contexts/EditorDrawerContext"
import { useBlockFlashHighlight } from "~/features/editing-experience/hooks/useBlockFlashHighlight"
import { useBlockHighlight } from "~/features/editing-experience/hooks/useBlockHighlight"
import { usePreviewHoverDetection } from "~/features/editing-experience/hooks/usePreviewHoverDetection"
import { useSelectBlock } from "~/features/editing-experience/hooks/useSelectBlock"
import { getDrawerStateForBlock } from "~/features/editing-experience/utils/getDrawerStateForBlock"
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
    setHoveredBlockIndex,
    flashBlockIndex,
    setFlashBlockIndex,
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

  usePreviewHoverDetection(
    iframeDocument,
    previewPageState.content,
    setHoveredBlockIndex,
  )

  const { rect: highlightRect, label: highlightLabel } = useBlockHighlight({
    iframeDocument,
    hoveredBlockIndex,
    content: previewPageState.content,
  })

  const selectBlock = useSelectBlock()

  const handleEditClick = useCallback(() => {
    if (hoveredBlockIndex === null) return
    const block = previewPageState.content[hoveredBlockIndex]
    if (!block) return
    selectBlock(hoveredBlockIndex, getDrawerStateForBlock(block))
  }, [hoveredBlockIndex, previewPageState.content, selectBlock])

  const { rect: flashRect, label: flashLabel } = useBlockHighlight({
    iframeDocument,
    hoveredBlockIndex: flashBlockIndex,
    content: previewPageState.content,
  })

  const handleFlashEnd = useCallback(
    () => setFlashBlockIndex(null),
    [setFlashBlockIndex],
  )

  const { isFading: isFlashFading } = useBlockFlashHighlight({
    flashBlockIndex,
    onFlashEnd: handleFlashEnd,
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
          <BlockHighlightOverlay
            {...highlightRect}
            label={highlightLabel}
            onEditClick={handleEditClick}
          />,
          iframeDocument.body,
        )}
      {/* Deliberately rendered even when it overlaps the hover overlay above
      (e.g. clicking a block you're already hovering) — the flash's hold/fade
      timer starts at click time regardless of render state, so gating this
      on hover would let the timer run out before the block stops being
      hovered, cutting the flash short or skipping it entirely. Overlapping
      the identical hover overlay is visually a no-op. */}
      {iframeDocument &&
        flashRect &&
        createPortal(
          <BlockHighlightOverlay
            {...flashRect}
            label={flashLabel}
            isFading={isFlashFading}
          />,
          iframeDocument.body,
        )}
    </ViewportContainer>
  )
}

export const EditPagePreview = withSuspense(
  SuspendableEditPagePreview,
  <LoadingState />,
)
