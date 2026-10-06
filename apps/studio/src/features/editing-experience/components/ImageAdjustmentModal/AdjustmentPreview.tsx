"use client"

import type { ImageAdjustment } from "@opengovsg/isomer-components"
import { Box, HStack, Text, VStack } from "@chakra-ui/react"
import { useEffect, useRef, useState } from "react"
import { bakeImage, canBakeImage } from "~/lib/imageBake"

import type {
  AdjustmentMask,
  AdjustmentPreviewState,
  AdjustmentScrim,
} from "./AdjustmentConfig"

interface AdjustmentPreviewProps {
  src: string
  adjustment?: ImageAdjustment
  previewStates: AdjustmentPreviewState[]
  masks?: AdjustmentMask[]
  scrims?: AdjustmentScrim[]
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
  masks,
  scrims,
  renderFrameContent,
}: AdjustmentPreviewProps): JSX.Element => {
  const [originalBlob, setOriginalBlob] = useState<Blob | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const bakeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const prevPreviewUrlRef = useRef<string | null>(null)

  // Fetch the original image once on mount. Comment notes CORS must be readable.
  useEffect(() => {
    const fetchOriginal = async () => {
      try {
        const response = await fetch(src)
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
  }, [src])

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
            src={previewUrl ?? src}
            alt={`Preview: ${state.label}`}
            w="100%"
            h="100%"
            style={{
              objectFit: "cover",
              objectPosition: getFocalObjectPosition(adjustment?.focal),
            }}
          />
        )

        // Render mask if applicable
        const maskOverlay = masks?.find((mask) => mask.id === state.id)
        const maskBorderRadius =
          maskOverlay?.shape === "circle"
            ? "9999px"
            : maskOverlay?.shape === "rounded"
              ? "0.25rem"
              : undefined

        // Find all scrims that apply to this state (or all states if no id filter)
        const appliedScrims = scrims || []

        const frameContent = renderFrameContent?.({
          state,
          imageNode,
        }) ?? (
          <Box
            w="100%"
            h="100%"
            position="relative"
            overflow="hidden"
            borderRadius={maskBorderRadius}
          >
            {imageNode}
            {/* Overlay scrims for contrast visualization */}
            {appliedScrims.map((scrim) => (
              <Box
                key={scrim.id}
                position="absolute"
                inset={0}
                className={scrim.className}
                pointerEvents="none"
              />
            ))}
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
