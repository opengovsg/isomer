import { describe, expect, it } from "vitest"

import { computeLowResWarning } from "./resolutionWarning"

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
    // 2000px image, keeping half the width → 1000px effective < 1280.
    expect(
      computeLowResWarning({
        naturalSize: { width: 2000, height: 1200 },
        crop: { x: 0, y: 0, width: 0.5, height: 1 },
        maxRenderedWidthPx: 1280,
      }),
    ).toEqual({ dimension: "width", effectivePx: 1000, targetPx: 1280 })
  })

  // Regression (PR #3621 review): the native Image column is ~943px wide just
  // below `lg`, so the threshold is 960 — a crop between the old 768 floor and
  // 960 must now warn.
  it("warns on a crop that fills the old 768 floor but not the real frame", () => {
    expect(
      computeLowResWarning({
        naturalSize: { width: 900, height: 600 },
        crop: fullCrop,
        maxRenderedWidthPx: 960,
      }),
    ).toEqual({ dimension: "width", effectivePx: 900, targetPx: 960 })
  })

  it("uses the rotated output width (90° swaps width and height)", () => {
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
    ).toEqual({ dimension: "width", effectivePx: 400, targetPx: 1280 })
  })

  it("measures crop.width against the rotated display frame (not crop.height)", () => {
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
    ).toEqual({ dimension: "width", effectivePx: 1000, targetPx: 1280 })
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
      // 2000×300 fills the width (2000 ≥ 1280) but is too short (300 < 456).
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
      // width ratio 1280/800 = 1.6; height ratio 456/300 = 1.52 → width is worse.
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
    // Gallery frame: 960 wide × 456 tall, object-contain.
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
      // Regression: width-only would have false-warned (500 < 960) even though
      // contain scales this down to fit the 456px height — sharp.
      expect(
        computeLowResWarning({
          naturalSize: { width: 500, height: 1500 },
          crop: fullCrop,
          ...frame,
        }),
      ).toBeUndefined()
    })

    it("warns on a genuinely small crop, reporting the binding axis", () => {
      // 500×300: width ratio 960/500 = 1.92, height ratio 456/300 = 1.52 →
      // contain fills on the smaller ratio (height), the actual upscale.
      expect(
        computeLowResWarning({
          naturalSize: { width: 500, height: 300 },
          crop: fullCrop,
          ...frame,
        }),
      ).toEqual({ dimension: "height", effectivePx: 300, targetPx: 456 })
    })
  })
})
