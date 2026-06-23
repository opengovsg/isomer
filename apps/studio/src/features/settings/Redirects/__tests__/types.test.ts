import { addRedirectSchema } from "../types"

const VALID = { source: "/old-page" }

describe("addRedirectSchema destination scheme normalisation", () => {
  it("should prepend https:// to a bare host", () => {
    // Arrange / Act
    const result = addRedirectSchema.parse({
      ...VALID,
      destination: "www.example.gov.sg",
    })

    // Assert
    expect(result.destination).toBe("https://www.example.gov.sg")
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

  it("should trim surrounding whitespace before prepending the scheme", () => {
    // Arrange / Act
    const result = addRedirectSchema.parse({
      ...VALID,
      destination: "  www.example.gov.sg  ",
    })

    // Assert
    expect(result.destination).toBe("https://www.example.gov.sg")
  })

  it("should still reject a bare single-label host once https:// is prepended", () => {
    // Arrange / Act — "localhost" has no dot, so the prepended URL isn't a valid
    // public destination; the scheme fix-up doesn't loosen that check.
    const result = addRedirectSchema.safeParse({
      ...VALID,
      destination: "localhost",
    })

    // Assert
    expect(result.success).toBe(false)
  })
})
