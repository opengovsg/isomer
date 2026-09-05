import { describe, expect, it } from "vitest"

import { parseInputText, valueToInputText } from "../dateRangeFilterInputText"

describe("valueToInputText", () => {
  it("returns an empty string when value is undefined", () => {
    // Arrange / Act
    const result = valueToInputText(undefined)

    // Assert
    expect(result).toBe("")
  })

  it("formats a single day without a range separator", () => {
    // Arrange / Act
    const result = valueToInputText({
      start: "2026-06-10",
      end: "2026-06-10",
    })

    // Assert
    expect(result).toBe("10/06/2026")
  })

  it("formats a range with a separator", () => {
    // Arrange / Act
    const result = valueToInputText({
      start: "2026-04-05",
      end: "2026-04-08",
    })

    // Assert
    expect(result).toBe("05/04/2026 - 08/04/2026")
  })
})

describe("parseInputText", () => {
  it("returns undefined for empty input", () => {
    // Arrange / Act / Assert
    expect(parseInputText("")).toBeUndefined()
    expect(parseInputText("   ")).toBeUndefined()
  })

  it("parses a valid single date", () => {
    // Arrange / Act
    const result = parseInputText("10/06/2026")

    // Assert
    expect(result).toEqual({
      start: "2026-06-10",
      end: "2026-06-10",
    })
  })

  it("parses a valid range in order", () => {
    // Arrange / Act
    const result = parseInputText("05/04/2026 - 08/04/2026")

    // Assert
    expect(result).toEqual({
      start: "2026-04-05",
      end: "2026-04-08",
    })
  })

  it("normalizes a reversed range", () => {
    // Arrange / Act
    const result = parseInputText("20/06/2026 - 10/06/2026")

    // Assert
    expect(result).toEqual({
      start: "2026-06-10",
      end: "2026-06-20",
    })
  })

  it("returns null for invalid calendar dates", () => {
    // Arrange / Act / Assert
    expect(parseInputText("31/02/2026")).toBeNull()
  })

  it("returns null for malformed input", () => {
    // Arrange / Act / Assert
    expect(parseInputText("10/06/2026 - 20/06/2026 - extra")).toBeNull()
    expect(parseInputText("not-a-date")).toBeNull()
  })
})
