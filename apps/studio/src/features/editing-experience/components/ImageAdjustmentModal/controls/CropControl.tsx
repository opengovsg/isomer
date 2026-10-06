"use client"

import type { CSSProperties } from "react"
import { Box, Text, VStack } from "@chakra-ui/react"
import { useEffect, useRef, useState } from "react"
import { generateAssetUrl } from "~/utils/generateAssetUrl"

import {
  type CropRectNormalized,
  clientDeltaToNormalized,
  defaultCropRect,
  moveRect,
  resizeRectBottomRight,
} from "./cropGeometry"

interface CropControlProps {
  src: string
  crop?: CropRectNormalized
  lockedRatio?: { width: number; height: number }
  onChange: (crop: CropRectNormalized) => void
}

export const CropControl = ({
  src,
  crop,
  lockedRatio,
  onChange,
}: CropControlProps): JSX.Element => {
  const boxRef = useRef<HTMLDivElement>(null)
  const [aspectRatio, setAspectRatio] = useState<number | undefined>(undefined)
  const [isDraggingRect, setIsDraggingRect] = useState(false)
  const [isDraggingHandle, setIsDraggingHandle] = useState(false)
  const [lastPointerPos, setLastPointerPos] = useState<{
    x: number
    y: number
  } | null>(null)

  const currentCrop = crop ?? defaultCropRect(lockedRatio)

  // Initialize crop to ratio-correct default on mount
  useEffect(() => {
    if (crop === undefined) {
      onChange(defaultCropRect(lockedRatio))
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // When image loads, read its natural aspect ratio to prevent letterboxing
  const handleImageLoad = (event: React.SyntheticEvent<HTMLImageElement>) => {
    const img = event.currentTarget
    if (img.naturalWidth > 0 && img.naturalHeight > 0) {
      setAspectRatio(img.naturalWidth / img.naturalHeight)
    }
  }

  // Handle dragging the crop rect itself (move)
  const handleRectPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!boxRef.current) return
    event.stopPropagation()
    setIsDraggingRect(true)
    setLastPointerPos({ x: event.clientX, y: event.clientY })
    boxRef.current.setPointerCapture(event.pointerId)
  }

  const handleRectPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!isDraggingRect || !lastPointerPos || !boxRef.current) return

    const rect = boxRef.current.getBoundingClientRect()
    const delta = clientDeltaToNormalized(
      event.clientX - lastPointerPos.x,
      event.clientY - lastPointerPos.y,
      { width: rect.width, height: rect.height },
    )

    const newCrop = moveRect(currentCrop, delta.dx, delta.dy)
    onChange(newCrop)
    setLastPointerPos({ x: event.clientX, y: event.clientY })
  }

  const handleRectPointerUp = (event: React.PointerEvent<HTMLDivElement>) => {
    if (boxRef.current) {
      boxRef.current.releasePointerCapture(event.pointerId)
    }
    setIsDraggingRect(false)
    setLastPointerPos(null)
  }

  // Handle dragging the resize handle (bottom-right corner)
  const handleHandlePointerDown = (
    event: React.PointerEvent<HTMLDivElement>,
  ) => {
    if (!boxRef.current) return
    event.stopPropagation()
    setIsDraggingHandle(true)
    boxRef.current.setPointerCapture(event.pointerId)
  }

  const handleHandlePointerMove = (
    event: React.PointerEvent<HTMLDivElement>,
  ) => {
    if (!isDraggingHandle || !boxRef.current) return

    const rect = boxRef.current.getBoundingClientRect()
    // Convert current pointer position to normalized coordinates within the container
    const normalizedX = (event.clientX - rect.left) / rect.width
    const normalizedY = (event.clientY - rect.top) / rect.height

    const newCrop = resizeRectBottomRight(
      currentCrop,
      normalizedX,
      normalizedY,
      lockedRatio,
    )
    onChange(newCrop)
  }

  const handleHandlePointerUp = (event: React.PointerEvent<HTMLDivElement>) => {
    if (boxRef.current) {
      boxRef.current.releasePointerCapture(event.pointerId)
    }
    setIsDraggingHandle(false)
  }

  const rectStyle: CSSProperties = {
    position: "absolute",
    left: `${currentCrop.x * 100}%`,
    top: `${currentCrop.y * 100}%`,
    width: `${currentCrop.width * 100}%`,
    height: `${currentCrop.height * 100}%`,
    border: "2px solid #0066cc",
    boxShadow: "0 0 0 9999px rgba(0, 0, 0, 0.45)",
    cursor: isDraggingRect ? "grabbing" : "move",
    pointerEvents: "auto",
    zIndex: 10,
  }

  const handleStyle: CSSProperties = {
    position: "absolute",
    right: "-5px",
    bottom: "-5px",
    width: "10px",
    height: "10px",
    backgroundColor: "white",
    border: "2px solid #0066cc",
    borderRadius: "2px",
    cursor: isDraggingHandle ? "grabbing" : "nwse-resize",
    pointerEvents: "auto",
    zIndex: 11,
  }

  return (
    <VStack align="start" spacing="0.5rem" w="100%">
      <Text textStyle="h6" fontWeight="semibold">
        Crop
      </Text>
      <Text textStyle="body-2" color="base.content.medium">
        Drag to reposition, use the corner handle to resize
      </Text>

      <Box
        ref={boxRef}
        position="relative"
        w="100%"
        maxH="20rem"
        aspectRatio={aspectRatio}
        borderWidth="1px"
        borderColor="base.divider.medium"
        borderRadius="0.25rem"
        overflow="hidden"
        backgroundColor="base.canvas.neutral"
      >
        {/* oxlint-disable-next-line @next/next/no-img-element -- needs naturalWidth/Height for the no-letterbox aspect mapping; user image, not an LCP hero */}
        <img
          src={generateAssetUrl(src)}
          alt="Image for crop adjustment"
          onLoad={handleImageLoad}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "contain",
            objectPosition: "center",
            userSelect: "none",
            pointerEvents: "none",
          }}
        />

        {/* Crop rectangle overlay with dimmed exterior */}
        <div
          style={rectStyle}
          onPointerDown={handleRectPointerDown}
          onPointerMove={handleRectPointerMove}
          onPointerUp={handleRectPointerUp}
          onPointerLeave={handleRectPointerUp}
        >
          {/* Resize handle at bottom-right corner */}
          <div
            style={handleStyle}
            onPointerDown={handleHandlePointerDown}
            onPointerMove={handleHandlePointerMove}
            onPointerUp={handleHandlePointerUp}
            onPointerLeave={handleHandlePointerUp}
          />
        </div>
      </Box>
    </VStack>
  )
}
