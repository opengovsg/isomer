"use client"

import type { ImageAdjustment } from "@opengovsg/isomer-components"
import { Box, HStack, Text, VStack } from "@chakra-ui/react"
import { useEffect, useRef, useState } from "react"
import { bakeImage, canBakeImage } from "~/lib/imageBake"
import { generateAssetUrl } from "~/utils/generateAssetUrl"

import type {
  AdjustmentPreviewState,
  AdjustmentScrim,
} from "./AdjustmentConfig"
import { resolveOriginalKey } from "./useSaveImageAdjustment"

interface AdjustmentPreviewProps {
  src: string
  adjustment?: ImageAdjustment
  previewStates: AdjustmentPreviewState[]
  scrim?: AdjustmentScrim
  // W0-G injects the real template component here; default = the framed <img>
  renderFrameContent?: (args: {
    state: AdjustmentPreviewState
    imageNode: React.ReactNode
  }) => React.ReactNode
}

export const AdjustmentPreview = ({
  src,
  adjustment,
  previewStates,
  scrim,
  renderFrameContent,
}: AdjustmentPreviewProps): JSX.Element => {
  const [originalBlob, setOriginalBlob] = useState<Blob | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const bakeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const prevPreviewUrlRef = useRef<string | null>(null)

  // src arrives as the raw stored path (e.g. "/1/uuid/file.png"); resolve it to
  // the asset domain for DISPLAY (the fallback shown before any bake exists),
  // same as ImageClient does at render time.
  const displaySrc = generateAssetUrl(src)

  // The bake INPUT must always be the original, never a previous bake — same
  // rule useSaveImageAdjustment follows (RFC: re-encode loss must not
  // compound). On a first edit `src` IS the original; on a re-edit, `src` is
  // the previous bake and only `adjustment.originalKey` points at the true
  // original, so reuse the same resolver Save uses to keep the two agreed.
  const originalKey = resolveOriginalKey(src, adjustment ?? {})
  const originalFetchUrl = generateAssetUrl(`/${originalKey}`)

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
            src={previewUrl ?? displaySrc}
            alt={`Preview: ${state.label}`}
            w="100%"
            h="100%"
            style={{
              objectFit: "cover",
              objectPosition: getFocalObjectPosition(adjustment?.focal),
            }}
          />
        )

        const frameContent = renderFrameContent?.({
          state,
          imageNode,
        }) ?? (
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
            minW="fit-content"
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

            {/* Frame box with aspect ratio */}
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
