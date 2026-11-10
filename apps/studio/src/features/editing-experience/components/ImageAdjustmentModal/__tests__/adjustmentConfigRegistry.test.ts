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

// Fixtures are partial blocks carrying only the discriminators the registry
// reads, so cast once here rather than at every call site.
const resolveAdjustmentConfig = (args: {
  block: unknown
  fieldName: string
  context?: AdjustmentRenderContext
}) =>
  resolveAdjustmentConfigTyped({
    ...args,
    block: args.block as IsomerComponent | undefined,
  })

// Minimal site stub for rendering a single block in isolation — mirrors
// AdjustmentPreview's own PREVIEW_SITE_STUB.
const SITE_STUB = {
  assetsBaseUrl: "",
  siteMapArray: [],
} as unknown as IsomerSiteProps

// Renders a single block to static HTML for assertions against real markup.
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
      expect(
        config?.versions[0]?.previewStates.map((s) => s.viewportWidth),
      ).toEqual([375, 768, 1280])
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
        originalCard,
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
        cardB,
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
        card,
      )
      const html = renderBlockHtml(preview, "content")

      expect(html).toContain("Real title")
      expect(html).toContain("bg-gradient-to-t")
    })

    // The real card frame (InfoCards/common.ts cardImageContainer) is 3:2 at
    // every breakpoint on content pages EXCEPT lg+ with 3 columns, which
    // overrides it to 1:1 square. The homepage layout's own overrides are a
    // different page than the one being edited, so the preview covers content
    // pages only — one plain Mobile/Tablet/Desktop state each, following the
    // block's own maxColumns.
    describe("preview states follow the block's maxColumns (content pages only)", () => {
      const statesFor = (maxColumns?: string) =>
        resolveAdjustmentConfig({
          block: { type: "infocards", variant: "cardsWithImages", maxColumns },
          fieldName: "imageUrl",
        })?.versions[0]?.previewStates

      it("previews exactly Mobile/Tablet/Desktop, with plain labels", () => {
        const states = statesFor("3")
        expect(states?.map((s) => s.label)).toEqual([
          "Mobile",
          "Tablet",
          "Desktop",
        ])
        expect(states?.map((s) => s.layout)).toEqual([
          undefined,
          undefined,
          undefined,
        ])
      })

      it("3 columns (default): desktop frame is square", () => {
        const states = statesFor("3")
        expect(states?.map((s) => s.aspectRatio)).toEqual([
          { width: 3, height: 2 },
          { width: 3, height: 2 },
          { width: 1, height: 1 },
        ])
      })

      it("2 columns: every breakpoint stays 3:2", () => {
        const states = statesFor("2")
        expect(states?.map((s) => s.aspectRatio)).toEqual([
          { width: 3, height: 2 },
          { width: 3, height: 2 },
          { width: 3, height: 2 },
        ])
      })

      it("1 column: every breakpoint stays 3:2", () => {
        const states = statesFor("1")
        expect(states?.map((s) => s.aspectRatio)).toEqual([
          { width: 3, height: 2 },
          { width: 3, height: 2 },
          { width: 3, height: 2 },
        ])
      })

      it("defaults to 3 columns when maxColumns is unset", () => {
        expect(statesFor(undefined)).toEqual(statesFor("3"))
      })
    })
  })

  describe("blockquote (context-resolved circle/square versions)", () => {
    const configFor = (pageLayout?: IsomerPageLayoutType) =>
      resolveAdjustmentConfig({
        block: { type: "blockquote" },
        fieldName: "imageSrc",
        context: { pageLayout },
      })

    // Blockquote renders the same 1:1 image as a circle everywhere except the
    // homepage/notfound layouts, where it's a square — a real-component
    // preview regression here would mean an editor never sees the shape their
    // crop will actually take.
    it("resolves only the circle version for a content-page layout", () => {
      const config = configFor("content")
      expect(config?.versions).toEqual([
        expect.objectContaining({
          id: "circle",
          previewStates: [expect.objectContaining({ layout: "content" })],
        }),
      ])
    })

    it("resolves only the square version for the homepage layout", () => {
      const config = configFor("homepage")
      expect(config?.versions).toEqual([
        expect.objectContaining({
          id: "square",
          previewStates: [expect.objectContaining({ layout: "homepage" })],
        }),
      ])
    })

    it("resolves only the square version for the notfound layout", () => {
      const config = configFor("notfound")
      expect(config?.versions).toEqual([
        expect.objectContaining({
          id: "square",
          previewStates: [expect.objectContaining({ layout: "homepage" })],
        }),
      ])
    })

    // When the page layout isn't known (e.g. this control renders outside a
    // page editor), fall back to showing both candidate versions.
    it("resolves both versions when no page-layout context is given", () => {
      const config = configFor(undefined)
      expect(config?.versions.map((v) => v.id)).toEqual(["circle", "square"])
    })

    it("stacks each version's 1:1 state instead of showing it half-width", () => {
      expect(configFor("content")?.stackPreviews).toBe(true)
      expect(configFor(undefined)?.stackPreviews).toBe(true)
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
})
