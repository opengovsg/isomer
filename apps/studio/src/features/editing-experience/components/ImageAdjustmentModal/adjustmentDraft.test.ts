import type { ImageAdjustment } from "@opengovsg/isomer-components"
import { describe, expect, it } from "vitest"

import {
  customiseTier,
  deviceBucket,
  getTierCropFocal,
  governingTierForWidth,
  mapAllTiersCropFocal,
  tierDeviceLabel,
  tierOrder,
  tierRangeLabel,
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

    it("a crop change updates the tier and clears its src (marks it for re-bake)", () => {
      const start = { ...draft(), tiers: [lgTier] }
      const next = updateTierCropFocal(start, "lg", {
        crop: { x: 0, y: 0, width: 0.3, height: 0.3 },
      })
      expect(next.tiers?.[0]).toEqual({
        ...lgTier,
        crop: { x: 0, y: 0, width: 0.3, height: 0.3 },
        src: "",
      })
    })

    it("a focal-only change keeps the tier's src (focal isn't baked)", () => {
      const start = { ...draft(), tiers: [lgTier] }
      const next = updateTierCropFocal(start, "lg", {
        focal: { x: 0.9, y: 0.1 },
      })
      expect(next.tiers?.[0]).toEqual({
        ...lgTier,
        focal: { x: 0.9, y: 0.1 },
      })
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
      // A transform changes every tier's crop, so each src is cleared for re-bake.
      expect(next.tiers?.[0]?.src).toBe("")
    })
  })
})

describe("tier labels", () => {
  describe("tierOrder", () => {
    it("puts base first, then configured breakpoints ascending", () => {
      expect(tierOrder(["lg", "sm"])).toEqual(["base", "sm", "lg"])
    })
    it("is just base when there are no tiers", () => {
      expect(tierOrder(undefined)).toEqual(["base"])
      expect(tierOrder([])).toEqual(["base"])
    })
  })

  describe("tierRangeLabel", () => {
    it("labels base by the span up to the first tier", () => {
      expect(tierRangeLabel("base", ["lg"])).toBe("Default · up to 1024px")
      expect(tierRangeLabel("base", [])).toBe("Default")
    })
    it("labels a middle tier as a closed range and the last as open-ended", () => {
      // sm=640, md=768, lg=1024
      expect(tierRangeLabel("sm", ["sm", "lg"])).toBe("640–1023px")
      expect(tierRangeLabel("lg", ["sm", "lg"])).toBe("1024px and up")
    })
  })

  describe("governingTierForWidth", () => {
    it("maps a width to the largest breakpoint it meets, else base", () => {
      // sm=640, lg=1024
      expect(governingTierForWidth(375, ["sm", "lg"])).toBe("base")
      expect(governingTierForWidth(768, ["sm", "lg"])).toBe("sm")
      expect(governingTierForWidth(1280, ["sm", "lg"])).toBe("lg")
      expect(governingTierForWidth(1024, ["sm", "lg"])).toBe("lg")
    })
    it("is always base when there are no tiers", () => {
      expect(governingTierForWidth(1920, [])).toBe("base")
    })
  })
})

describe("device-type tier labels", () => {
  describe("deviceBucket", () => {
    it("buckets widths by the md/lg breakpoints", () => {
      // md=768, lg=1024
      expect(deviceBucket(375)).toBe("Mobile")
      expect(deviceBucket(767)).toBe("Mobile")
      expect(deviceBucket(768)).toBe("Tablet")
      expect(deviceBucket(1023)).toBe("Tablet")
      expect(deviceBucket(1024)).toBe("Desktop")
      expect(deviceBucket(1920)).toBe("Desktop")
    })
  })

  describe("tierDeviceLabel", () => {
    const previewStates = [
      { viewportWidth: 375 }, // mobile
      { viewportWidth: 768 }, // tablet
      { viewportWidth: 1280 }, // desktop
    ]

    it("labels each tier by the single device bucket it governs", () => {
      // tiers sm(640)/lg(1024): base <640, sm 640–1023, lg ≥1024
      expect(tierDeviceLabel("base", ["sm", "lg"], previewStates)).toBe(
        "Mobile",
      )
      expect(tierDeviceLabel("sm", ["sm", "lg"], previewStates)).toBe("Tablet")
      expect(tierDeviceLabel("lg", ["sm", "lg"], previewStates)).toBe("Desktop")
    })

    it("joins multiple covered buckets with ' and '", () => {
      // tiers lg(1024) only: base governs mobile(375) AND tablet(768)
      expect(tierDeviceLabel("base", ["lg"], previewStates)).toBe(
        "Mobile and Tablet",
      )
      expect(tierDeviceLabel("lg", ["lg"], previewStates)).toBe("Desktop")
    })

    it("defaults a width-less previewState to the lg fallback (Desktop)", () => {
      expect(tierDeviceLabel("lg", ["lg"], [{}])).toBe("Desktop")
    })

    it("falls back to the px-range label when a tier governs nothing", () => {
      // Only a desktop previewState exists, governed by lg — base covers none.
      expect(tierDeviceLabel("base", ["lg"], [{ viewportWidth: 1280 }])).toBe(
        "Default · up to 1024px",
      )
    })
  })
})
