import type { IsomerSiteProps } from "@opengovsg/isomer-components"
import { renderComponent } from "@opengovsg/isomer-components"
import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it } from "vitest"

import { resolveAdjustmentConfig } from "./adjustmentConfigRegistry"

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
        // Array-nested field: preview renders the single card, not the whole
        // block/all cards.
        expect(config?.buildPreviewBlock).toBeDefined()
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

    it("builds a single-card preview block from the owner block and the edited card", () => {
      const block = {
        type: "infocards",
        variant: "cardsWithImages",
        title: "Section title",
        subtitle: "Section subtitle",
        label: "See all",
        url: "/some-link",
        maxColumns: "3",
        cards: [{ imageUrl: "/old.png" }, { imageUrl: "/other.png" }],
      }
      const card = { imageUrl: "/new.png" }
      const preview = withImages?.buildPreviewBlock?.(block, card) as Record<
        string,
        unknown
      >
      expect(preview.cards).toEqual([card])
      expect(preview.title).toBeUndefined()
      expect(preview.subtitle).toBeUndefined()
      expect(preview.label).toBeUndefined()
      expect(preview.url).toBeUndefined()
      // Non-chrome fields (needed by the real renderer) pass through untouched.
      expect(preview.maxColumns).toBe("3")
    })

    it("renders exactly one card for real, from a block with several cards", () => {
      const block = {
        type: "infocards",
        variant: "cardsWithImages",
        maxColumns: "3",
        layout: "content",
        cards: [
          { imageUrl: "/a.png", imageAlt: "a", title: "Card A" },
          { imageUrl: "/b.png", imageAlt: "b", title: "Card B" },
          { imageUrl: "/c.png", imageAlt: "c", title: "Card C" },
        ],
      }
      const editedCard = { imageUrl: "/edited.png", imageAlt: "edited" }
      const preview = withImages?.buildPreviewBlock?.(block, editedCard)
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

      expect(html.match(/<img/g)).toHaveLength(1)
      expect(html).toContain("/edited.png")
      expect(html).not.toContain("Card A")
    })

    it("the full-image variant renders the real title + gradient overlay for real", () => {
      const block = {
        type: "infocards",
        variant: "cardsWithFullImages",
        maxColumns: "3",
        layout: "content",
        cards: [{ imageUrl: "/a.png", imageAlt: "a", title: "Real title" }],
      }
      const editedCard = {
        imageUrl: "/edited.png",
        imageAlt: "edited",
        title: "Real title",
      }
      const preview = fullImage?.buildPreviewBlock?.(block, editedCard)
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
