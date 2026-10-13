import { describe, expect, it } from "vitest"

import { resolveAdjustmentConfig } from "./adjustmentConfigRegistry"

describe("resolveAdjustmentConfig", () => {
  it("returns undefined for components not yet wired", () => {
    expect(
      resolveAdjustmentConfig({ block: { type: "prose" }, fieldName: "image" }),
    ).toBeUndefined()
    expect(
      resolveAdjustmentConfig({ block: null, fieldName: "image" }),
    ).toBeUndefined()
  })

  describe("hero:floating", () => {
    const config = resolveAdjustmentConfig({
      block: { type: "hero", variant: "floating" },
      fieldName: "backgroundUrl",
    })

    // The floating text card overlaps the image by a different amount at each
    // breakpoint (-1.5rem below md, -10rem at md, -17.85rem at lg), so the
    // preview must exercise all three regimes — a single desktop state would
    // hide how much the card covers the subject on mobile/tablet.
    it("previews all three responsive breakpoint regimes", () => {
      expect(config).toBeDefined()
      expect(config?.previewStates.map((s) => s.viewportWidth)).toEqual([
        375, 768, 1280,
      ])
    })
  })

  describe("infocards (Tier C — conditional Fit/Fill)", () => {
    const withImages = resolveAdjustmentConfig({
      block: { type: "infocards", variant: "cardsWithImages" },
      fieldName: "imageUrl",
    })
    const fullImage = resolveAdjustmentConfig({
      block: { type: "infocards", variant: "cardsWithFullImages" },
      fieldName: "imageUrl",
    })

    it("resolves a cover+focal config for both image variants", () => {
      for (const config of [withImages, fullImage]) {
        expect(config).toBeDefined()
        expect(config?.cropMode).toBe("custom")
        expect(config?.focalEnabled).toBe(true)
        // Array-nested field: preview the single card, not the whole block.
        expect(config?.skipRealComponentPreview).toBe(true)
        expect(config?.disabledReason).toBeTruthy()
      }
    })

    it("does not resolve for the no-image variant", () => {
      expect(
        resolveAdjustmentConfig({
          block: { type: "infocards", variant: "cardsWithoutImages" },
          fieldName: "imageUrl",
        }),
      ).toBeUndefined()
    })

    it("is adjustable only when the card's imageFit is cover (or unset)", () => {
      const isAdjustable = withImages?.isAdjustable
      expect(isAdjustable).toBeDefined()
      // Unset defaults to cover.
      expect(isAdjustable?.({})).toBe(true)
      expect(isAdjustable?.({ imageFit: "cover" })).toBe(true)
      // "contain" (Resize image to fit) has nothing to crop.
      expect(isAdjustable?.({ imageFit: "contain" })).toBe(false)
    })

    it("mirrors the full-image card's bottom gradient overlay as a scrim", () => {
      expect(withImages?.scrim).toBeUndefined()
      expect(fullImage?.scrim?.className).toContain("bg-gradient-to-t")
    })
  })
})
