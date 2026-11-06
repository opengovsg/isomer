import fs from "fs"
import path from "path"
import { describe, expect, it } from "vitest"

import type { AdjustmentConfig } from "./AdjustmentConfig"
import { resolveAdjustmentConfig } from "./adjustmentConfigRegistry"

// Root of the monorepo, resolved from this file's location so the test works
// regardless of the cwd it's invoked from.
const REPO_ROOT = path.resolve(__dirname, "../../../../../../../")

// Every registry entry that renders a scrim, paired with the real component
// file whose className it's meant to mirror. A scrim config is a hand-copied
// approximation of a live Tailwind className (see adjustmentConfigRegistry.ts)
// — nothing enforces the two stay in sync, which is exactly how the
// "cards-overlay" bug happened: the config's scrim silently drifted from the
// component it was supposed to mimic. This test closes that gap by asserting
// the scrim's className is a verbatim substring of the component's source.
const SCRIM_CONFIGS: {
  block: unknown
  fieldName: string
  // HeroGradient.tsx just dispatches on actions.layout to one of two
  // sub-components, each with its own gradient; the registry's scrim mirrors
  // the default (Buttons) one, so match against either's source.
  componentPaths: string[]
}[] = [
  {
    block: { type: "hero", variant: "gradient" },
    fieldName: "backgroundUrl",
    componentPaths: [
      "packages/components/src/templates/next/components/complex/Hero/HeroGradient/HeroGradientButtons.tsx",
      "packages/components/src/templates/next/components/complex/Hero/HeroGradient/HeroGradientQuickLinks/HeroGradientQuickLinks.tsx",
    ],
  },
  {
    block: { type: "infocards", variant: "cardsWithFullImages" },
    fieldName: "imageUrl",
    componentPaths: [
      "packages/components/src/templates/next/components/complex/InfoCards/components/InfoCardWithFullImage.tsx",
    ],
  },
]

describe("scrim className guardrail", () => {
  for (const { block, fieldName, componentPaths } of SCRIM_CONFIGS) {
    const config = resolveAdjustmentConfig({
      block,
      fieldName,
    })

    it(`"${config?.componentType}" scrim className appears in one of ${componentPaths.join(", ")}`, () => {
      expect(config?.scrim).toBeDefined()
      const sources = componentPaths.map((componentPath) =>
        fs.readFileSync(path.join(REPO_ROOT, componentPath), "utf-8"),
      )
      expect(
        sources.some((source) =>
          source.includes(config?.scrim?.className ?? ""),
        ),
      ).toBe(true)
    })
  }

  // Guards against a future registry entry adding a `scrim` without also
  // adding it to SCRIM_CONFIGS above, which would let it skip this check
  // entirely.
  it("covers every scrim-bearing config in the registry", () => {
    const allBlocks = [
      { block: { type: "image" }, fieldName: "src" },
      { block: { type: "imagegallery" }, fieldName: "src" },
      { block: { type: "hero", variant: "gradient" }, fieldName: "backgroundUrl" },
      { block: { type: "hero", variant: "largeImage" }, fieldName: "backgroundUrl" },
      { block: { type: "hero", variant: "block" }, fieldName: "backgroundUrl" },
      { block: { type: "hero", variant: "floating" }, fieldName: "backgroundUrl" },
      { block: { type: "contentpic" }, fieldName: "imageSrc" },
      { block: { type: "infopic" }, fieldName: "imageSrc" },
      { block: { type: "blockquote" }, fieldName: "imageSrc" },
      { block: { type: "infocards", variant: "cardsWithImages" }, fieldName: "imageUrl" },
      { block: { type: "infocards", variant: "cardsWithFullImages" }, fieldName: "imageUrl" },
    ]
    const scrimComponentTypes = allBlocks
      .map(({ block, fieldName }) => resolveAdjustmentConfig({ block, fieldName }))
      .filter((config): config is AdjustmentConfig => config?.scrim != null)
      .map((config) => config.componentType)
      .sort()

    const coveredComponentTypes = SCRIM_CONFIGS.map(
      ({ block, fieldName }) =>
        resolveAdjustmentConfig({ block, fieldName })?.componentType,
    ).sort()

    expect(scrimComponentTypes).toEqual(coveredComponentTypes)
  })
})
