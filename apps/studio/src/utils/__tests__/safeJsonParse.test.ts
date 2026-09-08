import { describe, expect, it } from "vitest"

import { safeJsonParse } from "../safeJsonParse"

describe("safeJsonParse", () => {
  it("parses valid JSON", () => {
    // Arrange / Act
    const result = safeJsonParse(`{"siteName":"Isomer"}`)

    // Assert
    expect(result).toEqual({ siteName: "Isomer" })
  })

  it("returns the original string when JSON is malformed", () => {
    // Arrange
    const malformed = "{broken"

    // Act
    const result = safeJsonParse(malformed)

    // Assert
    expect(result).toBe(malformed)
  })
})
