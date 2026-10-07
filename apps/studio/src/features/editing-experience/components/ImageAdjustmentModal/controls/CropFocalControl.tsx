"use client"

import type { CSSProperties } from "react"
import { Box, Text, VStack } from "@chakra-ui/react"
import { useEffect, useMemo, useRef, useState } from "react"
import { generateAssetUrl } from "~/utils/generateAssetUrl"

import type {
  CropRectNormalized,
  HandlePosition,
  NormalizedRect,
} from "./cropGeometry"
import {
  CORNER_HANDLES,
  EDGE_HANDLES,
  clientDeltaToNormalized,
  defaultCropRect,
  getContainedImageBounds,
  moveRect,
  resizeRectByHandle,
} from "./cropGeometry"
import {
  focalToWholeImagePoint,
  pointToCropRelativeFocal,
  pointToFocal,
} from "./focalGeometry"

// Percentage anchor + resize cursor for each of the 8 standard handles.
const HANDLE_LAYOUT: Record<
  HandlePosition,
  { left: string; top: string; cursor: string }
> = {
  nw: { left: "0%", top: "0%", cursor: "nwse-resize" },
  n: { left: "50%", top: "0%", cursor: "ns-resize" },
  ne: { left: "100%", top: "0%", cursor: "nesw-resize" },
  e: { left: "100%", top: "50%", cursor: "ew-resize" },
  se: { left: "100%", top: "100%", cursor: "nwse-resize" },
  s: { left: "50%", top: "100%", cursor: "ns-resize" },
  sw: { left: "0%", top: "100%", cursor: "nesw-resize" },
  w: { left: "0%", top: "50%", cursor: "ew-resize" },
}

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

type DragTarget = "rect" | "focal" | HandlePosition | null

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
  const [boxSize, setBoxSize] = useState({ width: 0, height: 0 })
  const [dragTarget, setDragTarget] = useState<DragTarget>(null)
  const lastPointerRef = useRef<{ x: number; y: number } | null>(null)

  const showCrop = cropMode !== "none"
  const currentCrop = crop ?? defaultCropRect(lockedRatio)
  const currentFocal = focal ?? { x: 0.5, y: 0.5 }

  // Track the canvas box's own pixel size, so we can work out exactly where
  // the image renders inside it (object-fit: contain letterboxes/pillarboxes
  // whenever the box's aspect ratio doesn't match the image's).
  useEffect(() => {
    const el = boxRef.current
    if (!el) return
    const observer = new ResizeObserver((entries) => {
      const entry = entries[0]
      if (entry) {
        setBoxSize({
          width: entry.contentRect.width,
          height: entry.contentRect.height,
        })
      }
    })
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  // The image's true rendered rect within the box, normalized to the BOX —
  // crop/focal values are normalized to the IMAGE, so every box-space
  // pointer/percentage calculation below must map through this rect. Without
  // it, the crop UI treats the whole box (including blank bleed space) as if
  // it were the image.
  const imageBounds: NormalizedRect = useMemo(
    () =>
      aspectRatio
        ? getContainedImageBounds(boxSize, aspectRatio)
        : { x: 0, y: 0, width: 1, height: 1 },
    [boxSize, aspectRatio],
  )

  // Map an image-normalized rect/point into box-normalized space for display.
  const toBoxSpace = (r: { x: number; y: number }) => ({
    x: imageBounds.x + r.x * imageBounds.width,
    y: imageBounds.y + r.y * imageBounds.height,
  })

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
    // Scale against the image's actual rendered pixel size, not the box's —
    // otherwise a pointer delta gets under-scaled whenever there's bleed space.
    const delta = clientDeltaToNormalized(
      event.clientX - lastPointerRef.current.x,
      event.clientY - lastPointerRef.current.y,
      {
        width: boxRect.width * imageBounds.width,
        height: boxRect.height * imageBounds.height,
      },
    )
    onCropChange(moveRect(currentCrop, delta.dx, delta.dy))
    lastPointerRef.current = { x: event.clientX, y: event.clientY }
  }

  const handleResizePointerDown = (
    event: React.PointerEvent<HTMLDivElement>,
    handle: HandlePosition,
  ) => {
    event.stopPropagation()
    setDragTarget(handle)
    event.currentTarget.setPointerCapture(event.pointerId)
  }

  const handleResizePointerMove = (
    event: React.PointerEvent<HTMLDivElement>,
    handle: HandlePosition,
  ) => {
    if (dragTarget !== handle || !boxRef.current) return
    const boxRect = boxRef.current.getBoundingClientRect()
    // Map the pointer into the image's rendered pixel rect, not the box's —
    // otherwise a handle can be dragged past the image's true edge into
    // blank bleed space.
    const imagePixelLeft = boxRect.left + imageBounds.x * boxRect.width
    const imagePixelTop = boxRect.top + imageBounds.y * boxRect.height
    const imagePixelWidth = imageBounds.width * boxRect.width
    const imagePixelHeight = imageBounds.height * boxRect.height
    const normalizedX = (event.clientX - imagePixelLeft) / imagePixelWidth
    const normalizedY = (event.clientY - imagePixelTop) / imagePixelHeight
    onCropChange(
      resizeRectByHandle(
        currentCrop,
        handle,
        normalizedX,
        normalizedY,
        lockedRatio,
      ),
    )
  }

  // Ratio-locked crops only offer corner handles — resizing a single edge
  // under a fixed ratio is ambiguous (which dimension derives from the
  // other?), the same restriction mainstream crop tools apply.
  const activeHandles: readonly HandlePosition[] = lockedRatio
    ? CORNER_HANDLES
    : [...CORNER_HANDLES, ...EDGE_HANDLES]

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
      left: boxRect.left + imageBounds.x * boxRect.width,
      top: boxRect.top + imageBounds.y * boxRect.height,
      width: imageBounds.width * boxRect.width,
      height: imageBounds.height * boxRect.height,
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

  const cropBoxSpace = toBoxSpace(currentCrop)
  const rectStyle: CSSProperties = {
    position: "absolute",
    left: `${cropBoxSpace.x * 100}%`,
    top: `${cropBoxSpace.y * 100}%`,
    width: `${currentCrop.width * imageBounds.width * 100}%`,
    height: `${currentCrop.height * imageBounds.height * 100}%`,
    border: "2px solid #0066cc",
    boxShadow: "0 0 0 9999px rgba(0, 0, 0, 0.45)",
    cursor: dragTarget === "rect" ? "grabbing" : "move",
    pointerEvents: "auto",
    zIndex: 10,
  }

  const getHandleStyle = (handle: HandlePosition): CSSProperties => ({
    position: "absolute",
    left: HANDLE_LAYOUT[handle].left,
    top: HANDLE_LAYOUT[handle].top,
    transform: "translate(-50%, -50%)",
    width: "10px",
    height: "10px",
    backgroundColor: "white",
    border: "2px solid #0066cc",
    borderRadius: "2px",
    cursor: dragTarget === handle ? "grabbing" : HANDLE_LAYOUT[handle].cursor,
    pointerEvents: "auto",
    zIndex: 12,
  })

  const focalWholeImagePoint = focalToWholeImagePoint(currentFocal, currentCrop)
  const focalBoxSpace = toBoxSpace(focalWholeImagePoint)
  const markerStyle: CSSProperties = {
    position: "absolute",
    left: `${focalBoxSpace.x * 100}%`,
    top: `${focalBoxSpace.y * 100}%`,
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
    showCrop && "Drag the frame to reposition, the handles to resize.",
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
        style={{
          // Checkerboard makes the letterboxed/pillarboxed "bleed" area (where
          // the box's aspect ratio doesn't match the image's) visually obvious
          // — it only ever shows through where the <img> (object-fit: contain)
          // doesn't cover, since the image sits on top of this background.
          background:
            "repeating-conic-gradient(#d9d9d9 0% 25%, #f1f1f1 0% 50%) 50% / 20px 20px",
        }}
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
            {activeHandles.map((handle) => (
              <div
                key={handle}
                style={getHandleStyle(handle)}
                onPointerDown={(event) =>
                  handleResizePointerDown(event, handle)
                }
                onPointerMove={(event) =>
                  handleResizePointerMove(event, handle)
                }
                onPointerUp={handlePointerUp}
                onPointerLeave={handlePointerUp}
              />
            ))}
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
