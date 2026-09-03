import { describe, expect, it } from "vitest"

import {
  cursorPositionAfterDigitIndex,
  extractDateDigits,
  formatDateRangeInputChange,
  formatDateRangeInputDigits,
  getDateRangeInputGhostSuffix,
} from "../dateRangeFilterInputFormatting"

describe("extractDateDigits", () => {
  it("keeps only numeric characters", () => {
    // Arrange / Act / Assert
    expect(extractDateDigits("09/03/1996 - 08/04/2026")).toBe(
      "0903199608042026",
    )
    expect(extractDateDigits("ab09!03@")).toBe("0903")
  })
})

describe("formatDateRangeInputDigits", () => {
  it("inserts slashes as digits are entered", () => {
    // Arrange / Act / Assert
    expect(formatDateRangeInputDigits("09031996")).toBe("09/03/1996")
    expect(formatDateRangeInputDigits("09")).toBe("09")
    expect(formatDateRangeInputDigits("0903")).toBe("09/03")
  })

  it("adds a range separator after the first date is complete", () => {
    // Arrange / Act / Assert
    expect(formatDateRangeInputDigits("0903199608")).toBe("09/03/1996 - 08")
    expect(formatDateRangeInputDigits("0903199608042026")).toBe(
      "09/03/1996 - 08/04/2026",
    )
  })

  it("caps input at sixteen digits", () => {
    // Arrange / Act
    const result = formatDateRangeInputDigits("090319960804202612345678")

    // Assert
    expect(result).toBe("09/03/1996 - 08/04/2026")
  })
})

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
})

describe("cursorPositionAfterDigitIndex", () => {
  it("places the cursor after the requested number of digits", () => {
    // Arrange
    const formatted = "09/03/1996"

    // Act / Assert
    expect(cursorPositionAfterDigitIndex(formatted, 2)).toBe(2)
    expect(cursorPositionAfterDigitIndex(formatted, 4)).toBe(5)
    expect(cursorPositionAfterDigitIndex(formatted, 8)).toBe(10)
  })
})
