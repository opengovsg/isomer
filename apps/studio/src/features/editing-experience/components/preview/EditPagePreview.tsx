import type { IsomerSchema } from "@opengovsg/isomer-components"
import type { IframeCallbackFnProps } from "~/types/dom"
import { Box, useDisclosure } from "@chakra-ui/react"
import { useToast } from "@opengovsg/design-system-react"
import { isEqual, merge } from "lodash-es"
import { useCallback, useEffect, useRef, useState } from "react"
import { createPortal } from "react-dom"
import { BRIEF_TOAST_SETTINGS } from "~/constants/toast"
import { useEditorDrawerContext } from "~/contexts/EditorDrawerContext"
import { useBlockFlashHighlight } from "~/features/editing-experience/hooks/useBlockFlashHighlight"
import { useBlockHighlight } from "~/features/editing-experience/hooks/useBlockHighlight"
import { usePreviewHoverDetection } from "~/features/editing-experience/hooks/usePreviewHoverDetection"
import { useSelectBlock } from "~/features/editing-experience/hooks/useSelectBlock"
import { useShowPreviewBlockHighlight } from "~/features/editing-experience/hooks/useShowPreviewBlockHighlight"
import { getDrawerStateForBlock } from "~/features/editing-experience/utils/getDrawerStateForBlock"
import {
  getPreviewBlockMove,
  reorderBlocks,
  shiftIndexAfterMove,
} from "~/features/editing-experience/utils/getPreviewBlockMove"
import { withSuspense } from "~/hocs/withSuspense"
import { trpc } from "~/utils/trpc"

import type { ViewportOptions } from "./IframeToolbar"
import { DiscardChangesModal } from "../DiscardChangesModal"
import { BlockHighlightOverlay } from "./BlockHighlightOverlay"
import { LoadingPreview } from "./LoadingPreview"
import PreviewWithCustomSitemap from "./PreviewWithCustomSitemap"
import { ViewportContainer } from "./ViewportContainer"

interface PendingBlockSelection {
  block: IsomerSchema["content"][number]
  index: number
}

interface ReorderSnapshot {
  preview: IsomerSchema
  saved: IsomerSchema
  hoveredBlockIndex: number | null
  currActiveIdx: number
  flashBlockIndex: number | null
  addedBlockIndex: number | null
}

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
    setPreviewPageState,
    savedPageState,
    setSavedPageState,
    currActiveIdx,
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
    setPreviewViewport,
    setCurrActiveIdx,
    addedBlockIndex,
    setAddedBlockIndex,
  } = useEditorDrawerContext()

  const {
    isOpen: isDiscardChangesModalOpen,
    onOpen: onDiscardChangesModalOpen,
    onClose: onDiscardChangesModalClose,
  } = useDisclosure()
  const [pendingBlockSelection, setPendingBlockSelection] =
    useState<PendingBlockSelection | null>(null)
  const [viewport, setViewport] = useState<ViewportOptions>("responsive")
  const showPreviewBlockHighlight = useShowPreviewBlockHighlight()

  const [siteMap] = trpc.site.getLocalisedSitemap.useSuspenseQuery({
    siteId,
    resourceId: pageId,
  })
  const [{ scheduledAt }] = trpc.page.readPage.useSuspenseQuery({
    pageId,
    siteId,
  })

  const handleIframeMount = useCallback(
    ({ document }: IframeCallbackFnProps) => {
      setIframeDocument(document ?? null)
    },
    [setIframeDocument],
  )

  useEffect(() => {
    setPreviewViewport(viewport)
  }, [viewport, setPreviewViewport])

  usePreviewHoverDetection(
    iframeDocument,
    previewPageState.content,
    setHoveredBlockIndex,
    showPreviewBlockHighlight,
  )

  const { rect: highlightRect, label: highlightLabel } = useBlockHighlight({
    iframeDocument,
    hoveredBlockIndex,
    content: previewPageState.content,
  })

  const selectBlock = useSelectBlock()
  const toast = useToast()
  const utils = trpc.useUtils()
  const reorderSnapshot = useRef<ReorderSnapshot | null>(null)
  const isReorderingRef = useRef(false)

  const { mutate: reorderBlock } = trpc.page.reorderBlock.useMutation({
    onSuccess: async () => {
      isReorderingRef.current = false
      reorderSnapshot.current = null
      await utils.page.readPage.invalidate({ pageId, siteId })
    },
    onError: (error) => {
      isReorderingRef.current = false
      const snapshot = reorderSnapshot.current
      if (snapshot) {
        setPreviewPageState(snapshot.preview)
        setSavedPageState(snapshot.saved)
        setHoveredBlockIndex(snapshot.hoveredBlockIndex)
        setCurrActiveIdx(snapshot.currActiveIdx)
        setFlashBlockIndex(snapshot.flashBlockIndex)
        setAddedBlockIndex(snapshot.addedBlockIndex)
        reorderSnapshot.current = null
      }
      toast({
        title: "Failed to update blocks",
        description: error.message,
        status: "error",
        ...BRIEF_TOAST_SETTINGS,
      })
    },
  })

  const blockMove =
    hoveredBlockIndex === null
      ? null
      : getPreviewBlockMove({
          page: previewPageState,
          savedContent: savedPageState.content,
          index: hoveredBlockIndex,
          isReorderBlocked: addedBlockIndex !== null || !!scheduledAt,
        })

  const handleMoveBlock = useCallback(
    (direction: "up" | "down") => {
      if (hoveredBlockIndex === null || isReorderingRef.current) return

      const move = getPreviewBlockMove({
        page: previewPageState,
        savedContent: savedPageState.content,
        index: hoveredBlockIndex,
        isReorderBlocked: addedBlockIndex !== null || !!scheduledAt,
      })
      const canMove = direction === "up" ? move.canMoveUp : move.canMoveDown
      if (!canMove) return

      const from = hoveredBlockIndex
      const to = direction === "up" ? from - 1 : from + 1
      // Saved content is what the server compares against. Preview content can
      // still hold an in-progress edit, so both lists move by the same indices
      // and that edit stays on its block.
      const nextSavedContent = reorderBlocks(savedPageState.content, from, to)
      const nextPreviewContent = reorderBlocks(
        previewPageState.content,
        from,
        to,
      )

      reorderSnapshot.current = {
        preview: previewPageState,
        saved: savedPageState,
        hoveredBlockIndex,
        currActiveIdx,
        flashBlockIndex,
        addedBlockIndex,
      }
      isReorderingRef.current = true

      if (currActiveIdx >= 0) {
        setCurrActiveIdx(shiftIndexAfterMove(currActiveIdx, from, to))
      }
      setHoveredBlockIndex(to)
      if (flashBlockIndex !== null) {
        setFlashBlockIndex(shiftIndexAfterMove(flashBlockIndex, from, to))
      }
      if (addedBlockIndex !== null) {
        setAddedBlockIndex(shiftIndexAfterMove(addedBlockIndex, from, to))
      }
      setSavedPageState({ ...savedPageState, content: nextSavedContent })
      setPreviewPageState({
        ...previewPageState,
        content: nextPreviewContent,
      })

      reorderBlock({
        pageId,
        siteId,
        from,
        to,
        blocks: savedPageState.content,
      })
    },
    [
      addedBlockIndex,
      currActiveIdx,
      flashBlockIndex,
      hoveredBlockIndex,
      pageId,
      previewPageState,
      reorderBlock,
      savedPageState,
      scheduledAt,
      setAddedBlockIndex,
      setCurrActiveIdx,
      setFlashBlockIndex,
      setHoveredBlockIndex,
      setPreviewPageState,
      setSavedPageState,
      siteId,
    ],
  )

  const handleEditClick = useCallback(() => {
    if (hoveredBlockIndex === null) return
    const block = previewPageState.content[hoveredBlockIndex]
    if (!block) return
    const nextDrawerState = getDrawerStateForBlock(block)

    const hasUnsavedChanges = !isEqual(previewPageState, savedPageState)
    if (hasUnsavedChanges && hoveredBlockIndex !== currActiveIdx) {
      setPendingBlockSelection({ block, index: hoveredBlockIndex })
      onDiscardChangesModalOpen()
      return
    }
    selectBlock(hoveredBlockIndex, nextDrawerState)
  }, [
    hoveredBlockIndex,
    previewPageState,
    savedPageState,
    currActiveIdx,
    selectBlock,
    onDiscardChangesModalOpen,
  ])

  const handleDiscardChangesModalClose = useCallback(() => {
    setPendingBlockSelection(null)
    onDiscardChangesModalClose()
  }, [onDiscardChangesModalClose])

  const handleDiscardChanges = useCallback(() => {
    setPreviewPageState(savedPageState)
    onDiscardChangesModalClose()
    if (pendingBlockSelection) {
      const { block, index } = pendingBlockSelection
      let idx = savedPageState.content.findIndex((b) => isEqual(b, block))
      if (idx === -1) {
        const savedBlock = savedPageState.content[index]
        if (savedBlock?.type === block.type) {
          idx = index
        }
      }
      if (idx !== -1) {
        const restoredBlock = savedPageState.content[idx]
        if (restoredBlock) {
          selectBlock(idx, getDrawerStateForBlock(restoredBlock))
        }
      }
      setPendingBlockSelection(null)
    }
  }, [
    savedPageState,
    setPreviewPageState,
    onDiscardChangesModalClose,
    pendingBlockSelection,
    selectBlock,
  ])

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
    <>
      <ViewportContainer
        siteId={siteId}
        callback={handleIframeMount}
        viewport={viewport}
        onViewportChange={setViewport}
      >
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
        {showPreviewBlockHighlight &&
          iframeDocument &&
          highlightRect &&
          createPortal(
            <BlockHighlightOverlay
              {...highlightRect}
              label={highlightLabel}
              onEditClick={handleEditClick}
              onMoveUp={
                blockMove?.showMoveControls
                  ? () => handleMoveBlock("up")
                  : undefined
              }
              onMoveDown={
                blockMove?.showMoveControls
                  ? () => handleMoveBlock("down")
                  : undefined
              }
              canMoveUp={blockMove?.canMoveUp}
              canMoveDown={blockMove?.canMoveDown}
            />,
            iframeDocument.body,
          )}
        {/* Deliberately rendered even when it overlaps the hover overlay above
        (e.g. clicking a block you're already hovering) — the flash's hold/fade
        timer starts at click time regardless of render state, so gating this
        on hover would let the timer run out before the block stops being
        hovered, cutting the flash short or skipping it entirely. Overlapping
        the identical hover overlay is visually a no-op. */}
        {showPreviewBlockHighlight &&
          iframeDocument &&
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
      {/* Outside the preview iframe: Chakra portals into ownerDocument.body,
          and the iframe only loads site CSS, so the dialog would be unstyled.
          Do not restore focus or lock scroll into the iframe — that focuses
          "Skip to main content" and jumps the preview to the top. */}
      <DiscardChangesModal
        isOpen={isDiscardChangesModalOpen}
        onClose={handleDiscardChangesModalClose}
        onDiscard={handleDiscardChanges}
        returnFocusOnClose={false}
        blockScrollOnMount={false}
        lockFocusAcrossFrames={false}
      />
    </>
  )
}

export const EditPagePreview = withSuspense(
  SuspendableEditPagePreview,
  <LoadingState />,
)
