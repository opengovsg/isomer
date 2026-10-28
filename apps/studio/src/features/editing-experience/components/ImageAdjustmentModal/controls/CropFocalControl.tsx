"use client"

import type { CSSProperties } from "react"
import { Box } from "@chakra-ui/react"
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react"
import { BiCrosshair } from "react-icons/bi"
import { generateAssetUrl } from "~/utils/generateAssetUrl"

// The brand accent, read from Chakra's generated CSS var so these inline styles
// (on raw canvas divs, where theme tokens aren't available) track the theme.
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
  // The host modal's open state. Re-showing the focal hint on every open (not
  // just on mount) needs an explicit open signal — this control's instance
  // can persist/remount independently of the modal's own open/close cycle.
  isOpen?: boolean
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
  isOpen,
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

  // Nudges a first-time user toward the focal marker — shown on every modal
  // open, dismissed for good as soon as they touch the marker.
  const [showFocalHint, setShowFocalHint] = useState(true)
  useEffect(() => {
    if (isOpen) setShowFocalHint(true)
  }, [isOpen])
  const dismissFocalHint = () => setShowFocalHint(false)
  // Measure the hint bubble so it can be clamped inside the canvas and its arrow
  // aimed at the marker. Measured pre-paint (useLayoutEffect) to avoid a flash.
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
    // Holding Cmd/Ctrl on a corner handle of a free (unratioed) crop locks the
    // drag to the image's own natural aspect ratio; edges can't express a
    // single-dimension lock, so the modifier is ignored there.
    const wantsAspectLock =
      (event.metaKey || event.ctrlKey) &&
      !lockedRatio &&
      CORNER_HANDLES.includes(handle)
    const effectiveLockedRatio =
      lockedRatio ??
      (wantsAspectLock && aspectRatio
        ? { width: aspectRatio, height: 1 }
        : undefined)
    onCropChange(
      resizeRectByHandle(
        currentCrop,
        handle,
        normalizedX,
        normalizedY,
        effectiveLockedRatio,
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

  const getHandleStyle = (handle: HandlePosition): CSSProperties => ({
    position: "absolute",
    left: HANDLE_LAYOUT[handle].left,
    top: HANDLE_LAYOUT[handle].top,
    transform: "translate(-50%, -50%)",
    width: "14px",
    height: "14px",
    backgroundColor: "white",
    border: `1.5px solid ${ACCENT}`,
    borderRadius: "1px",
    cursor: dragTarget === handle ? "grabbing" : HANDLE_LAYOUT[handle].cursor,
    pointerEvents: "auto",
    zIndex: 12,
  })

  const focalWholeImagePoint = focalToWholeImagePoint(currentFocal, currentCrop)
  const focalBoxSpace = toBoxSpace(focalWholeImagePoint)
  // A white disc behind the crosshair so the brand-blue marker stays legible
  // over any image; the ring + shadow separate it from light backgrounds. Sized
  // larger than the icon so the hit area stays reasonable.
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

  // On-load nudge toward the focal marker, rendered in the marker's own box-space
  // (not a Popper tooltip) so it tracks the marker through async layout. Clamped
  // inside the measured canvas frame and flipped above/below so it never clips.
  const HINT_GAP = 10
  const HINT_PAD = 8
  const HINT_ARROW = 6
  const MARKER_HALF = 13
  const hintAnchorX = focalBoxSpace.x * boxSize.width
  const hintAnchorY = focalBoxSpace.y * boxSize.height
  // Flip below the marker when there isn't room above.
  const hintBelow =
    hintAnchorY - MARKER_HALF - HINT_GAP - HINT_ARROW - hintSize.height <
    HINT_PAD
  const hintTop = hintBelow
    ? hintAnchorY + MARKER_HALF + HINT_GAP + HINT_ARROW
    : hintAnchorY - MARKER_HALF - HINT_GAP - HINT_ARROW - hintSize.height
  // Center on the marker, then clamp so the bubble stays inside the frame.
  const hintLeft = Math.min(
    Math.max(hintAnchorX - hintSize.width / 2, HINT_PAD),
    Math.max(HINT_PAD, boxSize.width - hintSize.width - HINT_PAD),
  )
  // Arrow sits at the marker's x within the (possibly shifted) bubble.
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
  // Triangle aimed at the marker: on the bubble's bottom edge when it sits above
  // the marker, on the top edge when it sits below.
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
          // The swapped width can exceed the box width; without this the global
          // `img { max-width: 100% }` would cap it and desync the displayed image
          // from the crop overlay (which uses the uncapped, swapped bounds).
          maxWidth: "none",
          maxHeight: "none",
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

  return (
    <Box
      position="relative"
      w="100%"
      h="100%"
      borderRadius="0.25rem"
      overflow="hidden"
      // Fills its slot; the parent wrapper owns the sizing (flex-fill on desktop,
      // a fixed height when stacked). The image is letterboxed inside via
      // object-contain and all crop/focal math maps through `imageBounds`, so the
      // canvas size is independent of the image's aspect — a stable editor height,
      // not one that grows/shrinks per image. Flat backdrop; the crop frame +
      // dim-outside overlay make the image bounds clear.
      bgColor="#f3f4f6"
    >
      {/* `boxRef`/`boxSize` measure THIS inset div (not the outer Box), so every
      percentage below — image, crop rect, handles, marker — is relative to the
      same padded frame and stays glued to the image's true edges. */}
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
          <>
            <div
              style={{ ...markerStyle, touchAction: "none" }}
              title="Move the focal point"
              onPointerEnter={dismissFocalHint}
              onPointerDown={handleFocalPointerDown}
              onPointerMove={handleFocalPointerMove}
              onPointerUp={handlePointerUp}
              onPointerLeave={handlePointerUp}
              onPointerCancel={handlePointerUp}
              onLostPointerCapture={handlePointerUp}
            >
              <BiCrosshair size={18} />
            </div>
            {/* On-load hint; co-located with the marker so it stays centered,
                clamped inside the canvas and flipped so it never clips. */}
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
