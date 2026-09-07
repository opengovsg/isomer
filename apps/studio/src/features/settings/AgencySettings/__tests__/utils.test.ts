import { normalizeSiteEntity } from "../utils"

describe("normalizeSiteEntity", () => {
  it("removes blank strings alongside undefined values", () => {
    expect(
      normalizeSiteEntity({
        address: {
          addressCountry: "SG",
          streetAddress: "",
        },
        description: "   ",
      }),
    ).toEqual({ address: { addressCountry: "SG" } })
  })

  it("removes empty nested objects and undefined values", () => {
    expect(
      normalizeSiteEntity({
        address: {
          streetAddress: undefined,
        },
        contactPoint: {},
        type: undefined,
      }),
    ).toBeUndefined()
  })

  it("preserves configured values while removing empty nested objects", () => {
    expect(
      normalizeSiteEntity({
        address: {},
        contactPoint: {
          email: "hello@example.org",
        },
        description: "Community support",
        type: "NGO",
      }),
    ).toEqual({
      contactPoint: {
        email: "hello@example.org",
      },
      description: "Community support",
      type: "NGO",
    })
  })
})
