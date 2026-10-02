import { describe, expect, it } from "vitest"

import { getFilterPanelDomId } from "../filterPanelDomId"

describe("getFilterPanelDomId", () => {
  it("replaces spaces in filter ids for valid HTML id tokens", () => {
    // Arrange
    const filterId = "Assurance Level"

    // Act
    const sidebarPanelId = getFilterPanelDomId(filterId, "sidebar")
    const drawerPanelId = getFilterPanelDomId(filterId, "drawer")

    // Assert
    expect(sidebarPanelId).toBe("filter-panel-Assurance-Level")
    expect(drawerPanelId).toBe("drawer-filter-panel-Assurance-Level")
  })

  it("trims surrounding whitespace", () => {
    // Arrange
    const filterId = "  Year  "

    // Act
    const panelId = getFilterPanelDomId(filterId, "sidebar")

    // Assert
    expect(panelId).toBe("filter-panel-Year")
  })
})
