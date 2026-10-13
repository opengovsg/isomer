import { describe, expect, it } from "vitest"

import { resolveAdjustmentConfig } from "./adjustmentConfigRegistry"

describe("resolveAdjustmentConfig", () => {
  it("returns undefined for components not yet wired", () => {
    expect(
      resolveAdjustmentConfig({ block: { type: "prose" }, fieldName: "image" }),
    ).toBeUndefined()
    expect(
      resolveAdjustmentConfig({ block: null, fieldName: "image" }),
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
})
