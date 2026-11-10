import type { IsomerComponent } from "@opengovsg/isomer-components"
import fs from "fs"
import path from "path"
import { describe, expect, it } from "vitest"

import type { AdjustmentRenderContext } from "../AdjustmentConfig"
import {
  CONFIGS,
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

// Root of the monorepo, resolved from this file's location so the test works
// regardless of the cwd it's invoked from.
const REPO_ROOT = path.resolve(__dirname, "../../../../../../../../")

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
  resolve: {
    block: unknown
    fieldName: string
    context?: AdjustmentRenderContext
  }
  // Every listed path must contain "imageAdjustment" -- this is
  // `.every(...)`, not `.some(...)`: HeroGradient has two
  // render branches an editor can pick between (Buttons/QuickLinks), and
  // both must honour a focal point, not just one of them.
  componentPaths: string[]
  // Sibling key the schema emits; defaults to `${imageField}ImageAdjustment`.
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
    ],
    storyPaths: [
      "packages/components/src/templates/next/components/complex/Hero/HeroLargeImage/HeroLargeImage.adjustment.stories.tsx",
    ],
  },
  {
    resolve: { block: { type: "infopic" }, fieldName: "imageSrc" },
    componentPaths: [
      "packages/components/src/templates/next/components/complex/Infopic/components/BlockInfopic.tsx",
      "packages/components/src/templates/next/components/complex/Infopic/components/FullInfopic.tsx",
    ],
    storyPaths: [
      "packages/components/src/templates/next/components/complex/Infopic/Infopic.adjustment.stories.tsx",
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
      // The renderer must read the key the schema emits, and actually apply it.
      const key = siblingKey ?? `${config?.imageField}ImageAdjustment`
      expect(sources.some((source) => source.includes(key))).toBe(true)
      expect(
        sources.some(
          (source) =>
            source.includes("ImageClientWithAdjustment") ||
            source.includes("getFocalObjectPosition"),
        ),
      ).toBe(true)
      // Alternative render branches must each take part: every file needs the
      // key or an application marker (parent -> child chains hold only one).
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

  // Guards against a future registry entry setting focalEnabled: true without
  // also adding it to FOCAL_WIRING_CONFIGS above, which would let it skip
  // both checks entirely -- the exact gap that let the collection thumbnail
  // ship with no render wiring and no story.
  it("covers every focalEnabled config in the registry", () => {
    const focalComponentTypes = CONFIGS.filter(
      (config) => config.focalEnabled,
    ).map((config) => config.componentType)

    // Rows may exceed the static registry: configs resolved by an explicit
    // block/context branch can't be enumerated from CONFIGS and keep a row here.
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
