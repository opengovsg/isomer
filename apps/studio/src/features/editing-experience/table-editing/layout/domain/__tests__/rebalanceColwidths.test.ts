import { getEqualColumnWidths } from "@opengovsg/isomer-components"
import { describe, expect, it } from "vitest"

import { rebalanceColwidths } from "../rebalanceColwidths"

describe("rebalanceColwidths", () => {
  it("should return null when colwidths are unset", () => {
    // Arrange / Act / Assert
    expect(rebalanceColwidths(null, 3)).toBeNull()
  })

  it("should return null when colwidths length matches column count", () => {
    // Arrange / Act / Assert
    expect(rebalanceColwidths([50, 50], 2)).toBeNull()
  })

  it("should return equal widths when colwidths length differs from column count", () => {
    // Arrange / Act / Assert
    expect(rebalanceColwidths([50, 50], 3)).toEqual(getEqualColumnWidths(3))
  })
})
