import { describe, expect, it } from "vitest"

import { getFilterPanelDomId } from "../filterPanelDomId"

describe("getFilterPanelDomId", () => {
  it("replaces spaces in filter ids for valid HTML id tokens", () => {
    expect(getFilterPanelDomId("Assurance Level", "sidebar")).toBe(
      "filter-panel-Assurance-Level",
    )
    expect(getFilterPanelDomId("Assurance Level", "drawer")).toBe(
      "drawer-filter-panel-Assurance-Level",
    )
  })

  it("trims surrounding whitespace", () => {
    expect(getFilterPanelDomId("  Year  ", "sidebar")).toBe("filter-panel-Year")
  })
})
