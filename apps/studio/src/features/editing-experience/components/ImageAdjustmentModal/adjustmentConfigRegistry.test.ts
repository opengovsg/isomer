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

  // Tier D = preserve-only: these components have image fields but must never
  // offer crop/focal adjustment. The registry is an allow-list, so the guarantee
  // is simply that none of them resolve a config — which is what hides the
  // "Adjust image" entry point in JsonFormsImageControl. Lock that in so a future
  // registry entry can't silently light the modal up on one of them.
  describe("Tier D (preserve-only) blocks resolve no config", () => {
    const tierDBlocks = [
      { type: "imagegallery" },
      { type: "logocloud" },
      { type: "video" },
      { type: "navbar" },
    ]
    for (const block of tierDBlocks) {
      it(`returns undefined for "${block.type}"`, () => {
        expect(
          resolveAdjustmentConfig({ block, fieldName: "src" }),
        ).toBeUndefined()
      })
    }
  })

  // Native Image block (P2a): the one block that offers a free-form crop with no
  // focal point — it renders at its own cropped aspect ratio, so nothing
  // cover-fits and an anchor would have nothing to anchor. Lock in custom/no-focal
  // and that it previews the real component (not the framed approximation).
  describe("image (P2a — free-form crop)", () => {
    const config = resolveAdjustmentConfig({
      block: { type: "image" },
      fieldName: "src",
    })

    it("resolves a custom-crop, no-focal config", () => {
      expect(config).toBeDefined()
      expect(config?.cropMode).toBe("custom")
      expect(config?.focalEnabled).toBe(false)
      expect(config?.lockedRatios).toBeUndefined()
      expect(config?.skipRealComponentPreview).toBeFalsy()
      expect(config?.previewStates.length).toBeGreaterThan(0)
    })
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

    it("resolves a crop+focal config for both image variants", () => {
      for (const config of [withImages, fullImage]) {
        expect(config).toBeDefined()
        expect(config?.cropMode).toBe("custom")
        expect(config?.focalEnabled).toBe(true)
        // Array-nested field: preview the single card, not the whole block.
        expect(config?.skipRealComponentPreview).toBe(true)
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

    it("offers the focal point only when the card's imageFit is cover (or unset)", () => {
      const focalEnabledFor = withImages?.focalEnabledFor
      expect(focalEnabledFor).toBeDefined()
      // Unset defaults to cover.
      expect(focalEnabledFor?.({})).toBe(true)
      expect(focalEnabledFor?.({ imageFit: "cover" })).toBe(true)
      // "contain" (Resize image to fit) letterboxes the whole image — no focal.
      expect(focalEnabledFor?.({ imageFit: "contain" })).toBe(false)
    })

    it("previews with object-contain only under 'Resize image to fit'", () => {
      const previewObjectFitFor = withImages?.previewObjectFitFor
      expect(previewObjectFitFor).toBeDefined()
      expect(previewObjectFitFor?.({})).toBe("cover")
      expect(previewObjectFitFor?.({ imageFit: "cover" })).toBe("cover")
      expect(previewObjectFitFor?.({ imageFit: "contain" })).toBe("contain")
    })

    it("mirrors the full-image card's bottom gradient overlay as a scrim", () => {
      expect(withImages?.scrim).toBeUndefined()
      expect(fullImage?.scrim?.className).toContain("bg-gradient-to-t")
    })
  })
})
