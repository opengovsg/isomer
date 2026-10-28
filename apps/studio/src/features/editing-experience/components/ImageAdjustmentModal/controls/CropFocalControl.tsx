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
  // Rotation/flip are applied to the whole image before cropping, so the canvas
  // shows the rotated/flipped ("display") image and crop/focal are placed in
  // that orientation — matching the preview and the baked output.
  rotate?: 0 | 90 | 180 | 270
  flipH?: boolean
  flipV?: boolean
  onCropChange: (crop: CropRectNormalized) => void
  onFocalChange: (focal: { x: number; y: number }) => void
  // Fired once the image's true pixel aspect ratio is known, so a caller
  // that needs to compute a ratio-correct crop independently (e.g. the
  // modal's "Reset image" button) can do the same math this control does.
  onImageAspectChange?: (aspect: number) => void
  // Fired once the image's true pixel dimensions are known, so the modal can
  // compare the cropped region's effective resolution against the component's
  // rendered frame and warn on low-resolution crops.
  onNaturalSizeChange?: (size: { width: number; height: number }) => void
  // Blocks further crop/focal edits while a save is in flight -- otherwise
  // an edit made during that window is silently lost: handleSave already
  // captured the draft it's uploading, so a later edit updates local state
  // but never makes it into the save that's about to complete and close
  // the modal via onSave.
  isDisabled?: boolean
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
  rotate = 0,
  flipH = false,
  flipV = false,
  onCropChange,
  onFocalChange,
  onImageAspectChange,
  onNaturalSizeChange,
  isDisabled = false,
}: CropFocalControlProps): JSX.Element => {
  const boxRef = useRef<HTMLDivElement>(null)
  // The source image's true (un-rotated) pixel aspect. The canvas works in
  // "display" space (post rotate/flip), so a 90/270 rotation inverts it — that
  // display aspect drives the box, letterboxing and crop math below.
  const [naturalAspect, setNaturalAspect] = useState<number | undefined>(
    undefined,
  )
  const rotatedQuarter = rotate === 90 || rotate === 270
  const aspectRatio =
    naturalAspect === undefined
      ? undefined
      : rotatedQuarter
        ? 1 / naturalAspect
        : naturalAspect
  const [boxSize, setBoxSize] = useState({ width: 0, height: 0 })
  const [dragTarget, setDragTarget] = useState<DragTarget>(null)
  const lastPointerRef = useRef<{ x: number; y: number } | null>(null)

  const showCrop = cropMode !== "none"
  const currentCrop = crop ?? defaultCropRect(lockedRatio, aspectRatio ?? 1)
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

  // NB: the default crop is NOT written to the draft on mount. Merely opening
  // the modal must not dirty the draft (otherwise Cancel prompts to discard and
  // Save bakes a full-frame image for an untouched picture). The default stays
  // local — shown via `currentCrop` and committed only on the first real edit
  // (crop drag commits the dragged rect; focal drag commits the default crop,
  // see handleFocalPointerDown). A ratio-correct default needs the image's true
  // aspect, which isn't known until the <img> below fires onLoad.

  const handleImageLoad = (event: React.SyntheticEvent<HTMLImageElement>) => {
    const img = event.currentTarget
    if (img.naturalWidth > 0 && img.naturalHeight > 0) {
      const aspect = img.naturalWidth / img.naturalHeight
      setNaturalAspect(aspect)
      onImageAspectChange?.(aspect)
      onNaturalSizeChange?.({
        width: img.naturalWidth,
        height: img.naturalHeight,
      })
    }
  }

  // Capture is taken on event.currentTarget (the element the listener is
  // attached to), not a ref to an ancestor box — per the Pointer Events spec,
  // captured events retarget to the capturing element and bubble UP from
  // there, so a listener on a *descendant* of the capturing element would
  // never see them.
  const handleRectPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (isDisabled) return
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
    if (isDisabled) return
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
        aspectRatio ?? 1,
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
    if (isDisabled) return
    event.stopPropagation()
    // Commit the (until-now local) default crop on the first focal edit, so a
    // focal-only adjustment still bakes within the correct frame. Focal values
    // are stored relative to the crop, so the crop the focal is measured against
    // must be persisted alongside it.
    if (showCrop && crop === undefined) {
      onCropChange(currentCrop)
    }
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

  // Show the image in "display" orientation (rotate then flip). For 0/180 the
  // img fills the box normally; a 90/270 rotation would overflow, so size it to
  // the box's swapped dimensions and rotate it into place (centered). Flips are
  // just a scale, so they never change sizing. All crop/focal overlay math
  // below stays in display space, unchanged — only the image is transformed.
  const flipX = flipH ? -1 : 1
  const flipY = flipV ? -1 : 1
  const displayImageStyle: CSSProperties =
    rotatedQuarter && boxSize.width > 0
      ? {
          position: "absolute",
          top: "50%",
          left: "50%",
          width: `${boxSize.height}px`,
          height: `${boxSize.width}px`,
          objectFit: "contain",
          transform: `translate(-50%, -50%) scale(${flipX}, ${flipY}) rotate(${rotate}deg)`,
          transformOrigin: "center",
          userSelect: "none",
          pointerEvents: "none",
        }
      : {
          width: "100%",
          height: "100%",
          objectFit: "contain",
          objectPosition: "center",
          transform: `scale(${flipX}, ${flipY}) rotate(${rotate}deg)`,
          transformOrigin: "center",
          userSelect: "none",
          pointerEvents: "none",
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
          style={displayImageStyle}
        />

        {showCrop && (
          <div
            style={{ ...rectStyle, touchAction: "none" }}
            onPointerDown={handleRectPointerDown}
            onPointerMove={handleRectPointerMove}
            onPointerUp={handlePointerUp}
            onPointerLeave={handlePointerUp}
            onPointerCancel={handlePointerUp}
            onLostPointerCapture={handlePointerUp}
          >
            {activeHandles.map((handle) => (
              <div
                key={handle}
                style={{ ...getHandleStyle(handle), touchAction: "none" }}
                onPointerDown={(event) =>
                  handleResizePointerDown(event, handle)
                }
                onPointerMove={(event) =>
                  handleResizePointerMove(event, handle)
                }
                onPointerUp={handlePointerUp}
                onPointerLeave={handlePointerUp}
                onPointerCancel={handlePointerUp}
                onLostPointerCapture={handlePointerUp}
              />
            ))}
          </div>
        )}

        {focalEnabled && (
          <div
            style={{ ...markerStyle, touchAction: "none" }}
            onPointerDown={handleFocalPointerDown}
            onPointerMove={handleFocalPointerMove}
            onPointerUp={handlePointerUp}
            onPointerLeave={handlePointerUp}
            onPointerCancel={handlePointerUp}
            onLostPointerCapture={handlePointerUp}
          />
        )}
      </Box>
    </VStack>
  )
}
