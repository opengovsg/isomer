import { describe, expect, it } from "vitest"

import {
  formatDateRangeInputChange,
  getDateRangeInputGhostSuffix,
} from "../dateRangeFilterInputFormatting"

describe("getDateRangeInputGhostSuffix", () => {
  it("shows the remaining single-date mask while typing", () => {
    // Arrange / Act / Assert
    expect(getDateRangeInputGhostSuffix("")).toBe("DD/MM/YYYY")
    expect(getDateRangeInputGhostSuffix("09")).toBe("/MM/YYYY")
    expect(getDateRangeInputGhostSuffix("09/03")).toBe("/YYYY")
    expect(getDateRangeInputGhostSuffix("09/03/1996")).toBe("")
  })

  it("shows the remaining second-date mask while typing a range", () => {
    // Arrange / Act / Assert
    expect(getDateRangeInputGhostSuffix("09/03/1996 - 08")).toBe("/MM/YYYY")
    expect(getDateRangeInputGhostSuffix("09/03/1996 - 08/04/2026")).toBe("")
  })
})

describe("formatDateRangeInputChange", () => {
  it("formats pasted digits and keeps the cursor after the typed digits", () => {
    // Arrange / Act
    const result = formatDateRangeInputChange("09031996", 8)

    // Assert
    expect(result.formattedValue).toBe("09/03/1996")
    expect(result.selectionStart).toBe(10)
  })

  it("ignores non-digit characters in the raw value", () => {
    // Arrange / Act
    const result = formatDateRangeInputChange("09ab03/1996", 10)

    // Assert
    expect(result.formattedValue).toBe("09/03/1996")
  })

  it("inserts slashes and a range separator as digits are entered", () => {
    // Arrange / Act / Assert
    expect(
      formatDateRangeInputChange("0903199608042026", 16).formattedValue,
    ).toBe("09/03/1996 - 08/04/2026")
  })
})
