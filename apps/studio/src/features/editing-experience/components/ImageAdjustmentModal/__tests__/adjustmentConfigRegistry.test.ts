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
        block: { type: "hero", variant: "gradient" },
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
        expectedHeight: 1440,
      },
      {
        label: "hero:block",
        block: { type: "hero", variant: "block" },
        fieldName: "backgroundUrl",
        expectedHeight: 860,
      },
      {
        label: "hero:largeImage",
        block: { type: "hero", variant: "largeImage" },
        fieldName: "backgroundUrl",
        expectedHeight: 1280,
      },
      {
        label: "infopic",
        block: { type: "infopic" },
        fieldName: "imageSrc",
        expectedHeight: 860,
      },
      {
        label: "infopic:full",
        block: { type: "infopic", variant: "full" },
        fieldName: "imageSrc",
        expectedHeight: 860,
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

  // Full and Block Infopic frames differ, so each variant gets its own config.
  // `variant` is optional, so a block without one must still resolve to Block.
  describe("infopic resolves a config per variant", () => {
    const cases: { label: string; block: unknown; expected: string }[] = [
      {
        label: "full",
        block: { type: "infopic", variant: "full" },
        expected: "infopic:full",
      },
      {
        label: "block",
        block: { type: "infopic", variant: "block" },
        expected: "infopic",
      },
      { label: "no variant", block: { type: "infopic" }, expected: "infopic" },
    ]
    for (const { label, block, expected } of cases) {
      it(`${label} resolves "${expected}"`, () => {
        const config = resolveAdjustmentConfig({ block, fieldName: "imageSrc" })
        expect(config?.componentType).toBe(expected)
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
        {
          block: { type: "infopic", variant: "full" },
          fieldName: "imageSrc",
        }, // 1:1 -> 2:1 -> 3:1
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
  })
})
