import { describe, expect, it } from "vitest"

import {
  buildCategoryOptions,
  buildLabelMap,
  hasCategoryOptions,
} from "../migrate-category-to-categoryid"

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeChild(
  resourceId: string,
  category: string | undefined,
  opts: { useDraft?: boolean } = {},
): {
  resourceId: string
  draftContent: Record<string, unknown> | null
  publishedContent: Record<string, unknown> | null
} {
  const content = category !== undefined ? { page: { category } } : { page: {} }

  if (opts.useDraft === false) {
    return { resourceId, draftContent: null, publishedContent: content }
  }
  return { resourceId, draftContent: content, publishedContent: null }
}

// ---------------------------------------------------------------------------
// hasCategoryOptions
// ---------------------------------------------------------------------------

describe("hasCategoryOptions", () => {
  it("returns false for null content", () => {
    expect(hasCategoryOptions(null)).toBe(false)
  })

  it("returns false when page key is absent", () => {
    expect(hasCategoryOptions({})).toBe(false)
  })

  it("returns false when categoryOptions is absent", () => {
    expect(hasCategoryOptions({ page: {} })).toBe(false)
  })

  it("returns false when categoryOptions is an empty array", () => {
    expect(hasCategoryOptions({ page: { categoryOptions: [] } })).toBe(false)
  })

  it("returns true when categoryOptions has at least one entry", () => {
    expect(
      hasCategoryOptions({
        page: { categoryOptions: [{ id: "abc", label: "Health" }] },
      }),
    ).toBe(true)
  })

  it("returns false when categoryOptions is not an array (e.g. a string)", () => {
    expect(hasCategoryOptions({ page: { categoryOptions: "Health" } })).toBe(
      false,
    )
  })
})

// ---------------------------------------------------------------------------
// buildLabelMap
// ---------------------------------------------------------------------------

describe("buildLabelMap", () => {
  it("returns an empty map for an empty child list", () => {
    expect(buildLabelMap([])).toEqual(new Map())
  })

  it("collects a single label correctly", () => {
    const result = buildLabelMap([makeChild("r1", "Healthcare")])
    expect(result.size).toBe(1)
    expect(result.get("Healthcare")).toEqual(["r1"])
  })

  it("deduplicates identical labels (case-sensitive)", () => {
    const children = [
      makeChild("r1", "Healthcare"),
      makeChild("r2", "Healthcare"),
      makeChild("r3", "Education"),
    ]
    const result = buildLabelMap(children)
    expect(result.size).toBe(2)
    expect(result.get("Healthcare")).toEqual(["r1", "r2"])
    expect(result.get("Education")).toEqual(["r3"])
  })

  it("treats labels differing only in case as distinct entries", () => {
    const children = [
      makeChild("r1", "Healthcare"),
      makeChild("r2", "healthcare"),
    ]
    const result = buildLabelMap(children)
    expect(result.size).toBe(2)
    expect(result.get("Healthcare")).toEqual(["r1"])
    expect(result.get("healthcare")).toEqual(["r2"])
  })

  it("trims leading and trailing whitespace from category strings", () => {
    const children = [
      makeChild("r1", "  Healthcare  "),
      makeChild("r2", "Healthcare"),
    ]
    const result = buildLabelMap(children)
    // Both should resolve to the same trimmed label
    expect(result.size).toBe(1)
    expect(result.get("Healthcare")).toEqual(["r1", "r2"])
  })

  it("skips items whose category is an empty string", () => {
    const result = buildLabelMap([makeChild("r1", "")])
    expect(result.size).toBe(0)
  })

  it("skips items whose category is whitespace-only", () => {
    const result = buildLabelMap([makeChild("r1", "   ")])
    expect(result.size).toBe(0)
  })

  it("skips items with no category field on page", () => {
    const children = [
      { resourceId: "r1", draftContent: { page: {} }, publishedContent: null },
    ]
    const result = buildLabelMap(children)
    expect(result.size).toBe(0)
  })

  it("skips items with non-string category values", () => {
    const children = [
      {
        resourceId: "r1",
        draftContent: { page: { category: 42 } },
        publishedContent: null,
      },
    ]
    const result = buildLabelMap(children)
    expect(result.size).toBe(0)
  })

  it("skips items with no content at all", () => {
    const children = [
      { resourceId: "r1", draftContent: null, publishedContent: null },
    ]
    const result = buildLabelMap(children)
    expect(result.size).toBe(0)
  })

  it("falls back to publishedContent when draftContent is null", () => {
    const child = makeChild("r1", "Healthcare", { useDraft: false })
    const result = buildLabelMap([child])
    expect(result.size).toBe(1)
    expect(result.get("Healthcare")).toEqual(["r1"])
  })

  it("prefers draftContent over publishedContent", () => {
    const child = {
      resourceId: "r1",
      draftContent: { page: { category: "Draft Label" } },
      publishedContent: { page: { category: "Published Label" } },
    }
    const result = buildLabelMap([child])
    expect(result.size).toBe(1)
    expect(result.get("Draft Label")).toEqual(["r1"])
    expect(result.has("Published Label")).toBe(false)
  })

  it("skips items with no page object on content", () => {
    const children = [
      { resourceId: "r1", draftContent: {}, publishedContent: null },
    ]
    const result = buildLabelMap(children)
    expect(result.size).toBe(0)
  })
})

// ---------------------------------------------------------------------------
// buildCategoryOptions
// ---------------------------------------------------------------------------

describe("buildCategoryOptions", () => {
  it("returns empty arrays for an empty label map", () => {
    const { categoryOptions, labelToId } = buildCategoryOptions(new Map())
    expect(categoryOptions).toEqual([])
    expect(labelToId.size).toBe(0)
  })

  it("creates one option per distinct label", () => {
    const labelMap = new Map([
      ["Healthcare", ["r1", "r2"]],
      ["Education", ["r3"]],
    ])
    const { categoryOptions, labelToId } = buildCategoryOptions(labelMap)
    expect(categoryOptions).toHaveLength(2)
    expect(labelToId.size).toBe(2)
  })

  it("assigns a valid UUID to each option", () => {
    const UUID_RE =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    const labelMap = new Map([["Healthcare", ["r1"]]])
    const { categoryOptions } = buildCategoryOptions(labelMap)
    expect(categoryOptions[0]?.id).toMatch(UUID_RE)
  })

  it("assigns unique UUIDs to each label", () => {
    const labelMap = new Map([
      ["Healthcare", ["r1"]],
      ["Education", ["r2"]],
      ["Transport", ["r3"]],
    ])
    const { categoryOptions } = buildCategoryOptions(labelMap)
    const ids = categoryOptions.map((o) => o.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it("labelToId maps each label to the same UUID used in categoryOptions", () => {
    const labelMap = new Map([
      ["Healthcare", ["r1"]],
      ["Education", ["r2"]],
    ])
    const { categoryOptions, labelToId } = buildCategoryOptions(labelMap)
    for (const option of categoryOptions) {
      expect(labelToId.get(option.label)).toBe(option.id)
    }
  })

  it("each categoryOptions entry has the correct label field", () => {
    const labelMap = new Map([
      ["Healthcare", ["r1"]],
      ["Education", ["r2"]],
    ])
    const { categoryOptions } = buildCategoryOptions(labelMap)
    const labels = categoryOptions.map((o) => o.label).sort()
    expect(labels).toEqual(["Education", "Healthcare"])
  })
})
