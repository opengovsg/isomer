import { describe, expect, it } from "vitest"
import { serializeForInlineScript } from "~/serializeForInlineScript"

describe("serializeForInlineScript", () => {
  it("should serialize strings as valid JavaScript string literals", () => {
    // Arrange
    const value = "GTM-ABC123"
    const expected = '"GTM-ABC123"'

    // Act
    const actual = serializeForInlineScript(value)

    // Assert
    expect(actual).toBe(expected)
  })

  it("should escape characters that would break out of single-quoted interpolation", () => {
    // Arrange
    const value = "');alert(document.cookie);//"
    const expected = `"');alert(document.cookie);//"`

    // Act
    const actual = serializeForInlineScript(value)

    // Assert
    expect(actual).toBe(expected)
  })

  it("should escape angle brackets to prevent closing the script element", () => {
    // Arrange
    const value = "</script><script>alert(1)</script>"
    const expected = '"\\u003c/script>\\u003cscript>alert(1)\\u003c/script>"'

    // Act
    const actual = serializeForInlineScript(value)

    // Assert
    expect(actual).toBe(expected)
  })

  it("should serialize objects for JSON-LD script tags", () => {
    // Arrange
    const value = {
      "@context": "https://schema.org",
      "@type": "WebSite",
      name: "Isomer",
    }
    const expected =
      '{"@context":"https://schema.org","@type":"WebSite","name":"Isomer"}'

    // Act
    const actual = serializeForInlineScript(value)

    // Assert
    expect(actual).toBe(expected)
  })
})
