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

  it("falls back to the full-image default crop when none is set yet", () => {
    // No crop and no locked ratio → the default is the whole image.
    expect(
      computeLowResWarning({
        naturalSize: { width: 500, height: 500 },
        maxRenderedWidthPx: 1280,
      }),
    ).toEqual({ effectiveWidth: 500, targetWidth: 1280 })
  })

  it("falls back to the locked-ratio default crop when none is set yet", () => {
    // 300x180 landscape image, 5:6 portrait frame → defaultCropRect fits the
    // largest centered 5:6 rect: width = 0.5 (normalized), giving a 150px-wide
    // pixel crop (0.25*300 to 0.75*300) — below the 200px target.
    expect(
      computeLowResWarning({
        naturalSize: { width: 300, height: 180 },
        lockedRatio: { width: 5, height: 6 },
        maxRenderedWidthPx: 200,
      }),
    ).toEqual({ effectiveWidth: 150, targetWidth: 200 })
  })
})
