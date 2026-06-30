import { addRedirectSchema } from "../types"

const VALID = { source: "/old-page" }

describe("addRedirectSchema destination scheme normalisation", () => {
  it("should prefix https:// to a leading www. host", () => {
    // Arrange / Act
    const result = addRedirectSchema.parse({
      ...VALID,
      destination: "www.example.gov.sg/page",
    })

    // Assert
    expect(result.destination).toBe("https://www.example.gov.sg/page")
  })

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

  it("should reject a schemeless host without a www. prefix", () => {
    // Arrange / Act — "google.com" is ambiguous against an internal path, so it
    // is not auto-prefixed (unlike "www."); it fails validation instead.
    const result = addRedirectSchema.safeParse({
      ...VALID,
      destination: "google.com",
    })

    // Assert
    expect(result.success).toBe(false)
  })
})
