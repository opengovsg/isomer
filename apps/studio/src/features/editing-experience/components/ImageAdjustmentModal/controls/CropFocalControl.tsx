import type { CSSProperties } from "react"
import { Box } from "@chakra-ui/react"
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react"
import { BiCrosshair } from "react-icons/bi"
import { generateAssetUrl } from "~/utils/generateAssetUrl"

// Inline styles on raw divs cannot use theme tokens, so read Chakra's CSS var.
const ACCENT = "var(--chakra-colors-interaction-main-default)"

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
  edgesMovedBy,
  moveRect,
  resizeRectByHandle,
} from "./cropGeometry"
import {
  focalToWholeImagePoint,
  pointToCropRelativeFocal,
  pointToFocal,
} from "./focalGeometry"

// Percentage anchor + resize cursor for each of the 8 standard handles.
const handleLayout = (
  handle: HandlePosition,
): { left: string; top: string; cursor: string } => {
  const { movesLeft, movesRight, movesTop, movesBottom } = edgesMovedBy(handle)
  return {
    left: movesLeft ? "0%" : movesRight ? "100%" : "50%",
    top: movesTop ? "0%" : movesBottom ? "100%" : "50%",
    cursor: `${handle}-resize`,
  }
}

interface CropFocalControlProps {
  src: string
  crop?: CropRectNormalized
  focal?: { x: number; y: number }
  cropMode: "fixed" | "custom" | "none"
  lockedRatio?: { width: number; height: number }
  focalEnabled: boolean
  // The modal's open state. The focal hint shows again on every open.
  isOpen?: boolean
  onCropChange: (crop: CropRectNormalized) => void
  onFocalChange: (focal: { x: number; y: number }) => void
  // Fires when the image loads, with its pixel width / height.
  onImageAspectChange?: (aspect: number) => void
  // Fires when the image loads, with its pixel size.
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
  isOpen,
  onCropChange,
  onFocalChange,
  onImageAspectChange,
  onNaturalSizeChange,
  isDisabled = false,
}: CropFocalControlProps): JSX.Element => {
  const boxRef = useRef<HTMLDivElement>(null)
  const [naturalAspect, setNaturalAspect] = useState<number | undefined>(
    undefined,
  )
  const [boxSize, setBoxSize] = useState({ width: 0, height: 0 })
  const [dragTarget, setDragTarget] = useState<DragTarget>(null)
  const lastPointerRef = useRef<{ x: number; y: number } | null>(null)

  // Shown on every modal open until the user touches the marker.
  const [showFocalHint, setShowFocalHint] = useState(true)
  useEffect(() => {
    if (isOpen) setShowFocalHint(true)
  }, [isOpen])
  const dismissFocalHint = () => setShowFocalHint(false)
  // Measure the hint bubble before paint, to clamp it inside the canvas.
  const hintRef = useRef<HTMLDivElement>(null)
  const [hintSize, setHintSize] = useState({ width: 0, height: 0 })
  useLayoutEffect(() => {
    if (showFocalHint && hintRef.current) {
      setHintSize({
        width: hintRef.current.offsetWidth,
        height: hintRef.current.offsetHeight,
      })
    }
  }, [showFocalHint, boxSize.width])

  const showCrop = cropMode !== "none"
  const currentCrop = crop ?? defaultCropRect(lockedRatio, naturalAspect ?? 1)
  const currentFocal = focal ?? { x: 0.5, y: 0.5 }

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

  // Where the image renders inside the box. Crop and focal values are
  // normalized to the image, so all box-space math below maps through this.
  const imageBounds: NormalizedRect = useMemo(
    () =>
      naturalAspect
        ? getContainedImageBounds(boxSize, naturalAspect)
        : { x: 0, y: 0, width: 1, height: 1 },
    [boxSize, naturalAspect],
  )

  const toBoxSpace = (r: { x: number; y: number }) => ({
    x: imageBounds.x + r.x * imageBounds.width,
    y: imageBounds.y + r.y * imageBounds.height,
  })

  // Do not write the default crop to the draft on mount. Opening the modal
  // would dirty it, so Cancel would prompt and Save would bake an untouched
  // image. The first crop or focal edit commits it.

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
    // Scale by the image's rendered size, not the box's.
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
    // Use the image's rendered rect, so a handle cannot leave the image.
    const imagePixelLeft = boxRect.left + imageBounds.x * boxRect.width
    const imagePixelTop = boxRect.top + imageBounds.y * boxRect.height
    const imagePixelWidth = imageBounds.width * boxRect.width
    const imagePixelHeight = imageBounds.height * boxRect.height
    const normalizedX = (event.clientX - imagePixelLeft) / imagePixelWidth
    const normalizedY = (event.clientY - imagePixelTop) / imagePixelHeight
    // Cmd/Ctrl on a corner of a free crop keeps the image's own aspect ratio.
    const wantsAspectLock =
      (event.metaKey || event.ctrlKey) &&
      !lockedRatio &&
      CORNER_HANDLES.includes(handle)
    const effectiveLockedRatio =
      lockedRatio ??
      (wantsAspectLock && naturalAspect
        ? { width: naturalAspect, height: 1 }
        : undefined)
    onCropChange(
      resizeRectByHandle(
        currentCrop,
        handle,
        normalizedX,
        normalizedY,
        effectiveLockedRatio,
        naturalAspect ?? 1,
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
    dismissFocalHint()
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
    border: `1.5px solid ${ACCENT}`,
    boxShadow: "0 0 0 9999px rgba(0, 0, 0, 0.45)",
    cursor: dragTarget === "rect" ? "grabbing" : "move",
    pointerEvents: "auto",
    zIndex: 10,
  }

  const getHandleStyle = (handle: HandlePosition): CSSProperties => {
    const layout = handleLayout(handle)
    return {
      position: "absolute",
      left: layout.left,
      top: layout.top,
      transform: "translate(-50%, -50%)",
      width: "14px",
      height: "14px",
      backgroundColor: "white",
      border: `1.5px solid ${ACCENT}`,
      borderRadius: "1px",
      cursor: dragTarget === handle ? "grabbing" : layout.cursor,
      pointerEvents: "auto",
      zIndex: 12,
    }
  }

  const focalWholeImagePoint = focalToWholeImagePoint(currentFocal, currentCrop)
  const focalBoxSpace = toBoxSpace(focalWholeImagePoint)
  // A white disc keeps the marker legible over any image.
  const markerStyle: CSSProperties = {
    position: "absolute",
    left: `${focalBoxSpace.x * 100}%`,
    top: `${focalBoxSpace.y * 100}%`,
    transform: "translate(-50%, -50%)",
    width: "26px",
    height: "26px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: "50%",
    backgroundColor: "white",
    color: ACCENT,
    boxShadow: "0 0 0 1px rgba(0, 0, 0, 0.15), 0 1px 3px rgba(0, 0, 0, 0.35)",
    cursor: dragTarget === "focal" ? "grabbing" : "grab",
    pointerEvents: "auto",
    zIndex: 11,
  }

  // Positioned in the marker's box space, not a Popper tooltip, so it follows
  // the marker through async layout.
  const HINT_GAP = 10
  const HINT_PAD = 8
  const HINT_ARROW = 6
  const MARKER_HALF = 13
  const hintAnchorX = focalBoxSpace.x * boxSize.width
  const hintAnchorY = focalBoxSpace.y * boxSize.height
  const hintBelow =
    hintAnchorY - MARKER_HALF - HINT_GAP - HINT_ARROW - hintSize.height <
    HINT_PAD
  const hintTop = hintBelow
    ? hintAnchorY + MARKER_HALF + HINT_GAP + HINT_ARROW
    : hintAnchorY - MARKER_HALF - HINT_GAP - HINT_ARROW - hintSize.height
  const hintLeft = Math.min(
    Math.max(hintAnchorX - hintSize.width / 2, HINT_PAD),
    Math.max(HINT_PAD, boxSize.width - hintSize.width - HINT_PAD),
  )
  const hintArrowLeft = Math.min(
    Math.max(hintAnchorX - hintLeft, HINT_ARROW + 2),
    Math.max(HINT_ARROW + 2, hintSize.width - HINT_ARROW - 2),
  )
  const focalHintStyle: CSSProperties = {
    position: "absolute",
    left: `${hintLeft}px`,
    top: `${hintTop}px`,
    backgroundColor: "rgba(0, 0, 0, 0.8)",
    color: "white",
    fontSize: "0.75rem",
    lineHeight: 1.2,
    padding: "0.375rem 0.5rem",
    borderRadius: "0.25rem",
    whiteSpace: "nowrap",
    pointerEvents: "none",
    zIndex: 12,
  }
  const focalHintArrowStyle: CSSProperties = {
    position: "absolute",
    left: `${hintArrowLeft}px`,
    transform: "translateX(-50%)",
    width: 0,
    height: 0,
    borderLeft: `${HINT_ARROW}px solid transparent`,
    borderRight: `${HINT_ARROW}px solid transparent`,
    ...(hintBelow
      ? {
          bottom: "100%",
          borderBottom: `${HINT_ARROW}px solid rgba(0, 0, 0, 0.8)`,
        }
      : {
          top: "100%",
          borderTop: `${HINT_ARROW}px solid rgba(0, 0, 0, 0.8)`,
        }),
  }

  const displayImageStyle: CSSProperties = {
    width: "100%",
    height: "100%",
    objectFit: "contain",
    objectPosition: "center",
    userSelect: "none",
    pointerEvents: "none",
  }

  return (
    <Box
      position="relative"
      w="100%"
      h="100%"
      borderRadius="0.25rem"
      overflow="hidden"
      // The parent sets the size. The image letterboxes inside, so the canvas
      // height does not change per image.
      bgColor="#f3f4f6"
    >
      {/* `boxRef` measures this inset div, so every percentage below is
          relative to the padded frame. */}
      <Box ref={boxRef} position="absolute" inset="0.75rem">
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
                onPointerCancel={handlePointerUp}
                onLostPointerCapture={handlePointerUp}
              />
            ))}
          </div>
        )}

        {focalEnabled && (
          <>
            <div
              style={{ ...markerStyle, touchAction: "none" }}
              title="Move the focal point"
              onPointerEnter={dismissFocalHint}
              onPointerDown={handleFocalPointerDown}
              onPointerMove={handleFocalPointerMove}
              onPointerUp={handlePointerUp}
              onPointerCancel={handlePointerUp}
              onLostPointerCapture={handlePointerUp}
            >
              <BiCrosshair size={18} />
            </div>
            {showFocalHint && boxSize.width > 0 && (
              <div ref={hintRef} style={focalHintStyle}>
                Drag to set focal point
                <div style={focalHintArrowStyle} />
              </div>
            )}
          </>
        )}
      </Box>
    </Box>
  )
}
