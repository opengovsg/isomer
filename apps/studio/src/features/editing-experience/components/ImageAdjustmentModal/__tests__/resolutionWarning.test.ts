import { describe, expect, it } from "vitest"

import { computeLowResWarning } from "../resolutionWarning"

describe("computeLowResWarning", () => {
  const fullCrop = { x: 0, y: 0, width: 1, height: 1 }

  it("returns undefined until the image has loaded (no natural size)", () => {
    expect(
      computeLowResWarning({ maxRenderedWidthPx: 1280, crop: fullCrop }),
    ).toBeUndefined()
  })

  it("returns undefined for components with no configured frame size", () => {
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
    ).toEqual({ dimension: "width", effectivePx: 800, targetPx: 1280 })
  })

  it("warns when a tight crop drops the effective width below the frame", () => {
    expect(
      computeLowResWarning({
        naturalSize: { width: 2000, height: 1200 },
        crop: { x: 0, y: 0, width: 0.5, height: 1 },
        maxRenderedWidthPx: 1280,
      }),
    ).toEqual({ dimension: "width", effectivePx: 1000, targetPx: 1280 })
  })

  // PR #3621 review: the Image column is ~943px wide just below `lg`.
  it("warns on a crop that fills the old 768 floor but not the real frame", () => {
    expect(
      computeLowResWarning({
        naturalSize: { width: 900, height: 600 },
        crop: fullCrop,
        maxRenderedWidthPx: 960,
      }),
    ).toEqual({ dimension: "width", effectivePx: 900, targetPx: 960 })
  })

  it("falls back to the full-image default crop when none is set yet", () => {
    expect(
      computeLowResWarning({
        naturalSize: { width: 500, height: 500 },
        maxRenderedWidthPx: 1280,
      }),
    ).toEqual({ dimension: "width", effectivePx: 500, targetPx: 1280 })
  })

  describe("cover: either axis short upscales (reports the worst)", () => {
    it("warns on a wide-but-short crop via the height axis", () => {
      expect(
        computeLowResWarning({
          naturalSize: { width: 2000, height: 300 },
          crop: fullCrop,
          maxRenderedWidthPx: 1280,
          maxRenderedHeightPx: 456,
          objectFit: "cover",
        }),
      ).toEqual({ dimension: "height", effectivePx: 300, targetPx: 456 })
    })

    it("reports the axis that falls furthest short", () => {
      // Width needs 1.6x upscaling, height 1.52x.
      expect(
        computeLowResWarning({
          naturalSize: { width: 800, height: 300 },
          crop: fullCrop,
          maxRenderedWidthPx: 1280,
          maxRenderedHeightPx: 456,
          objectFit: "cover",
        }),
      ).toEqual({ dimension: "width", effectivePx: 800, targetPx: 1280 })
    })
  })

  describe("contain: only upscaled when BOTH axes fall short", () => {
    const frame = {
      maxRenderedWidthPx: 960,
      maxRenderedHeightPx: 456,
      objectFit: "contain" as const,
    }

    it("does not warn on a wide landscape crop (fills the width)", () => {
      expect(
        computeLowResWarning({
          naturalSize: { width: 1200, height: 400 },
          crop: fullCrop,
          ...frame,
        }),
      ).toBeUndefined()
    })

    it("does not warn on a tall portrait crop (fills the height)", () => {
      // A width-only check would warn here, since 500 < 960.
      expect(
        computeLowResWarning({
          naturalSize: { width: 500, height: 1500 },
          crop: fullCrop,
          ...frame,
        }),
      ).toBeUndefined()
    })

    it("warns on a genuinely small crop, reporting the binding axis", () => {
      // Width needs 1.92x, height 1.52x. Contain upscales by the smaller.
      expect(
        computeLowResWarning({
          naturalSize: { width: 500, height: 300 },
          crop: fullCrop,
          ...frame,
        }),
      ).toEqual({ dimension: "height", effectivePx: 300, targetPx: 456 })
    })
  })

  it("falls back to the locked-ratio default crop when none is set yet", () => {
    // The default 5:6 crop of a 300x180 image is 150px wide.
    expect(
      computeLowResWarning({
        naturalSize: { width: 300, height: 180 },
        lockedRatio: { width: 5, height: 6 },
        maxRenderedWidthPx: 200,
      }),
    ).toEqual({ dimension: "width", effectivePx: 150, targetPx: 200 })
  })
})
