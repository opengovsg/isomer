import type { IsomerSiteProps } from "@opengovsg/isomer-components"
import { renderComponent } from "@opengovsg/isomer-components"
import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it } from "vitest"

import {
  INTENTIONALLY_NOT_ADJUSTABLE,
  resolveAdjustmentConfig,
} from "./adjustmentConfigRegistry"

// Minimal site stub for rendering a single block in isolation — mirrors
// AdjustmentPreview's own PREVIEW_SITE_STUB.
const SITE_STUB = {
  assetsBaseUrl: "",
  siteMapArray: [],
} as unknown as IsomerSiteProps

describe("resolveAdjustmentConfig", () => {
  it("returns undefined for components not yet wired", () => {
    expect(
      resolveAdjustmentConfig({ block: { type: "prose" }, fieldName: "image" }),
    ).toBeUndefined()
    expect(
      resolveAdjustmentConfig({ block: null, fieldName: "image" }),
    ).toBeUndefined()
  })

  it("returns undefined for an unregistered field name on an otherwise-registered block", () => {
    expect(
      resolveAdjustmentConfig({
        block: { type: "hero", variant: "floating" },
        fieldName: "someOtherField",
      }),
    ).toBeUndefined()
    expect(
      resolveAdjustmentConfig({
        block: { type: "infocards", variant: "cardsWithImages" },
        fieldName: "someOtherField",
      }),
    ).toBeUndefined()
  })

  // Tier D = preserve-only: these components have image fields but must never
  // offer crop/focal adjustment. The registry is an allow-list, so the guarantee
  // is simply that none of them resolve a config — which is what hides the
  // "Adjust image" entry point in JsonFormsImageControl. Lock that in so a future
  // registry entry can't silently light the modal up on one of them.
  describe("Tier D (preserve-only) blocks resolve no config", () => {
    const tierDBlocks = [
      { type: "image" },
      { type: "imagegallery" },
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
        // Array-nested field: preview renders the real card in its real
        // position, not a hand-built approximation.
        expect(config?.buildSingleItemPreviewBlock).toBeDefined()
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

    it("splices the edited card back into its real position among siblings", () => {
      const originalCard = { imageUrl: "/old.png" }
      const block = {
        type: "infocards",
        variant: "cardsWithImages",
        title: "Section title",
        subtitle: "Section subtitle",
        label: "See all",
        url: "/some-link",
        maxColumns: "3",
        cards: [originalCard, { imageUrl: "/other.png" }],
      }
      const editedCard = { imageUrl: "/new.png" }
      const preview = withImages?.buildSingleItemPreviewBlock?.(
        block,
        editedCard,
        originalCard,
      ) as Record<string, unknown>
      expect(preview.cards).toEqual([editedCard, { imageUrl: "/other.png" }])
      expect(preview.title).toBe("")
      expect(preview.subtitle).toBeUndefined()
      expect(preview.label).toBeUndefined()
      expect(preview.url).toBeUndefined()
      // Non-chrome fields (needed by the real renderer) pass through untouched.
      expect(preview.maxColumns).toBe("3")
    })

    it("falls back to a single-card array when the original card isn't among the block's siblings", () => {
      const block = {
        type: "infocards",
        variant: "cardsWithImages",
        cards: [{ imageUrl: "/a.png" }],
      }
      const detachedCard = { imageUrl: "/detached.png" }
      const preview = withImages?.buildSingleItemPreviewBlock?.(
        block,
        detachedCard,
      ) as Record<string, unknown>
      expect(preview.cards).toEqual([detachedCard])
    })

    it("renders the real grid for real, with the edited card's image updated and siblings unchanged", () => {
      const cardA = { imageUrl: "/a.png", imageAlt: "a", title: "Card A" }
      const cardB = { imageUrl: "/b.png", imageAlt: "b", title: "Card B" }
      const cardC = { imageUrl: "/c.png", imageAlt: "c", title: "Card C" }
      const block = {
        type: "infocards",
        variant: "cardsWithImages",
        maxColumns: "3",
        layout: "content",
        cards: [cardA, cardB, cardC],
      }
      const editedCard = { ...cardB, imageUrl: "/edited.png" }
      const preview = withImages?.buildSingleItemPreviewBlock?.(
        block,
        editedCard,
        cardB,
      )
      const html = renderToStaticMarkup(
        renderComponent({
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          component: preview as any,
          layout: "content",
          site: SITE_STUB,
          permalink: "",
          headingLevel: 1,
        }),
      )

      expect(html.match(/<img/g)).toHaveLength(3)
      expect(html).toContain("/edited.png")
      expect(html).not.toContain("/b.png")
      expect(html).toContain("/a.png")
      expect(html).toContain("/c.png")
      expect(html).toContain("Card A")
      expect(html).toContain("Card B")
      expect(html).toContain("Card C")
    })

    it("the full-image variant renders the real title + gradient overlay for real", () => {
      const card = { imageUrl: "/a.png", imageAlt: "a", title: "Real title" }
      const block = {
        type: "infocards",
        variant: "cardsWithFullImages",
        maxColumns: "3",
        layout: "content",
        cards: [card],
      }
      const editedCard = { ...card, imageUrl: "/edited.png" }
      const preview = fullImage?.buildSingleItemPreviewBlock?.(
        block,
        editedCard,
        card,
      )
      const html = renderToStaticMarkup(
        renderComponent({
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          component: preview as any,
          layout: "content",
          site: SITE_STUB,
          permalink: "",
          headingLevel: 1,
        }),
      )

      expect(html).toContain("Real title")
      expect(html).toContain("bg-gradient-to-t")
    })
  })
})
