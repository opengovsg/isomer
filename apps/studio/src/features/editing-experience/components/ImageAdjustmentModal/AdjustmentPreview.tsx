"use client"

import type {
  IsomerComponent,
  IsomerSiteProps,
  ImageAdjustment,
} from "@opengovsg/isomer-components"
import { Box, HStack, Text, VStack } from "@chakra-ui/react"
import { renderComponent } from "@opengovsg/isomer-components"
import { useEffect, useRef, useState } from "react"
import { PreviewIframe } from "~/features/editing-experience/components/preview/PreviewIframe"
import { bakeImage, canBakeImage, isAnimatedImageBlob } from "~/lib/imageBake"
import { ASSETS_BASE_URL, generateAssetUrl } from "~/utils/generateAssetUrl"

import type {
  AdjustmentPreviewState,
  AdjustmentScrim,
} from "./AdjustmentConfig"

// Only the fields HeroGradient/Contentpic actually read are populated — this
// renders one isolated block, not a real page. Mirrors PreviewWithCustomSitemap.tsx.
const PREVIEW_SITE_STUB = {
  assetsBaseUrl: ASSETS_BASE_URL,
  siteMapArray: [],
} as unknown as IsomerSiteProps

interface AdjustmentPreviewProps {
  src: string
  // The true original's stored path, resolved by the parent via resolveOriginalKey —
  // bake input must always be the original, never a previous bake, so re-encode loss can't compound.
  originalSrc: string
  adjustment?: ImageAdjustment
  previewStates: AdjustmentPreviewState[]
  scrim?: AdjustmentScrim
  // Lets the real published component render (real copy/scrim/frame) instead of the
  // framed-<img> approximation below; falls back to it when absent or rendering fails.
  block?: unknown
  imageFieldName?: string
}

export const AdjustmentPreview = ({
  src,
  originalSrc,
  adjustment,
  previewStates,
  scrim,
  block,
  imageFieldName,
}: AdjustmentPreviewProps): JSX.Element => {
  const [originalBlob, setOriginalBlob] = useState<Blob | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const bakeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const prevPreviewUrlRef = useRef<string | null>(null)
  // Monotonic token so a superseded, still-running bake can detect it and drop its result.
  const bakeRequestIdRef = useRef(0)

  // Resolve to the asset domain, same as ImageClient does at render time.
  const displaySrc = generateAssetUrl(src)
  const originalFetchUrl = generateAssetUrl(originalSrc)

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
    void fetchOriginal()
  }, [originalFetchUrl])

  useEffect(() => {
    if (bakeTimeoutRef.current) {
      clearTimeout(bakeTimeoutRef.current)
    }

    // Debouncing only cancels a bake that hasn't started yet; bump the token so a
    // bake already awaiting bakeImage can't overwrite this newer draft when it resolves.
    const requestId = ++bakeRequestIdRef.current
    const isStale = () => requestId !== bakeRequestIdRef.current

    if (!originalBlob || !adjustment?.crop) {
      if (prevPreviewUrlRef.current) {
        URL.revokeObjectURL(prevPreviewUrlRef.current)
        prevPreviewUrlRef.current = null
      }
      setPreviewUrl(null)
      return
    }

    const runBake = async () => {
      try {
        // Animated WebP/APNG pass canBakeImage but would be flattened, so skip them too.
        if (
          !canBakeImage(originalBlob.type) ||
          (await isAnimatedImageBlob(originalBlob))
        ) {
          return
        }

        const bakedBlob = await bakeImage(originalBlob, adjustment, {
          mimeType: originalBlob.type,
        })
        // A newer adjustment started while this bake ran — discard it.
        if (isStale()) {
          return
        }
        const bakeUrl = URL.createObjectURL(bakedBlob)
        if (prevPreviewUrlRef.current) {
          URL.revokeObjectURL(prevPreviewUrlRef.current)
        }
        prevPreviewUrlRef.current = bakeUrl
        setPreviewUrl(bakeUrl)
      } catch (error) {
        // Fall back to the uncropped src (CORS taint, canvas issue, etc.) unless
        // a newer bake has already superseded this one.
        console.debug("Failed to bake image", error)
        if (isStale()) {
          return
        }
        if (prevPreviewUrlRef.current) {
          URL.revokeObjectURL(prevPreviewUrlRef.current)
          prevPreviewUrlRef.current = null
        }
        setPreviewUrl(null)
      }
    }
    bakeTimeoutRef.current = setTimeout(() => void runBake(), 150)

    return () => {
      if (bakeTimeoutRef.current) {
        clearTimeout(bakeTimeoutRef.current)
      }
    }
    // Deliberately narrower than `adjustment`: focal is applied at render time as
    // CSS object-position, so a focal-only drag shouldn't trigger a canvas re-encode.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    originalBlob,
    adjustment?.crop?.x,
    adjustment?.crop?.y,
    adjustment?.crop?.width,
    adjustment?.crop?.height,
  ])

  // Bumps bakeRequestIdRef so a bake still in flight at unmount sees isStale() once it
  // resolves, instead of creating (and leaking) a new object URL after unmount.
  useEffect(() => {
    return () => {
      bakeRequestIdRef.current++
      if (prevPreviewUrlRef.current) {
        URL.revokeObjectURL(prevPreviewUrlRef.current)
      }
    }
  }, [])

  const getFocalObjectPosition = (focal?: { x: number; y: number }) => {
    if (!focal || (focal.x == null && focal.y == null)) {
      return undefined
    }
    return `${(focal.x ?? 0.5) * 100}% ${(focal.y ?? 0.5) * 100}%`
  }

  const adjustedSrc = previewUrl ?? displaySrc

  // Renders the actual published block with the adjusted image + draft spliced in.
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
    const DISPLAY_WIDTH_CAP = 200

    return (
      <HStack
        align="flex-start"
        spacing="1rem"
        w="100%"
        overflowX="auto"
        overflowY="hidden"
        pb="0.5rem"
      >
        {previewStates.map((state) => {
          // Render the iframe at its real breakpoint width (so sm:/md:/lg: classes
          // evaluate correctly), then CSS-scale the box down to fit the preview column.
          const viewportWidth = state.viewportWidth ?? 1024
          const viewportHeight = state.aspectRatio
            ? Math.round(
                (viewportWidth * state.aspectRatio.height) /
                  state.aspectRatio.width,
              )
            : 600
          const displayWidth = Math.min(viewportWidth, DISPLAY_WIDTH_CAP)
          const scale = displayWidth / viewportWidth

          return (
            <VStack
              key={state.id}
              align="stretch"
              spacing="0.5rem"
              flexShrink={0}
              minW="fit-content"
            >
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
                  >
                    {previewComponent}
                  </PreviewIframe>
                </Box>
              </Box>
            </VStack>
          )
        })}
      </HStack>
    )
  }

  return (
    <HStack
      align="flex-start"
      spacing="1rem"
      w="100%"
      overflowX="auto"
      overflowY="hidden"
      pb="0.5rem"
    >
      {previewStates.map((state) => {
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
            minW="fit-content"
          >
            <Text
              textStyle="body-2"
              fontWeight="semibold"
              color="base.content.medium"
            >
              {state.label}
              {state.viewportWidth && ` (${state.viewportWidth}px)`}
            </Text>

            <Box
              w="auto"
              borderWidth="1px"
              borderColor="base.divider.medium"
              borderRadius="0.25rem"
              overflow="hidden"
              bg="base.canvas.default"
              position="relative"
              style={{
                aspectRatio: state.aspectRatio
                  ? `${state.aspectRatio.width} / ${state.aspectRatio.height}`
                  : undefined,
                width: state.viewportWidth
                  ? Math.min(state.viewportWidth, 200)
                  : 200,
              }}
            >
              {frameContent}
            </Box>
          </VStack>
        )
      })}
    </HStack>
  )
}
