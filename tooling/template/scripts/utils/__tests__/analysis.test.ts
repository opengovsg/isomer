import { describe, expect, it } from "vitest"

import type { SiteSitemapAnalysis } from "../analysis"
import { collectSiteUsedItems, extractComponents } from "../analysis"

describe("collectSiteUsedItems", () => {
  it("builds sets from site analysis and always includes childrenpages", () => {
    const analysis: SiteSitemapAnalysis = {
      layouts: ["content", "homepage"],
      components: ["hero", "prose"],
    }
    const { usedLayouts, usedComponents } = collectSiteUsedItems(analysis)
    expect(Array.from(usedLayouts).sort()).toEqual(["content", "homepage"])
    expect(Array.from(usedComponents).sort()).toEqual([
      "childrenpages",
      "hero",
      "prose",
    ])
  })

  it("adds childrenpages even when absent from analysis components", () => {
    const analysis: SiteSitemapAnalysis = {
      layouts: ["homepage"],
      components: [],
    }
    const { usedComponents } = collectSiteUsedItems(analysis)
    expect(usedComponents.has("childrenpages")).toBe(true)
  })
})

describe("extractComponents", () => {
  it("returns unique component types from content array", () => {
    const content = [
      { type: "hero" },
      { type: "prose" },
      { type: "hero" },
      { type: "image" },
    ]
    expect(extractComponents(content)).toEqual(["hero", "prose", "image"])
  })

  it("returns empty array for non-array input", () => {
    expect(extractComponents(null)).toEqual([])
    expect(extractComponents(undefined)).toEqual([])
    expect(extractComponents({})).toEqual([])
  })

  it("skips items without type", () => {
    const content = [{ type: "hero" }, { title: "no type" }, { type: "prose" }]
    expect(extractComponents(content)).toEqual(["hero", "prose"])
  })
})
