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
        block: { type: "hero", variant: "gradient" },
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
      ]
      for (const { block, fieldName } of responsiveBlocks) {
        const config = resolveAdjustmentConfig({ block, fieldName })
        expect(config?.focalEnabled).toBe(true)
      }
    })

    it("fixed-crop (baked-once, same shape every breakpoint) components have focal disabled", () => {
      const fixedBlocks = [
        { block: { type: "contentpic" }, fieldName: "imageSrc" }, // aspect-[5/6] always
      ]
      for (const { block, fieldName } of fixedBlocks) {
        const config = resolveAdjustmentConfig({ block, fieldName })
        expect(config?.cropMode).toBe("fixed")
        expect(config?.focalEnabled).toBe(false)
      }
    })
  })

  // contentpic hardcodes its maxRenderedWidthPx as a literal copy of a
  // Tailwind width class in packages/components — nothing binds them, so a
  // renderer change would silently desync the warning. Pin it against the
  // real rendered markup.
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
  })

  // Same drift risk for the frame shape itself: each value below is a hand
  // copy of a Tailwind class, so derive the class from the config and check
  // the real markup still carries it. A locked ratio that drifts from the
  // frame is the costly case: the crop is baked into the saved image, so the
  // component would re-crop every saved image with object-cover.
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
