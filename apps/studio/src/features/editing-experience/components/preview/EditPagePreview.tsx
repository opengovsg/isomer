import type { IframeCallbackFnProps } from "~/types/dom"
import { Box } from "@chakra-ui/react"
import { getComponentSchema } from "@opengovsg/isomer-components"
import { merge } from "lodash-es"
import { useCallback, useEffect, useRef, useState } from "react"
import { PROSE_COMPONENT_NAME } from "~/constants/formBuilder"
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
  const {
    previewPageState,
    pageId,
    updatedAt,
    siteId,
    permalink,
    title,
    hoveredBlockIndex,
  } = useEditorDrawerContext()

  const [siteMap] = trpc.site.getLocalisedSitemap.useSuspenseQuery({
    siteId,
    resourceId: pageId,
  })

  const [iframeDocument, setIframeDocument] = useState<Document | null>(null)
  const overlayElRef = useRef<HTMLDivElement | null>(null)

  const handleIframeMount = useCallback(
    ({ document }: IframeCallbackFnProps) => {
      setIframeDocument(document ?? null)
    },
    [],
  )

  useEffect(() => {
    // Clear any previously-applied highlight overlay
    overlayElRef.current?.remove()
    overlayElRef.current = null

    if (hoveredBlockIndex !== null && iframeDocument) {
      // Blocks aren't individually wrapped (that broke the `first:mt-*`-style
      // spacing most block components use), so instead we index directly
      // into the children of the shared content container.
      const contentBlocksContainer = iframeDocument.querySelector(
        "[data-isomer-content-blocks]",
      )
      const blockEl = contentBlocksContainer?.children[hoveredBlockIndex] as
        | HTMLElement
        | undefined

      if (blockEl) {
        // Use a positioned overlay rather than styling the block directly —
        // a background colour would paint behind the block's own content
        // (invisible over opaque images/video), and an outline drawn on the
        // block itself can only sit inside or across its edge, overlapping
        // its content either way.
        const scrollX = iframeDocument.defaultView?.scrollX ?? 0
        const scrollY = iframeDocument.defaultView?.scrollY ?? 0
        const rect = blockEl.getBoundingClientRect()

        const overlay = iframeDocument.createElement("div")
        overlay.style.position = "absolute"
        overlay.style.top = `${rect.top + scrollY}px`
        overlay.style.left = `${rect.left + scrollX}px`
        overlay.style.width = `${rect.width}px`
        overlay.style.height = `${rect.height}px`
        overlay.style.outline = "2px solid #2164DA"
        overlay.style.outlineOffset = "2px"
        overlay.style.backgroundColor = "rgba(33, 100, 218, 0.12)"
        overlay.style.pointerEvents = "none"
        overlay.style.zIndex = "9999"

        const block = previewPageState.content[hoveredBlockIndex]
        if (block) {
          const blockComponentName =
            block.type === "prose"
              ? PROSE_COMPONENT_NAME
              : (getComponentSchema({ component: block.type }).title ??
                "Unknown")

          const label = iframeDocument.createElement("div")
          label.textContent = blockComponentName
          label.style.position = "absolute"
          label.style.top = "0"
          label.style.right = "0"
          label.style.padding = "2px 8px"
          label.style.fontSize = "12px"
          label.style.lineHeight = "1.5"
          label.style.color = "white"
          label.style.backgroundColor = "#2164DA"
          label.style.borderRadius = "0 0 0 6px"
          overlay.appendChild(label)
        }

        iframeDocument.body.appendChild(overlay)
        overlayElRef.current = overlay
      }
    }

    return () => {
      overlayElRef.current?.remove()
      overlayElRef.current = null
    }
  }, [hoveredBlockIndex, iframeDocument, previewPageState])

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
    </ViewportContainer>
  )
}

export const EditPagePreview = withSuspense(
  SuspendableEditPagePreview,
  <LoadingState />,
)
