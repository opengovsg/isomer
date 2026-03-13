import { describe, expect, it } from "vitest"

import type { SitemapAnalysis } from "../analysis"
import { collectUsedItems, extractComponents } from "../analysis"

describe("collectUsedItems", () => {
  it("returns used layout and components for a known route", () => {
    const analysis: SitemapAnalysis = {
      "/": { layout: "homepage", components: ["hero", "prose"] },
      "/about": { layout: "content", components: ["prose", "image"] },
    }
    const { usedLayouts, usedComponents } = collectUsedItems(analysis, "/about")
    expect(Array.from(usedLayouts)).toEqual(["content"])
    expect(Array.from(usedComponents)).toEqual(["prose", "image"])
  })

  it("returns empty sets for unknown route", () => {
    const analysis: SitemapAnalysis = {
      "/": { layout: "homepage", components: [] },
    }
    const { usedLayouts, usedComponents } = collectUsedItems(
      analysis,
      "/missing",
    )
    expect(Array.from(usedLayouts)).toEqual([])
    expect(Array.from(usedComponents)).toEqual([])
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
