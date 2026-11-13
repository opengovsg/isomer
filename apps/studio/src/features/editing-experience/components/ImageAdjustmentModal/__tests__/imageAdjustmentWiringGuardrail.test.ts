import type { IsomerComponent } from "@opengovsg/isomer-components"
import fs from "fs"
import path from "path"
import { describe, expect, it } from "vitest"

import type { AdjustmentRenderContext } from "../AdjustmentConfig"
import {
  CONFIGS,
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

const REPO_ROOT = path.resolve(__dirname, "../../../../../../../../")

// Each focalEnabled config, with the render files that must apply its
// adjustment and a story that shows a focal point. Types can't check either.
// Both have shipped broken. HeroGradientQuickLinks dropped the adjustment,
// and the collection thumbnail had no render wiring and no story.
const FOCAL_WIRING_CONFIGS: {
  resolve: {
    block: unknown
    fieldName: string
    context?: AdjustmentRenderContext
  }
  // Every path must pass, since an editor can pick any render branch.
  componentPaths: string[]
  // Defaults to `${imageField}ImageAdjustment`.
  siblingKey?: string
  storyPaths: string[]
}[] = [
  {
    resolve: {
      block: { type: "hero", variant: "gradient" },
      fieldName: "backgroundUrl",
    },
    componentPaths: [
      "packages/components/src/templates/next/components/complex/Hero/HeroGradient/HeroGradientButtons.tsx",
      "packages/components/src/templates/next/components/complex/Hero/HeroGradient/HeroGradientQuickLinks/HeroGradientQuickLinks.tsx",
    ],
    storyPaths: [
      "packages/components/src/templates/next/components/complex/Hero/HeroGradient.adjustment.stories.tsx",
    ],
  },
  {
    resolve: {
      block: { type: "hero", variant: "block" },
      fieldName: "backgroundUrl",
    },
    componentPaths: [
      "packages/components/src/templates/next/components/complex/Hero/HeroBlock.tsx",
    ],
    storyPaths: [
      "packages/components/src/templates/next/components/complex/Hero/HeroBlock.adjustment.stories.tsx",
    ],
  },
  {
    resolve: {
      block: { type: "hero", variant: "largeImage" },
      fieldName: "backgroundUrl",
    },
    componentPaths: [
      "packages/components/src/templates/next/components/complex/Hero/HeroLargeImage/HeroLargeImage.tsx",
      "packages/components/src/templates/next/components/complex/Hero/HeroLargeImage/ImageContainer.tsx",
    ],
    storyPaths: [
      "packages/components/src/templates/next/components/complex/Hero/HeroLargeImage/HeroLargeImage.adjustment.stories.tsx",
    ],
  },
  {
    resolve: { block: { type: "infopic" }, fieldName: "imageSrc" },
    componentPaths: [
      "packages/components/src/templates/next/components/complex/Infopic/components/BlockInfopic.tsx",
    ],
    storyPaths: [
      "packages/components/src/templates/next/components/complex/Infopic/Infopic.adjustment.stories.tsx",
    ],
  },
  {
    resolve: {
      block: { type: "infopic", variant: "full" },
      fieldName: "imageSrc",
    },
    componentPaths: [
      "packages/components/src/templates/next/components/complex/Infopic/components/FullInfopic.tsx",
    ],
    storyPaths: [
      "packages/components/src/templates/next/components/complex/Infopic/Infopic.adjustment.stories.tsx",
    ],
  },
  {
    resolve: {
      block: { type: "infocards", variant: "cardsWithImages" },
      fieldName: "imageUrl",
    },
    componentPaths: [
      "packages/components/src/templates/next/components/complex/InfoCards/components/InfoCardImage.tsx",
    ],
    storyPaths: [
      "packages/components/src/templates/next/components/complex/InfoCards/InfoCards.stories.tsx",
    ],
  },
  {
    resolve: {
      block: { type: "infocards", variant: "cardsWithFullImages" },
      fieldName: "imageUrl",
    },
    componentPaths: [
      "packages/components/src/templates/next/components/complex/InfoCards/components/InfoCardWithFullImage.tsx",
      "packages/components/src/templates/next/components/complex/InfoCards/components/InfoCardImage.tsx",
    ],
    storyPaths: [
      "packages/components/src/templates/next/components/complex/InfoCards/InfoCards.stories.tsx",
    ],
  },
  {
    // Not block-type-keyed -- see resolveAdjustmentConfig's isCollectionThumbnail
    // branch, which short-circuits before the block `type` switch.
    resolve: {
      block: undefined,
      fieldName: "image",
      context: { isCollectionThumbnail: true },
    },
    siblingKey: "imageAdjustment",
    componentPaths: [
      "packages/components/src/templates/next/components/internal/CollectionCard/CollectionCard.tsx",
      "packages/components/src/templates/next/components/internal/BlogCard/BlogCard.tsx",
      "packages/components/src/templates/next/components/complex/CollectionBlock/CollectionBlock.tsx",
    ],
    storyPaths: [
      "packages/components/src/templates/next/components/internal/CollectionCard/CollectionCard.stories.tsx",
      "packages/components/src/templates/next/components/internal/BlogCard/BlogCard.stories.tsx",
      "packages/components/src/templates/next/components/complex/CollectionBlock/CollectionBlock.stories.tsx",
    ],
  },
]

describe("imageAdjustment wiring guardrail", () => {
  for (const {
    resolve,
    componentPaths,
    siblingKey,
    storyPaths,
  } of FOCAL_WIRING_CONFIGS) {
    const config = resolveAdjustmentConfig({
      block: resolve.block,
      fieldName: resolve.fieldName,
      context: resolve.context,
    })

    it(`"${config?.componentType}" is applied in every render branch: ${componentPaths.join(", ")}`, () => {
      expect(config?.focalEnabled).toBe(true)
      const sources = componentPaths.map((componentPath) =>
        fs.readFileSync(path.join(REPO_ROOT, componentPath), "utf-8"),
      )
      expect(
        sources.every((source) => source.includes("imageAdjustment")),
      ).toBe(true)
      // The renderer must read the key the schema emits, then apply it.
      const key = siblingKey ?? `${config?.imageField}ImageAdjustment`
      expect(sources.some((source) => source.includes(key))).toBe(true)
      expect(
        sources.some(
          (source) =>
            source.includes("ImageClientWithAdjustment") ||
            source.includes("getFocalObjectPosition"),
        ),
      ).toBe(true)
      // Every file needs the key or an apply marker. A parent and child
      // pair may hold one each.
      for (const source of sources) {
        expect(
          source.includes(key) ||
            source.includes("ImageClientWithAdjustment") ||
            source.includes("getFocalObjectPosition"),
        ).toBe(true)
      }
    })

    it(`"${config?.componentType}" has a focal-point story: ${storyPaths.join(", ")}`, () => {
      const sources = storyPaths.map((storyPath) =>
        fs.readFileSync(path.join(REPO_ROOT, storyPath), "utf-8"),
      )
      expect(sources.some((source) => source.includes("imageAdjustment"))).toBe(
        true,
      )
    })
  }

  // A focalEnabled config missing from FOCAL_WIRING_CONFIGS would skip both
  // checks above.
  it("covers every focalEnabled config in the registry", () => {
    const focalComponentTypes = CONFIGS.filter(
      (config) => config.focalEnabled,
    ).map((config) => config.componentType)

    // CONFIGS can't list configs resolved from a block or context branch,
    // so FOCAL_WIRING_CONFIGS may have extra rows.
    const coveredComponentTypes = FOCAL_WIRING_CONFIGS.map(
      ({ resolve }) =>
        resolveAdjustmentConfig({
          block: resolve.block,
          fieldName: resolve.fieldName,
          context: resolve.context,
        })?.componentType,
    )

    expect(coveredComponentTypes).toEqual(
      expect.arrayContaining(focalComponentTypes),
    )
  })
})
