import fs from "fs"
import path from "path"
import { describe, expect, it } from "vitest"

import type { AdjustmentConfig } from "./AdjustmentConfig"
import { resolveAdjustmentConfig } from "./adjustmentConfigRegistry"

// Root of the monorepo, resolved from this file's location so the test works
// regardless of the cwd it's invoked from.
const REPO_ROOT = path.resolve(__dirname, "../../../../../../../")

// Every config with focalEnabled: true, paired with (a) the real render
// file(s) that must actually apply its imageAdjustment at render time, and
// (b) a Storybook file that must demonstrate a non-default focal point.
// Neither pairing is enforced by the type system: a schema field existing
// (focalEnabled: true) says nothing about whether a render branch forwards
// it, or whether anyone ever wrote a story proving it moves the image. Both
// gaps have shipped for real -- HeroGradientQuickLinks silently dropped
// imageAdjustment despite sharing a schema with HeroGradientButtons (which
// wired it correctly), and the collection thumbnail had focalEnabled: true
// with no schema field, no render wiring, and no story at all. This test
// closes both gaps going forward: every focalEnabled config here must point
// at component file(s) containing the literal string "imageAdjustment", and
// a story file that demonstrates a focal point.
const FOCAL_WIRING_CONFIGS: {
  resolve: { block: unknown; context?: Parameters<typeof resolveAdjustmentConfig>[0]["context"] }
  // Every listed path must contain "imageAdjustment" -- unlike the scrim
  // guardrail's `.some(...)`, this is `.every(...)`: HeroGradient has two
  // render branches an editor can pick between (Buttons/QuickLinks), and
  // both must honour a focal point, not just one of them.
  componentPaths: string[]
  storyPaths: string[]
}[] = [
  {
    resolve: { block: { type: "hero", variant: "gradient" } },
    componentPaths: [
      "packages/components/src/templates/next/components/complex/Hero/HeroGradient/HeroGradientButtons.tsx",
      "packages/components/src/templates/next/components/complex/Hero/HeroGradient/HeroGradientQuickLinks/HeroGradientQuickLinks.tsx",
    ],
    storyPaths: [
      "packages/components/src/templates/next/components/complex/Hero/HeroGradient.adjustment.stories.tsx",
    ],
  },
  {
    resolve: { block: { type: "hero", variant: "block" } },
    componentPaths: [
      "packages/components/src/templates/next/components/complex/Hero/HeroBlock.tsx",
    ],
    storyPaths: [
      "packages/components/src/templates/next/components/complex/Hero/HeroBlock.adjustment.stories.tsx",
    ],
  },
  {
    resolve: { block: { type: "hero", variant: "largeImage" } },
    componentPaths: [
      "packages/components/src/templates/next/components/complex/Hero/HeroLargeImage/HeroLargeImage.tsx",
    ],
    storyPaths: [
      "packages/components/src/templates/next/components/complex/Hero/HeroLargeImage/HeroLargeImage.adjustment.stories.tsx",
    ],
  },
  {
    resolve: { block: { type: "infopic" } },
    componentPaths: [
      "packages/components/src/templates/next/components/complex/Infopic/components/BlockInfopic.tsx",
      "packages/components/src/templates/next/components/complex/Infopic/components/FullInfopic.tsx",
    ],
    storyPaths: [
      "packages/components/src/templates/next/components/complex/Infopic/Infopic.adjustment.stories.tsx",
    ],
  },
  {
    resolve: { block: { type: "infocards", variant: "cardsWithImages" } },
    componentPaths: [
      "packages/components/src/templates/next/components/complex/InfoCards/components/InfoCardImage.tsx",
    ],
    storyPaths: [
      "packages/components/src/templates/next/components/complex/InfoCards/InfoCards.stories.tsx",
    ],
  },
  {
    resolve: { block: { type: "infocards", variant: "cardsWithFullImages" } },
    componentPaths: [
      "packages/components/src/templates/next/components/complex/InfoCards/components/InfoCardWithFullImage.tsx",
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
      context: { isCollectionThumbnail: true },
    },
    componentPaths: [
      "packages/components/src/templates/next/components/internal/CollectionCard/CollectionCard.tsx",
      "packages/components/src/templates/next/components/internal/BlogCard/BlogCard.tsx",
    ],
    storyPaths: [
      "packages/components/src/templates/next/components/internal/CollectionCard/CollectionCard.stories.tsx",
      "packages/components/src/templates/next/components/internal/BlogCard/BlogCard.stories.tsx",
    ],
  },
]

// Every resolvable config in the registry, focal or not -- used only by the
// completeness check below, mirroring scrimClassNameGuardrail's ALL_BLOCKS.
const ALL_RESOLUTIONS: {
  block: unknown
  context?: Parameters<typeof resolveAdjustmentConfig>[0]["context"]
}[] = [
  { block: { type: "image" } },
  { block: { type: "imagegallery" } },
  { block: { type: "hero", variant: "gradient" } },
  { block: { type: "hero", variant: "largeImage" } },
  { block: { type: "hero", variant: "block" } },
  { block: { type: "hero", variant: "floating" } },
  { block: { type: "contentpic" } },
  { block: { type: "infopic" } },
  { block: { type: "blockquote" } },
  { block: { type: "infocards", variant: "cardsWithImages" } },
  { block: { type: "infocards", variant: "cardsWithFullImages" } },
  { block: undefined, context: { isCollectionThumbnail: true } },
]

describe("imageAdjustment wiring guardrail", () => {
  for (const { resolve, componentPaths, storyPaths } of FOCAL_WIRING_CONFIGS) {
    const config = resolveAdjustmentConfig({
      block: resolve.block,
      fieldName: "image",
      context: resolve.context,
    })

    it(`"${config?.componentType}" is applied in every render branch: ${componentPaths.join(", ")}`, () => {
      expect(config?.focalEnabled).toBe(true)
      const sources = componentPaths.map((componentPath) =>
        fs.readFileSync(path.join(REPO_ROOT, componentPath), "utf-8"),
      )
      expect(sources.every((source) => source.includes("imageAdjustment"))).toBe(
        true,
      )
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

  // Guards against a future registry entry setting focalEnabled: true without
  // also adding it to FOCAL_WIRING_CONFIGS above, which would let it skip
  // both checks entirely -- the exact gap that let the collection thumbnail
  // ship with no render wiring and no story.
  it("covers every focalEnabled config in the registry", () => {
    const focalComponentTypes = ALL_RESOLUTIONS.map(({ block, context }) =>
      resolveAdjustmentConfig({ block, fieldName: "image", context }),
    )
      .filter(
        (config): config is AdjustmentConfig => config?.focalEnabled === true,
      )
      .map((config) => config.componentType)
      .sort()

    const coveredComponentTypes = FOCAL_WIRING_CONFIGS.map(
      ({ resolve }) =>
        resolveAdjustmentConfig({
          block: resolve.block,
          fieldName: "image",
          context: resolve.context,
        })?.componentType,
    ).sort()

    expect(focalComponentTypes).toEqual(coveredComponentTypes)
  })
})
