"use client"

import type { CSSProperties } from "react"
import { Box, Text, VStack } from "@chakra-ui/react"
import { useEffect, useRef, useState } from "react"
import { generateAssetUrl } from "~/utils/generateAssetUrl"

import type { CropRectNormalized } from "./cropGeometry"
import {
  clientDeltaToNormalized,
  defaultCropRect,
  moveRect,
  resizeRectBottomRight,
} from "./cropGeometry"
import {
  focalToWholeImagePoint,
  pointToCropRelativeFocal,
  pointToFocal,
} from "./focalGeometry"

interface CropFocalControlProps {
  src: string
  crop?: CropRectNormalized
  focal?: { x: number; y: number }
  cropMode: "fixed" | "custom" | "none"
  lockedRatio?: { width: number; height: number }
  focalEnabled: boolean
  onCropChange: (crop: CropRectNormalized) => void
  onFocalChange: (focal: { x: number; y: number }) => void
}

type DragTarget = "rect" | "handle" | "focal" | null

// One shared image canvas for both crop and focal editing (crop frame +
// focal marker rendered together), rather than two separate whole-image
// boxes — the focal point is only meaningful relative to the crop (the
// renderer applies it as object-position directly on the already-cropped
// bake), so it must be visually and numerically constrained to the crop.
export const CropFocalControl = ({
  src,
  crop,
  focal,
  cropMode,
  lockedRatio,
  focalEnabled,
  onCropChange,
  onFocalChange,
}: CropFocalControlProps): JSX.Element => {
  const boxRef = useRef<HTMLDivElement>(null)
  const [aspectRatio, setAspectRatio] = useState<number | undefined>(undefined)
  const [dragTarget, setDragTarget] = useState<DragTarget>(null)
  const lastPointerRef = useRef<{ x: number; y: number } | null>(null)

  const showCrop = cropMode !== "none"
  const currentCrop = crop ?? defaultCropRect(lockedRatio)
  const currentFocal = focal ?? { x: 0.5, y: 0.5 }

  // Seed a ratio-correct crop default on mount. The generic full-image
  // default would violate a locked ratio, so a fixed-ratio component must
  // start from a ratio-correct centered rect, not {0,0,1,1}.
  useEffect(() => {
    if (showCrop && crop === undefined) {
      onCropChange(defaultCropRect(lockedRatio))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleImageLoad = (event: React.SyntheticEvent<HTMLImageElement>) => {
    const img = event.currentTarget
    if (img.naturalWidth > 0 && img.naturalHeight > 0) {
      setAspectRatio(img.naturalWidth / img.naturalHeight)
    }
  }

  // Capture is taken on event.currentTarget (the element the listener is
  // attached to), not a ref to an ancestor box — per the Pointer Events spec,
  // captured events retarget to the capturing element and bubble UP from
  // there, so a listener on a *descendant* of the capturing element would
  // never see them.
  const handleRectPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    event.stopPropagation()
    setDragTarget("rect")
    lastPointerRef.current = { x: event.clientX, y: event.clientY }
    event.currentTarget.setPointerCapture(event.pointerId)
  }

  const handleRectPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (dragTarget !== "rect" || !lastPointerRef.current || !boxRef.current)
      return
    const boxRect = boxRef.current.getBoundingClientRect()
    const delta = clientDeltaToNormalized(
      event.clientX - lastPointerRef.current.x,
      event.clientY - lastPointerRef.current.y,
      { width: boxRect.width, height: boxRect.height },
    )
    onCropChange(moveRect(currentCrop, delta.dx, delta.dy))
    lastPointerRef.current = { x: event.clientX, y: event.clientY }
  }

  const handleResizePointerDown = (
    event: React.PointerEvent<HTMLDivElement>,
  ) => {
    event.stopPropagation()
    setDragTarget("handle")
    event.currentTarget.setPointerCapture(event.pointerId)
  }

  const handleResizePointerMove = (
    event: React.PointerEvent<HTMLDivElement>,
  ) => {
    if (dragTarget !== "handle" || !boxRef.current) return
    const boxRect = boxRef.current.getBoundingClientRect()
    const normalizedX = (event.clientX - boxRect.left) / boxRect.width
    const normalizedY = (event.clientY - boxRect.top) / boxRect.height
    onCropChange(
      resizeRectBottomRight(currentCrop, normalizedX, normalizedY, lockedRatio),
    )
  }

  const handleFocalPointerDown = (
    event: React.PointerEvent<HTMLDivElement>,
  ) => {
    event.stopPropagation()
    setDragTarget("focal")
    event.currentTarget.setPointerCapture(event.pointerId)
  }

  const handleFocalPointerMove = (
    event: React.PointerEvent<HTMLDivElement>,
  ) => {
    if (dragTarget !== "focal" || !boxRef.current) return
    const boxRect = boxRef.current.getBoundingClientRect()
    const wholeImagePoint = pointToFocal(event.clientX, event.clientY, {
      left: boxRect.left,
      top: boxRect.top,
      width: boxRect.width,
      height: boxRect.height,
    })
    onFocalChange(pointToCropRelativeFocal(wholeImagePoint, currentCrop))
  }

  const handlePointerUp = (event: React.PointerEvent<HTMLDivElement>) => {
    const target = event.currentTarget
    if (target.hasPointerCapture(event.pointerId)) {
      target.releasePointerCapture(event.pointerId)
    }
    setDragTarget(null)
    lastPointerRef.current = null
  }

  const rectStyle: CSSProperties = {
    position: "absolute",
    left: `${currentCrop.x * 100}%`,
    top: `${currentCrop.y * 100}%`,
    width: `${currentCrop.width * 100}%`,
    height: `${currentCrop.height * 100}%`,
    border: "2px solid #0066cc",
    boxShadow: "0 0 0 9999px rgba(0, 0, 0, 0.45)",
    cursor: dragTarget === "rect" ? "grabbing" : "move",
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
    cursor: dragTarget === "handle" ? "grabbing" : "nwse-resize",
    pointerEvents: "auto",
    zIndex: 12,
  }

  const focalWholeImagePoint = focalToWholeImagePoint(currentFocal, currentCrop)
  const markerStyle: CSSProperties = {
    position: "absolute",
    left: `${focalWholeImagePoint.x * 100}%`,
    top: `${focalWholeImagePoint.y * 100}%`,
    transform: "translate(-50%, -50%)",
    width: "16px",
    height: "16px",
    borderRadius: "50%",
    backgroundColor: "white",
    border: "2px solid #e53e3e",
    boxShadow: "0 2px 4px rgba(0, 0, 0, 0.3)",
    cursor: dragTarget === "focal" ? "grabbing" : "grab",
    pointerEvents: "auto",
    zIndex: 11,
  }

  const label =
    showCrop && focalEnabled
      ? "Crop & focal point"
      : showCrop
        ? "Crop"
        : "Focal point"
  const hint = [
    showCrop && "Drag the frame to reposition, the corner handle to resize.",
    focalEnabled && "Drag the dot to choose the part to keep in view.",
  ]
    .filter(Boolean)
    .join(" ")

  return (
    <VStack align="start" spacing="0.5rem" w="100%">
      <Text textStyle="h6" fontWeight="semibold">
        {label}
      </Text>
      <Text textStyle="body-2" color="base.content.medium">
        {hint}
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
          alt="Image for crop and focal point adjustment"
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

        {showCrop && (
          <div
            style={rectStyle}
            onPointerDown={handleRectPointerDown}
            onPointerMove={handleRectPointerMove}
            onPointerUp={handlePointerUp}
            onPointerLeave={handlePointerUp}
          >
            <div
              style={handleStyle}
              onPointerDown={handleResizePointerDown}
              onPointerMove={handleResizePointerMove}
              onPointerUp={handlePointerUp}
              onPointerLeave={handlePointerUp}
            />
          </div>
        )}

        {focalEnabled && (
          <div
            style={markerStyle}
            onPointerDown={handleFocalPointerDown}
            onPointerMove={handleFocalPointerMove}
            onPointerUp={handlePointerUp}
            onPointerLeave={handlePointerUp}
          />
        )}
      </Box>
    </VStack>
  )
}
