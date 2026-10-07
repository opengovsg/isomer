"use client"

import type {
  IsomerComponent,
  IsomerSiteProps,
  ImageAdjustment,
} from "@opengovsg/isomer-components"
import type { IframeCallbackFnProps } from "~/types/dom"
import { Box, Flex, Skeleton, Text, VStack } from "@chakra-ui/react"
import { renderComponent } from "@opengovsg/isomer-components"
import { useCallback, useEffect, useRef, useState } from "react"
import Suspense from "~/components/Suspense"
import { PreviewIframe } from "~/features/editing-experience/components/preview/PreviewIframe"
import { useSiteThemeCssVars } from "~/features/preview/hooks/useSiteThemeCssVars"
import { bakeImage, canBakeImage } from "~/lib/imageBake"
import { ASSETS_BASE_URL, generateAssetUrl } from "~/utils/generateAssetUrl"

import type {
  AdjustmentPreviewState,
  AdjustmentScrim,
} from "./AdjustmentConfig"

// Minimal site stub for an ISOLATED single-block preview — there is no real
// page/nav/footer context here (this renders one block, not a whole page), so
// only the fields HeroGradient/Contentpic actually read (assetsBaseUrl,
// siteMapArray for reference-link resolution, which degrades gracefully to
// the raw link on a miss) are populated. Mirrors the same escape hatch
// PreviewWithCustomSitemap.tsx already uses for its own site prop.
const PREVIEW_SITE_STUB = {
  assetsBaseUrl: ASSETS_BASE_URL,
  siteMapArray: [],
} as unknown as IsomerSiteProps

interface AdjustmentPreviewProps {
  src: string
  // The TRUE original's raw stored path (e.g. "/1/uuid/file.png"), resolved
  // once by the parent modal via resolveOriginalKey — the bake input must
  // always be the original, never a previous bake (RFC: re-encode loss must
  // not compound). On a first edit this equals `src`; on a re-edit, `src` is
  // the previous bake and only this points at the true original.
  originalSrc: string
  adjustment?: ImageAdjustment
  previewStates: AdjustmentPreviewState[]
  scrim?: AdjustmentScrim
  // The real block content + the field name holding the image, so the real
  // published component can be rendered (real copy/scrim/frame) instead of
  // the framed-<img> approximation below. Falls back to the approximation
  // when absent or when rendering the real component fails for any reason.
  block?: unknown
  imageFieldName?: string
  // Needed to pull the site's brand theme CSS vars into the preview iframe —
  // without them, classes like `bg-brand-canvas-inverse` resolve to nothing.
  siteId: number
}

// Fixed on-screen DISPLAY WIDTH per breakpoint, shared by every component's
// preview — narrower for mobile, wider for tablet/desktop. This alone tends
// to produce portrait-looking mobile frames and landscape-looking
// tablet/desktop frames, since that mirrors how each component's own
// responsive layout actually behaves at those widths (e.g. mobile widths
// stack content vertically). The resulting HEIGHT is never guessed or
// capped — see PreviewFrame — so nothing is ever cropped or hidden behind a
// scrollbar; what's shown always exactly matches the real published result.
const FRAME_DISPLAY_WIDTH: Record<string, number> = {
  mobile: 140,
  tablet: 220,
  desktop: 320,
}
const DEFAULT_FRAME_DISPLAY_WIDTH = 220

export const AdjustmentPreview = ({
  src,
  originalSrc,
  adjustment,
  previewStates,
  scrim,
  block,
  imageFieldName,
  siteId,
}: AdjustmentPreviewProps): JSX.Element => {
  const [originalBlob, setOriginalBlob] = useState<Blob | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const bakeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const prevPreviewUrlRef = useRef<string | null>(null)

  // src arrives as the raw stored path (e.g. "/1/uuid/file.png"); resolve it to
  // the asset domain for DISPLAY (the fallback shown before any bake exists),
  // same as ImageClient does at render time.
  const displaySrc = generateAssetUrl(src)
  const originalFetchUrl = generateAssetUrl(originalSrc)

  // Fetch the original image once per resolved original. Comment notes CORS
  // must be readable.
  useEffect(() => {
    const fetchOriginal = async () => {
      try {
        const response = await fetch(originalFetchUrl)
        if (!response.ok) {
          throw new Error(`Failed to fetch image: ${response.status}`)
        }
        const blob = await response.blob()
        setOriginalBlob(blob)
      } catch (error) {
        // Silently fail: CORS-blocked images will fall back to uncropped src
        console.debug("Failed to fetch original image", error)
        setOriginalBlob(null)
      }
    }
    fetchOriginal()
  }, [originalFetchUrl])

  // Debounced bake effect (~150ms) keyed on crop/rotate/flipH/flipV changes.
  useEffect(() => {
    // Clear any pending timeout
    if (bakeTimeoutRef.current) {
      clearTimeout(bakeTimeoutRef.current)
    }

    // If no blob or no adjustment with crop, nothing to bake
    if (!originalBlob || !adjustment?.crop) {
      // Revoke previous URL if clearing the preview
      if (prevPreviewUrlRef.current) {
        URL.revokeObjectURL(prevPreviewUrlRef.current)
        prevPreviewUrlRef.current = null
      }
      setPreviewUrl(null)
      return
    }

    bakeTimeoutRef.current = setTimeout(async () => {
      try {
        // Guard: only bake if we have a crop and the format is supported
        if (!canBakeImage(originalBlob.type)) {
          // Unsupported format: fall back to uncropped src
          return
        }

        const bakedBlob = await bakeImage(originalBlob, adjustment, {
          mimeType: originalBlob.type,
        })
        const bakeUrl = URL.createObjectURL(bakedBlob)
        // Revoke previous URL before setting new one
        if (prevPreviewUrlRef.current) {
          URL.revokeObjectURL(prevPreviewUrlRef.current)
        }
        prevPreviewUrlRef.current = bakeUrl
        setPreviewUrl(bakeUrl)
      } catch (error) {
        // On any failure (CORS taint, canvas issue, etc.): fall back to uncropped src
        console.debug("Failed to bake image", error)
        // Keep previewUrl as null, so we fall back to src in render
      }
    }, 150)

    return () => {
      if (bakeTimeoutRef.current) {
        clearTimeout(bakeTimeoutRef.current)
      }
    }
  }, [originalBlob, adjustment])

  // Cleanup: revoke object URL on unmount
  useEffect(() => {
    return () => {
      if (prevPreviewUrlRef.current) {
        URL.revokeObjectURL(prevPreviewUrlRef.current)
      }
    }
  }, [])

  // Helper: compute objectPosition for focal point (render-time, always applied)
  const getFocalObjectPosition = (focal?: { x: number; y: number }) => {
    if (!focal || (focal.x == null && focal.y == null)) {
      return undefined
    }
    return `${(focal.x ?? 0.5) * 100}% ${(focal.y ?? 0.5) * 100}%`
  }

  const adjustedSrc = previewUrl ?? displaySrc

  // Real-component preview: render the actual published block (real copy,
  // scrim, frame behaviour) with the adjusted image + draft imageAdjustment
  // spliced in, instead of the framed-<img> approximation below.
  let previewComponent: React.ReactNode = null
  if (block && typeof block === "object" && imageFieldName) {
    try {
      const component = {
        ...block,
        [imageFieldName]: adjustedSrc,
        imageAdjustment: adjustment,
      } as IsomerComponent
      previewComponent = renderComponent({
        component,
        layout: "content",
        site: PREVIEW_SITE_STUB,
        permalink: "",
        headingLevel: 1,
      })
    } catch (error) {
      console.debug(
        "Failed to render real-component preview, falling back to approximation",
        error,
      )
      previewComponent = null
    }
  }

  if (previewComponent) {
    return (
      <Flex wrap="wrap" align="flex-start" gap="1rem" w="100%">
        {previewStates.map((state) => {
          const displayWidth =
            FRAME_DISPLAY_WIDTH[state.id] ?? DEFAULT_FRAME_DISPLAY_WIDTH
          return (
            <Suspense
              key={state.id}
              fallback={<Skeleton w={`${displayWidth}px`} h="9rem" />}
            >
              <PreviewFrame siteId={siteId} state={state}>
                {previewComponent}
              </PreviewFrame>
            </Suspense>
          )
        })}
      </Flex>
    )
  }

  return (
    <Flex wrap="wrap" align="flex-start" gap="1rem" w="100%">
      {previewStates.map((state) => {
        const displayWidth =
          FRAME_DISPLAY_WIDTH[state.id] ?? DEFAULT_FRAME_DISPLAY_WIDTH
        const aspect = state.aspectRatio
          ? state.aspectRatio.width / state.aspectRatio.height
          : 1
        const displayHeight = displayWidth / aspect

        const imageNode = (
          <Box
            as="img"
            src={adjustedSrc}
            alt={`Preview: ${state.label}`}
            w="100%"
            h="100%"
            style={{
              objectFit: "cover",
              objectPosition: getFocalObjectPosition(adjustment?.focal),
            }}
          />
        )

        const frameContent = (
          <Box w="100%" h="100%" position="relative" overflow="hidden">
            {imageNode}
            {/* Scrim overlay for contrast visualization */}
            {scrim && (
              <Box
                position="absolute"
                inset={0}
                className={scrim.className}
                pointerEvents="none"
              />
            )}
          </Box>
        )

        return (
          <VStack
            key={state.id}
            align="stretch"
            spacing="0.5rem"
            flexShrink={0}
          >
            {/* Label with optional viewport width */}
            <Text
              textStyle="body-2"
              fontWeight="semibold"
              color="base.content.medium"
            >
              {state.label}
              {state.viewportWidth && ` (${state.viewportWidth}px)`}
            </Text>

            {/* Frame box, using the same per-breakpoint display width as
                every other component's preview. */}
            <Box
              borderWidth="1px"
              borderColor="base.divider.medium"
              borderRadius="0.25rem"
              overflow="hidden"
              bg="base.canvas.default"
              position="relative"
              style={{
                width: displayWidth,
                height: displayHeight,
              }}
            >
              {frameContent}
            </Box>
          </VStack>
        )
      })}
    </Flex>
  )
}

// Renders the real component inside a simulated device viewport at this
// breakpoint's exact width (so the component's own sm:/md:/lg: Tailwind
// classes evaluate correctly — the iframe's OWN layout viewport is what
// media queries read, which a container shrunk from outside can't fake),
// scaled down to a fixed DISPLAY WIDTH (see FRAME_DISPLAY_WIDTH). The
// frame's HEIGHT is measured from the real rendered content via a
// ResizeObserver inside the iframe, never guessed — so condition (1), the
// preview exactly reflecting the post-publish look, holds regardless of how
// tall any given component's content turns out to be, with nothing cropped
// or hidden behind a scrollbar.
//
// Also pulls the site's brand theme CSS vars into the iframe — without them,
// Tailwind classes like `bg-brand-canvas-inverse` resolve to nothing, which
// previously caused white-on-white text in the HeroBlock preview.
const PreviewFrame = ({
  siteId,
  state,
  children,
}: {
  siteId: number
  state: AdjustmentPreviewState
  children: React.ReactNode
}) => {
  const viewportWidth = state.viewportWidth ?? 1024
  // Used only as the initial guess before the real height is measured, to
  // avoid a 0-height flash — corrected immediately on mount.
  const estimatedHeight = state.aspectRatio
    ? Math.round(
        (viewportWidth * state.aspectRatio.height) / state.aspectRatio.width,
      )
    : viewportWidth
  const [measuredHeight, setMeasuredHeight] = useState<number | null>(null)
  const viewportHeight = measuredHeight ?? estimatedHeight

  const handleIframeMount = useCallback(
    ({ document: iframeDocument }: IframeCallbackFnProps) => {
      if (!iframeDocument?.body) return
      const update = () => setMeasuredHeight(iframeDocument.body.scrollHeight)
      update()
      // The global ResizeObserver can observe elements belonging to another
      // same-origin document just fine — no need to reach into the iframe's
      // own window for its constructor.
      const observer = new ResizeObserver(update)
      observer.observe(iframeDocument.body)
    },
    [],
  )

  const displayWidth =
    FRAME_DISPLAY_WIDTH[state.id] ?? DEFAULT_FRAME_DISPLAY_WIDTH
  const scale = displayWidth / viewportWidth
  const themeCssVars = useSiteThemeCssVars({ siteId })

  return (
    <VStack align="stretch" spacing="0.5rem" flexShrink={0}>
      <Text
        textStyle="body-2"
        fontWeight="semibold"
        color="base.content.medium"
      >
        {state.label}
        {state.viewportWidth && ` (${state.viewportWidth}px)`}
      </Text>

      <Box
        borderWidth="1px"
        borderColor="base.divider.medium"
        borderRadius="0.25rem"
        overflow="hidden"
        style={{
          width: displayWidth,
          height: viewportHeight * scale,
          position: "relative",
        }}
      >
        <Box
          style={{
            width: viewportWidth,
            height: viewportHeight,
            transform: `scale(${scale})`,
            transformOrigin: "top left",
          }}
        >
          <PreviewIframe
            widthPx={viewportWidth}
            heightPx={viewportHeight}
            preventPointerEvents
            style={themeCssVars}
            callback={handleIframeMount}
          >
            {children}
          </PreviewIframe>
        </Box>
      </Box>
    </VStack>
  )
}
