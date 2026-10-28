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

    // The real card frame (InfoCards/common.ts cardImageContainer) is 3:2 at
    // every breakpoint EXCEPT lg+, where only two combos are overridden:
    // homepage+2-column -> 2:1, default(content-page)+3-column -> 1:1 square.
    // Every other combo (including 1-column, which has no lg override) stays
    // 3:2 for both layouts. The preview must reflect the block's own
    // maxColumns, previewing both layouts only where they actually diverge.
    describe("desktop preview states follow the block's maxColumns", () => {
      const desktopStatesFor = (maxColumns?: string) =>
        resolveAdjustmentConfig({
          block: { type: "infocards", variant: "cardsWithImages", maxColumns },
          fieldName: "imageUrl",
        })?.previewStates.filter((s) => s.id !== "mobile")

      it("3 columns (default): previews content-page square and homepage 3:2 separately", () => {
        const states = desktopStatesFor("3")
        expect(states?.map((s) => s.layout)).toEqual(["content", "homepage"])
        expect(states?.map((s) => s.aspectRatio)).toEqual([
          { width: 1, height: 1 },
          { width: 3, height: 2 },
        ])
      })

      it("2 columns: previews content-page 3:2 and homepage 2:1 separately", () => {
        const states = desktopStatesFor("2")
        expect(states?.map((s) => s.layout)).toEqual(["content", "homepage"])
        expect(states?.map((s) => s.aspectRatio)).toEqual([
          { width: 3, height: 2 },
          { width: 2, height: 1 },
        ])
      })

      it("1 column: both layouts render the same 3:2 shape, so a single state covers it", () => {
        const states = desktopStatesFor("1")
        expect(states).toHaveLength(1)
        expect(states?.[0]?.aspectRatio).toEqual({ width: 3, height: 2 })
      })

      it("defaults to 3 columns when maxColumns is unset", () => {
        expect(desktopStatesFor(undefined)).toEqual(desktopStatesFor("3"))
      })
    })
  })

  describe("blockquote (per-state layout override)", () => {
    const config = resolveAdjustmentConfig({
      block: { type: "blockquote" },
      fieldName: "imageSrc",
    })

    // Blockquote renders the same 1:1 image as a circle everywhere except the
    // homepage, where it's a square — a real-component preview regression here
    // would mean an editor never sees the shape their crop will actually take.
    it("previews a circle state for content pages and a square state for the homepage", () => {
      expect(config).toBeDefined()
      expect(config?.previewStates).toEqual([
        expect.objectContaining({ id: "circle", layout: "content" }),
        expect.objectContaining({ id: "square", layout: "homepage" }),
      ])
    })

    it("stacks the two 1:1 states instead of showing them side-by-side", () => {
      expect(config?.stackPreviews).toBe(true)
    })
  })
})
