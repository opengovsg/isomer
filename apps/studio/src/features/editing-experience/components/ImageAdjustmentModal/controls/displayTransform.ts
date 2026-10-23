import type { CropRectNormalized } from "./cropGeometry"

export type Rotation = 0 | 90 | 180 | 270

// Normalize any multiple of 90 back into the 0|90|180|270 domain, including the
// negative values produced by rotating left (e.g. 0 - 90 = -90 -> 270).
export const normalizeRotation = (deg: number): Rotation =>
  (((deg % 360) + 360) % 360) as Rotation

// The new rotate value for a "rotate right/left" command given the current
// flip state. The displayed image is `flip ∘ rotate`, and a single reflection
// reverses rotational sense (conjugating a rotation by a reflection negates
// it) — so when exactly one flip is active, the stored rotate delta must be
// inverted to keep "rotate right" turning the DISPLAYED image right. With zero
// or both flips the sense is preserved. The crop/focal, by contrast, always
// move in the commanded display direction (they follow what the editor sees),
// so the caller rotates them by the command direction regardless of this.
export const nextRotation = (
  current: { rotate: Rotation; flipH: boolean; flipV: boolean },
  direction: "cw" | "ccw",
): Rotation => {
  const commandCw = direction === "cw"
  const singleFlip = current.flipH !== current.flipV
  const valueCw = singleFlip ? !commandCw : commandCw
  return normalizeRotation(current.rotate + (valueCw ? 90 : -90))
}

// Crop and focal are stored in "display" space (the rotated/flipped image the
// editor cropped against). When the editor rotates/flips again, the existing
// crop + focal must move with the image content so they keep framing the same
// subject — these are the symmetry maps of the unit square that do that. Every
// map takes a value in [0,1] (point) or a normalized rect in [0,1]^2 and
// returns the same in the new orientation.

interface Point {
  x: number
  y: number
}

// --- points (used for the crop-relative focal) ---
export const rotatePointCw = ({ x, y }: Point): Point => ({ x: 1 - y, y: x })
export const rotatePointCcw = ({ x, y }: Point): Point => ({ x: y, y: 1 - x })
export const flipPointH = ({ x, y }: Point): Point => ({ x: 1 - x, y })
export const flipPointV = ({ x, y }: Point): Point => ({ x, y: 1 - y })

// --- axis-aligned rects (90-degree rotations and flips keep rects
// axis-aligned, so the crop stays a clean rectangle in every orientation) ---
export const rotateRectCw = ({
  x,
  y,
  width,
  height,
}: CropRectNormalized): CropRectNormalized => ({
  x: 1 - y - height,
  y: x,
  width: height,
  height: width,
})

export const rotateRectCcw = ({
  x,
  y,
  width,
  height,
}: CropRectNormalized): CropRectNormalized => ({
  x: y,
  y: 1 - x - width,
  width: height,
  height: width,
})

export const flipRectH = ({
  x,
  y,
  width,
  height,
}: CropRectNormalized): CropRectNormalized => ({
  x: 1 - x - width,
  y,
  width,
  height,
})

export const flipRectV = ({
  x,
  y,
  width,
  height,
}: CropRectNormalized): CropRectNormalized => ({
  x,
  y: 1 - y - height,
  width,
  height,
})
