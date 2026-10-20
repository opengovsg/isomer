import type { ImageAdjustment } from "@opengovsg/isomer-components"
import { describe, expect, it } from "vitest"

import {
  customiseTier,
  getTierCropFocal,
  isTierCustomised,
  mapAllTiersCropFocal,
  uncustomiseTier,
  updateTierCropFocal,
} from "./adjustmentDraft"

const baseCrop = { x: 0, y: 0, width: 1, height: 1 }
const baseFocal = { x: 0.5, y: 0.5 }

const draft = (): ImageAdjustment => ({
  crop: baseCrop,
  focal: baseFocal,
  rotate: 0,
  flipH: false,
  flipV: false,
  originalKey: "site/1/original.jpg",
})

const lgTier = {
  breakpoint: "lg" as const,
  crop: { x: 0.1, y: 0.1, width: 0.5, height: 0.5 },
  focal: { x: 0.3, y: 0.4 },
  src: "/site/1/lg.webp",
}

describe("per-tier draft helpers", () => {
  describe("getTierCropFocal", () => {
    it("returns base crop/focal for 'base'", () => {
      expect(getTierCropFocal(draft(), "base")).toEqual({
        crop: baseCrop,
        focal: baseFocal,
      })
    })

    it("returns undefined for an uncustomised tier, the entry for a customised one", () => {
      expect(getTierCropFocal(draft(), "lg")).toBeUndefined()
      expect(getTierCropFocal({ ...draft(), tiers: [lgTier] }, "lg")).toEqual(
        lgTier,
      )
    })

    it("returns undefined when there is no draft", () => {
      expect(getTierCropFocal(undefined, "base")).toBeUndefined()
    })
  })

  describe("isTierCustomised", () => {
    it("treats base as customised whenever a draft exists", () => {
      expect(isTierCustomised(draft(), "base")).toBe(true)
      expect(isTierCustomised(undefined, "base")).toBe(false)
    })

    it("tracks breakpoint tiers by presence of an entry", () => {
      expect(isTierCustomised(draft(), "lg")).toBe(false)
      expect(isTierCustomised({ ...draft(), tiers: [lgTier] }, "lg")).toBe(true)
    })
  })

  describe("customiseTier", () => {
    it("seeds a tier from base crop/focal and is idempotent", () => {
      const once = customiseTier(draft(), "lg")
      expect(once.tiers).toEqual([
        { breakpoint: "lg", crop: baseCrop, focal: baseFocal, src: "" },
      ])
      expect(customiseTier(once, "lg")).toBe(once)
    })
  })

  describe("updateTierCropFocal", () => {
    it("writes to base top-level fields", () => {
      const next = updateTierCropFocal(draft(), "base", {
        focal: { x: 0.2, y: 0.2 },
      })
      expect(next.focal).toEqual({ x: 0.2, y: 0.2 })
      expect(next.crop).toEqual(baseCrop)
    })

    it("updates an existing tier entry without touching others", () => {
      const start = { ...draft(), tiers: [lgTier] }
      const next = updateTierCropFocal(start, "lg", {
        crop: { x: 0, y: 0, width: 0.3, height: 0.3 },
      })
      expect(next.tiers?.[0]).toEqual({
        ...lgTier,
        crop: { x: 0, y: 0, width: 0.3, height: 0.3 },
      })
    })
  })

  describe("uncustomiseTier", () => {
    it("drops the entry and clears tiers when it was the last", () => {
      const next = uncustomiseTier({ ...draft(), tiers: [lgTier] }, "lg")
      expect(next.tiers).toBeUndefined()
    })

    it("keeps the other tiers", () => {
      const md = { ...lgTier, breakpoint: "md" as const }
      const next = uncustomiseTier({ ...draft(), tiers: [lgTier, md] }, "lg")
      expect(next.tiers).toEqual([md])
    })
  })

  describe("mapAllTiersCropFocal", () => {
    it("applies the transform to base and every tier", () => {
      const start = { ...draft(), tiers: [lgTier] }
      const next = mapAllTiersCropFocal(start, ({ focal }) => ({
        crop: { x: 0, y: 0, width: 1, height: 1 },
        focal: { x: 1 - focal.x, y: focal.y },
      }))
      expect(next.focal).toEqual({ x: 0.5, y: 0.5 })
      expect(next.tiers?.[0]?.focal).toEqual({ x: 0.7, y: 0.4 })
    })
  })
})
