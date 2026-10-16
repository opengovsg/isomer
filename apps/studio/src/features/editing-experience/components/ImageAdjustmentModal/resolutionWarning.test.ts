import { describe, expect, it } from "vitest"

import { computeLowResWarning } from "./resolutionWarning"

describe("computeLowResWarning", () => {
  const fullCrop = { x: 0, y: 0, width: 1, height: 1 }

  it("returns undefined until the image has loaded (no natural size)", () => {
    expect(
      computeLowResWarning({ maxRenderedWidthPx: 1280, crop: fullCrop }),
    ).toBeUndefined()
  })

  it("returns undefined for components with no configured frame width", () => {
    expect(
      computeLowResWarning({
        naturalSize: { width: 100, height: 100 },
        crop: fullCrop,
      }),
    ).toBeUndefined()
  })

  it("does not warn when the crop fills the frame at 1x", () => {
    expect(
      computeLowResWarning({
        naturalSize: { width: 2000, height: 1200 },
        crop: fullCrop,
        maxRenderedWidthPx: 1280,
      }),
    ).toBeUndefined()
  })

  it("warns when the whole image is narrower than the frame", () => {
    expect(
      computeLowResWarning({
        naturalSize: { width: 800, height: 600 },
        crop: fullCrop,
        maxRenderedWidthPx: 1280,
      }),
    ).toEqual({ effectiveWidth: 800, targetWidth: 1280 })
  })

  it("warns when a tight crop drops the effective width below the frame", () => {
    // 2000px image, keeping half the width → 1000px effective < 1280.
    expect(
      computeLowResWarning({
        naturalSize: { width: 2000, height: 1200 },
        crop: { x: 0, y: 0, width: 0.5, height: 1 },
        maxRenderedWidthPx: 1280,
      }),
    ).toEqual({ effectiveWidth: 1000, targetWidth: 1280 })
  })

  it("uses the rotated output width (90° swaps width and height)", () => {
    // Landscape 2000×400: wide enough un-rotated (2000 ≥ 1280), but a 90°
    // rotation makes the cropped height (400px) the output width → warns.
    const size = { width: 2000, height: 400 }
    expect(
      computeLowResWarning({
        naturalSize: size,
        crop: fullCrop,
        maxRenderedWidthPx: 1280,
      }),
    ).toBeUndefined()
    expect(
      computeLowResWarning({
        naturalSize: size,
        crop: fullCrop,
        rotate: 90,
        maxRenderedWidthPx: 1280,
      }),
    ).toEqual({ effectiveWidth: 400, targetWidth: 1280 })
  })

  it("measures crop.width against the rotated display frame (not crop.height)", () => {
    // Square 2000×2000, rotated 90°. The crop is display-space: its WIDTH maps
    // to the (swapped) display width. A full-width / half-height crop ships at
    // 1×2000 = 2000px (sharp) and must NOT warn; the mirrored half-width /
    // full-height crop ships at 1000px and MUST warn. A naive implementation
    // that cropped the un-rotated frame then rotated would swap these.
    const size = { width: 2000, height: 2000 }
    expect(
      computeLowResWarning({
        naturalSize: size,
        crop: { x: 0, y: 0, width: 1, height: 0.5 },
        rotate: 90,
        maxRenderedWidthPx: 1280,
      }),
    ).toBeUndefined()
    expect(
      computeLowResWarning({
        naturalSize: size,
        crop: { x: 0, y: 0, width: 0.5, height: 1 },
        rotate: 90,
        maxRenderedWidthPx: 1280,
      }),
    ).toEqual({ effectiveWidth: 1000, targetWidth: 1280 })
  })

  it("falls back to the full-image default crop when none is set yet", () => {
    // No crop and no locked ratio → the default is the whole image.
    expect(
      computeLowResWarning({
        naturalSize: { width: 500, height: 500 },
        maxRenderedWidthPx: 1280,
      }),
    ).toEqual({ effectiveWidth: 500, targetWidth: 1280 })
  })
})
