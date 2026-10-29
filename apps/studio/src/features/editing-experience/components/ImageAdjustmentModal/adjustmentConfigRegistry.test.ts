import { describe, expect, it } from "vitest"

import {
  INTENTIONALLY_NOT_ADJUSTABLE,
  resolveAdjustmentConfig,
} from "./adjustmentConfigRegistry"

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
      ...INTENTIONALLY_NOT_ADJUSTABLE.map((type) => ({ type })),
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

  // ImageGallery (P2b): array-nested, always letterboxed (object-contain). Crop
  // is offered but there's no focal (nothing cover-fits), and the preview uses
  // the framed approximation with a contain fit (the real component renders the
  // whole gallery, not the single image being edited).
  describe("imagegallery (P2b — crop, letterboxed)", () => {
    const config = resolveAdjustmentConfig({
      block: { type: "imagegallery" },
      fieldName: "src",
    })

    it("resolves a custom-crop, no-focal, contain-preview config", () => {
      expect(config).toBeDefined()
      expect(config?.cropMode).toBe("custom")
      expect(config?.focalEnabled).toBe(false)
      expect(config?.lockedRatios).toBeUndefined()
      // Array-nested: preview the single image framed, not the whole gallery.
      expect(config?.skipRealComponentPreview).toBe(true)
      // Always letterboxed → the preview must contain, never cover.
      expect(config?.previewObjectFitFor?.({})).toBe("contain")
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
      }
      // cardsWithImages previews just the cropped image (framed approximation):
      // its text sits below the image and adds nothing to a crop/focal preview.
      expect(withImages?.skipRealComponentPreview).toBe(true)
      expect(withImages?.buildSingleItemPreviewBlock).toBeUndefined()
      // cardsWithFullImages overlays the title on the image, so it renders the
      // real card (single card spliced into the block) to show text-over-image.
      expect(fullImage?.skipRealComponentPreview).toBeFalsy()
      expect(fullImage?.buildSingleItemPreviewBlock).toBeTypeOf("function")
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

  // Regression (resolutionWarning gap): every custom-crop (free-aspect)
  // cover-fit component must supply maxRenderedHeightPx, not just
  // maxRenderedWidthPx — otherwise computeLowResWarning only ever checks the
  // crop's width, and a wide-but-short custom crop (e.g. a 1300×300 region)
  // can pass the width check while still blurring out when the component
  // stretches it to fill a tall cover frame. Values are derived from each
  // component's actual rendered frame height (see the config comments) or,
  // where the frame itself has no fixed height, the Isomer image guidelines'
  // minimum (Notion). Fixed-ratio (cropMode "fixed") components are exempt:
  // the UI constrains their crop to a locked aspect, so width and height can
  // never diverge independently.
  describe("custom-crop cover-fit components configure a height threshold", () => {
    const cases: { label: string; block: unknown; expectedHeight: number }[] = [
      {
        label: "hero:gradient",
        block: { type: "hero", variant: "gradient" },
        expectedHeight: 500,
      },
      {
        label: "hero:block",
        block: { type: "hero", variant: "block" },
        expectedHeight: 500,
      },
      {
        label: "hero:largeImage",
        block: { type: "hero", variant: "largeImage" },
        expectedHeight: 640,
      },
      {
        label: "infopic",
        block: { type: "infopic" },
        expectedHeight: 400,
      },
      {
        label: "infocards:cardsWithImages",
        block: { type: "infocards", variant: "cardsWithImages" },
        expectedHeight: 427,
      },
      {
        label: "infocards:cardsWithFullImages",
        block: { type: "infocards", variant: "cardsWithFullImages" },
        expectedHeight: 640,
      },
    ]

    for (const { label, block, expectedHeight } of cases) {
      it(`${label} sets maxRenderedHeightPx (${expectedHeight})`, () => {
        const config = resolveAdjustmentConfig({ block, fieldName: "image" })
        expect(config?.cropMode).toBe("custom")
        expect(config?.maxRenderedHeightPx).toBe(expectedHeight)
      })
    }
  })

  // Focal point rule: the control is only ever worth offering when the
  // component's rendered frame actually reshapes across breakpoints — that's
  // the only situation where an anchor point has anything to do. A fixed crop
  // baked once (same shape everywhere) or a letterboxed/contain frame (whole
  // image always shown, regardless of frame shape) leaves focal with nothing
  // to anchor. Locks this invariant in across the whole registry so a future
  // entry can't set focalEnabled ad hoc.
  describe("focal point is offered only for breakpoint-reshaping (responsive cover) frames", () => {
    it("responsive cover-fit components have focal enabled", () => {
      const responsiveBlocks = [
        { type: "hero", variant: "gradient" }, // 16:10 -> 2:1 -> 5:2
        { type: "hero", variant: "block" }, // stacked band -> side-by-side
        { type: "hero", variant: "largeImage" }, // square -> 2:1
        { type: "infopic" }, // 5:4 -> 2:1 -> 3:1
      ]
      for (const block of responsiveBlocks) {
        const config = resolveAdjustmentConfig({ block, fieldName: "image" })
        expect(config?.focalEnabled).toBe(true)
      }
    })

    it("fixed-crop (baked-once, same shape every breakpoint) components have focal disabled", () => {
      const fixedBlocks = [
        { type: "contentpic" }, // aspect-[5/6] always
        { type: "blockquote" }, // 1:1 always (circle/square mask only)
        { type: "hero", variant: "floating" }, // aspect-[3/2] always
      ]
      for (const block of fixedBlocks) {
        const config = resolveAdjustmentConfig({ block, fieldName: "image" })
        expect(config?.cropMode).toBe("fixed")
        expect(config?.focalEnabled).toBe(false)
      }
    })

    it("free-form or letterboxed (object-contain) components have focal disabled even though cropMode is custom", () => {
      // Native Image block: free-form crop, renders at its own cropped
      // aspect with no frame to cover-fit into.
      const image = resolveAdjustmentConfig({
        block: { type: "image" },
        fieldName: "src",
      })
      expect(image?.cropMode).toBe("custom")
      expect(image?.focalEnabled).toBe(false)

      // ImageGallery: frame height/ratio does vary by breakpoint, but it's
      // always object-contain (letterboxed) -- the whole image is shown
      // regardless of frame shape, so there's still nothing to anchor.
      const gallery = resolveAdjustmentConfig({
        block: { type: "imagegallery" },
        fieldName: "src",
      })
      expect(gallery?.cropMode).toBe("custom")
      expect(gallery?.focalEnabled).toBe(false)
    })

    it("InfoCards (Tier C) ties focal to imageFit, not just the responsive frame", () => {
      // The InfoCards frame genuinely reshapes across breakpoints/columns
      // (common.ts cardImageContainer), so focalEnabled defaults to true --
      // but focalEnabledFor hides it once imageFit is "contain", since a
      // letterboxed image has nothing for focal to anchor either.
      for (const variant of ["cardsWithImages", "cardsWithFullImages"]) {
        const config = resolveAdjustmentConfig({
          block: { type: "infocards", variant },
          fieldName: "imageUrl",
        })
        expect(config?.focalEnabled).toBe(true)
        expect(config?.focalEnabledFor?.({ imageFit: "contain" })).toBe(false)
        expect(config?.focalEnabledFor?.({ imageFit: "cover" })).toBe(true)
      }
    })
  })
})
