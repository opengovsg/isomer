import { addRedirectSchema } from "../types"

const VALID = { source: "/old-page" }

describe("addRedirectSchema destination scheme normalisation", () => {
  it("should upgrade an http:// destination to https://", () => {
    // Arrange / Act
    const result = addRedirectSchema.parse({
      ...VALID,
      destination: "http://www.example.gov.sg/page",
    })

    // Assert
    expect(result.destination).toBe("https://www.example.gov.sg/page")
  })

  it("should leave an https:// destination untouched", () => {
    // Arrange / Act
    const result = addRedirectSchema.parse({
      ...VALID,
      destination: "https://www.example.gov.sg/page",
    })

    // Assert
    expect(result.destination).toBe("https://www.example.gov.sg/page")
  })

  it("should leave an internal path untouched (no scheme prepended)", () => {
    // Arrange / Act
    const result = addRedirectSchema.parse({
      ...VALID,
      destination: "/new-page",
    })

    // Assert
    expect(result.destination).toBe("/new-page")
  })

  it("should reject a schemeless host rather than inferring https://", () => {
    // Arrange / Act — a bare host is ambiguous against an internal path, so it
    // is not auto-prefixed; it fails validation as an invalid URL instead.
    const result = addRedirectSchema.safeParse({
      ...VALID,
      destination: "www.example.gov.sg",
    })

    // Assert
    expect(result.success).toBe(false)
  })
})
