import { normalizeSiteEntity } from "../utils"

describe("normalizeSiteEntity", () => {
  it("removes blank strings alongside undefined values", () => {
    expect(
      normalizeSiteEntity({
        description: "   ",
        address: {
          streetAddress: "",
          addressCountry: "SG",
        },
      }),
    ).toEqual({ address: { addressCountry: "SG" } })
  })

  it("removes empty nested objects and undefined values", () => {
    expect(
      normalizeSiteEntity({
        type: undefined,
        address: {
          streetAddress: undefined,
        },
        contactPoint: {},
      }),
    ).toBeUndefined()
  })

  it("preserves configured values while removing empty nested objects", () => {
    expect(
      normalizeSiteEntity({
        type: "NGO",
        description: "Community support",
        address: {},
        contactPoint: {
          email: "hello@example.org",
        },
      }),
    ).toEqual({
      type: "NGO",
      description: "Community support",
      contactPoint: {
        email: "hello@example.org",
      },
    })
  })
})
