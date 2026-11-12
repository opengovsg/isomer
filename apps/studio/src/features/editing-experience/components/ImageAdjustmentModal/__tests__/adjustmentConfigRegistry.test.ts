import type {
  IsomerComponent,
  IsomerPageLayoutType,
  IsomerSiteProps,
} from "@opengovsg/isomer-components"
import { renderComponent } from "@opengovsg/isomer-components"
import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it } from "vitest"

import type { AdjustmentRenderContext } from "../AdjustmentConfig"
import {
  INTENTIONALLY_NOT_ADJUSTABLE,
  resolveAdjustmentConfig as resolveAdjustmentConfigTyped,
} from "../adjustmentConfigRegistry"

// Fixtures are partial blocks, so cast once here.
const resolveAdjustmentConfig = (args: {
  block: unknown
  fieldName: string
  context?: AdjustmentRenderContext
}) =>
  resolveAdjustmentConfigTyped({
    ...args,
    block: args.block as IsomerComponent | undefined,
  })

// Mirrors AdjustmentPreview's PREVIEW_SITE_STUB.
const SITE_STUB = {
  assetsBaseUrl: "",
  siteMapArray: [],
} as unknown as IsomerSiteProps

const renderBlockHtml = (
  component: unknown,
  layout: IsomerPageLayoutType,
): string =>
  renderToStaticMarkup(
    renderComponent({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      component: component as any,
      layout,
      site: SITE_STUB,
      permalink: "",
      headingLevel: 1,
    }),
  )

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

  // Tier D components have image fields but must never offer Adjust. No
  // config means JsonFormsImageControl hides the entry point.
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
        // Array-nested field: both variants render the real edited card, not a
        // hand-built approximation — every other wired component gets a real preview too.
        expect(config?.skipRealComponentPreview).toBeFalsy()
        expect(config?.buildSingleItemPreviewBlock).toBeTypeOf("function")
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

    it("previews only the edited card, keeping maxColumns/variant and dropping section chrome", () => {
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
      const preview = withImages!.buildSingleItemPreviewBlock!(
        block as IsomerComponent,
        editedCard,
      ) as Record<string, unknown>
      expect(preview.cards).toEqual([editedCard])
      expect(preview.title).toBe("")
      expect(preview.subtitle).toBeUndefined()
      expect(preview.label).toBeUndefined()
      expect(preview.url).toBeUndefined()
      // Non-chrome fields (needed by the real renderer) pass through untouched.
      expect(preview.maxColumns).toBe("3")
      expect(preview.variant).toBe("cardsWithImages")
    })

    it("renders only the card being edited (not the first card) for real", () => {
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
        block as IsomerComponent,
        editedCard,
      )
      const html = renderBlockHtml(preview, "content")

      expect(html.match(/<img/g)).toHaveLength(1)
      expect(html).toContain("/edited.png")
      expect(html).toContain("Card B")
      expect(html).not.toContain("Card A")
      expect(html).not.toContain("Card C")
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
        block as IsomerComponent,
        editedCard,
      )
      const html = renderBlockHtml(preview, "content")

      expect(html).toContain("Real title")
      expect(html).toContain("bg-gradient-to-t")
    })

    it("previews exactly Mobile/Tablet/Desktop", () => {
      expect(withImages?.previewStates.map((s) => s.label)).toEqual([
        "Mobile",
        "Tablet",
        "Desktop",
      ])
    })
  })

  // Blockquote is a circle on most pages and a square on the homepage. The
  // preview renders at the page's own layout, so one config serves both: the
  // page layout must not change what resolves.
  describe("blockquote", () => {
    it("resolves the same fixed 1:1 config for every page layout", () => {
      // Arrange
      const configFor = (pageLayout?: "content" | "homepage") =>
        resolveAdjustmentConfig({
          block: { type: "blockquote" },
          fieldName: "imageSrc",
          context: { pageLayout },
        })

      // Act
      const configs = [configFor("content"), configFor("homepage"), configFor()]

      // Assert
      expect(configs[0]?.lockedRatios).toEqual([{ width: 1, height: 1 }])
      expect(configs[1]).toBe(configs[0])
      expect(configs[2]).toBe(configs[0])
    })
  })

  // Regression. Without maxRenderedHeightPx, computeLowResWarning checks
  // width only. A wide, short custom crop like 1300x300 then passes and blurs
  // in a tall cover frame. Fixed-ratio components are exempt because their
  // crop's width and height cannot diverge.
  describe("custom-crop cover-fit components configure a height threshold", () => {
    const cases: {
      label: string
      block: unknown
      fieldName: string
      expectedHeight: number
    }[] = [
      {
        label: "hero:gradient",
        block: { type: "hero", variant: "gradient" },
        fieldName: "backgroundUrl",
        expectedHeight: 500,
      },
      {
        label: "hero:block",
        block: { type: "hero", variant: "block" },
        fieldName: "backgroundUrl",
        expectedHeight: 500,
      },
      {
        label: "hero:largeImage",
        block: { type: "hero", variant: "largeImage" },
        fieldName: "backgroundUrl",
        expectedHeight: 640,
      },
      {
        label: "infopic",
        block: { type: "infopic" },
        fieldName: "imageSrc",
        expectedHeight: 400,
      },
      {
        label: "infocards:cardsWithImages",
        block: { type: "infocards", variant: "cardsWithImages" },
        fieldName: "imageUrl",
        expectedHeight: 427,
      },
      {
        label: "infocards:cardsWithFullImages",
        block: { type: "infocards", variant: "cardsWithFullImages" },
        fieldName: "imageUrl",
        expectedHeight: 640,
      },
    ]

    for (const { label, block, fieldName, expectedHeight } of cases) {
      it(`${label} sets maxRenderedHeightPx (${expectedHeight})`, () => {
        const config = resolveAdjustmentConfig({ block, fieldName })
        expect(config?.cropMode).toBe("custom")
        expect(config?.maxRenderedHeightPx).toBe(expectedHeight)
      })
    }
  })

  // A focal point only does something when the frame changes shape across
  // breakpoints. A fixed crop or a contain frame gives it nothing to anchor.
  describe("focal point is offered only for breakpoint-reshaping (responsive cover) frames", () => {
    it("responsive cover-fit components have focal enabled", () => {
      const responsiveBlocks = [
        {
          block: { type: "hero", variant: "gradient" },
          fieldName: "backgroundUrl",
        }, // 16:10 -> 2:1 -> 5:2
        {
          block: { type: "hero", variant: "block" },
          fieldName: "backgroundUrl",
        }, // stacked band -> side-by-side
        {
          block: { type: "hero", variant: "largeImage" },
          fieldName: "backgroundUrl",
        }, // square -> 2:1
        { block: { type: "infopic" }, fieldName: "imageSrc" }, // 5:4 -> 2:1 -> 3:1
      ]
      for (const { block, fieldName } of responsiveBlocks) {
        const config = resolveAdjustmentConfig({ block, fieldName })
        expect(config?.focalEnabled).toBe(true)
      }
    })

    it("fixed-crop (baked-once, same shape every breakpoint) components have focal disabled", () => {
      const fixedBlocks = [
        { block: { type: "contentpic" }, fieldName: "imageSrc" }, // aspect-[5/6] always
        { block: { type: "blockquote" }, fieldName: "imageSrc" }, // 1:1 always (circle/square mask only)
        {
          block: { type: "hero", variant: "floating" },
          fieldName: "backgroundUrl",
        }, // aspect-[3/2] always
      ]
      for (const { block, fieldName } of fixedBlocks) {
        const config = resolveAdjustmentConfig({ block, fieldName })
        expect(config?.cropMode).toBe("fixed")
        expect(config?.focalEnabled).toBe(false)
      }
    })

    it("InfoCards (Tier C) ties focal to imageFit, not just the responsive frame", () => {
      // The InfoCards frame genuinely reshapes across breakpoints/columns
      // (common.ts cardImageContainer), so focalEnabled is true -- the modal
      // hides it once its fit control is "contain" (ownsImageFitField), since
      // a letterboxed image has nothing for focal to anchor either.
      for (const variant of ["cardsWithImages", "cardsWithFullImages"]) {
        const config = resolveAdjustmentConfig({
          block: { type: "infocards", variant },
          fieldName: "imageUrl",
        })
        expect(config?.focalEnabled).toBe(true)
        expect(config?.ownsImageFitField).toBe(true)
      }
    })
  })

  // contentpic and blockquote hardcode their maxRenderedWidthPx as literal
  // copies of a Tailwind width class in packages/components — nothing binds
  // them, so a renderer change would silently desync the warning. Pin both
  // against the real rendered markup.
  describe("pinned maxRenderedWidthPx values", () => {
    it("contentpic's 200px matches the rendered sm:w-[200px] frame", () => {
      const config = resolveAdjustmentConfig({
        block: { type: "contentpic" },
        fieldName: "imageSrc",
      })
      expect(config?.maxRenderedWidthPx).toBe(200)

      const block = {
        type: "contentpic",
        imageSrc: "/a.png",
        imageAlt: "a",
        content: { type: "prose", content: [] },
      }
      const html = renderBlockHtml(block, "content")
      expect(html).toContain("sm:w-[200px]")
    })

    it("blockquote's 240px matches the rendered homepage w-60 frame", () => {
      const config = resolveAdjustmentConfig({
        block: { type: "blockquote" },
        fieldName: "imageSrc",
      })
      expect(config?.maxRenderedWidthPx).toBe(240)

      const block = {
        type: "blockquote",
        quote: "Quote",
        source: "Source",
        imageSrc: "/a.png",
        imageAlt: "a",
      }
      const html = renderBlockHtml(block, "homepage")
      expect(html).toContain("w-60")
    })
  })

  // Same for the frame shape. The bake applies the locked ratio to the saved
  // image, so if the frame drifts, object-cover re-crops every saved image.
  describe("pinned frame values", () => {
    it("contentpic's locked ratio matches the rendered aspect class", () => {
      // Arrange
      const config = resolveAdjustmentConfig({
        block: { type: "contentpic" },
        fieldName: "imageSrc",
      })
      const ratio = config?.lockedRatios?.[0]
      const block = {
        type: "contentpic",
        imageSrc: "/a.png",
        imageAlt: "a",
        content: { type: "prose", content: [] },
      }

      // Act
      const html = renderBlockHtml(block, "content")

      // Assert
      expect(ratio).toBeDefined()
      expect(html).toContain(`aspect-[${ratio?.width}/${ratio?.height}]`)
    })

    it("hero:gradient's height threshold matches the rendered lg:min-h band", () => {
      // Arrange
      const config = resolveAdjustmentConfig({
        block: { type: "hero", variant: "gradient" },
        fieldName: "backgroundUrl",
      })
      // No `actions` renders the default buttons layout, which sets the band.
      const block = {
        type: "hero",
        variant: "gradient",
        title: "Title",
        backgroundUrl: "/a.png",
      }

      // Act
      const html = renderBlockHtml(block, "homepage")

      // Assert
      expect(config?.maxRenderedHeightPx).toBeDefined()
      const rem = (config?.maxRenderedHeightPx ?? 0) / 16
      expect(html).toContain(`lg:min-h-[${rem}rem]`)
    })
  })
})
