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
  componentPath: string
}[] = [
  {
    block: { type: "hero", variant: "gradient" },
    componentPath:
      "packages/components/src/templates/next/components/complex/Hero/HeroGradient.tsx",
  },
  {
    block: { type: "infocards", variant: "cardsWithFullImages" },
    componentPath:
      "packages/components/src/templates/next/components/complex/InfoCards/components/InfoCardWithFullImage.tsx",
  },
]

describe("scrim className guardrail", () => {
  for (const { block, componentPath } of SCRIM_CONFIGS) {
    const config = resolveAdjustmentConfig({
      block,
      fieldName: "image",
    })

    it(`"${config?.componentType}" scrim className appears in ${componentPath}`, () => {
      expect(config?.scrim).toBeDefined()
      const source = fs.readFileSync(
        path.join(REPO_ROOT, componentPath),
        "utf-8",
      )
      expect(source).toContain(config?.scrim?.className)
    })
  }

  // Guards against a future registry entry adding a `scrim` without also
  // adding it to SCRIM_CONFIGS above, which would let it skip this check
  // entirely.
  it("covers every scrim-bearing config in the registry", () => {
    const allBlocks = [
      { type: "image" },
      { type: "imagegallery" },
      { type: "hero", variant: "gradient" },
      { type: "hero", variant: "largeImage" },
      { type: "hero", variant: "block" },
      { type: "hero", variant: "floating" },
      { type: "contentpic" },
      { type: "infopic" },
      { type: "blockquote" },
      { type: "infocards", variant: "cardsWithImages" },
      { type: "infocards", variant: "cardsWithFullImages" },
    ]
    const scrimComponentTypes = allBlocks
      .map((block) => resolveAdjustmentConfig({ block, fieldName: "image" }))
      .filter((config): config is AdjustmentConfig => config?.scrim != null)
      .map((config) => config.componentType)
      .sort()

    const coveredComponentTypes = SCRIM_CONFIGS.map(
      ({ block }) =>
        resolveAdjustmentConfig({ block, fieldName: "image" })?.componentType,
    ).sort()

    expect(scrimComponentTypes).toEqual(coveredComponentTypes)
  })
})
