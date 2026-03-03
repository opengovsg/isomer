import { LINK_TYPES } from "../constants"
import { getLinkHrefType } from "../utils"

describe("getLinkHrefType", () => {
  it("returns Page for empty or undefined href", () => {
    expect(getLinkHrefType(undefined)).toBe(LINK_TYPES.Page)
    expect(getLinkHrefType("")).toBe(LINK_TYPES.Page)
  })

  it("returns Email for mailto links", () => {
    expect(getLinkHrefType("mailto:user@example.com")).toBe(LINK_TYPES.Email)
  })

  it("returns File for internal asset path format /(siteId)/(uuid)/(filename)", () => {
    expect(
      getLinkHrefType("/123/550e8400-e29b-41d4-a716-446655440000/doc.pdf"),
    ).toBe(LINK_TYPES.File)
  })

  it("returns External for full URLs even when they contain the file path pattern (no UI misrepresentation)", () => {
    // Regression: external URL with /(digits)/(uuid)/ must not be classified as File
    // so the UI does not show only the filename and hide the malicious domain
    expect(
      getLinkHrefType(
        "https://evil.com/foo/123/00000000-0000-0000-0000-000000000000/payload.html",
      ),
    ).toBe(LINK_TYPES.External)
    expect(
      getLinkHrefType(
        "http://malicious-site.com/path/456/01234567-89ab-cdef-0123-456789abcdef/phishing.html",
      ),
    ).toBe(LINK_TYPES.External)
  })

  it("returns Page for resource reference links", () => {
    expect(getLinkHrefType("[resource:1:42]")).toBe(LINK_TYPES.Page)
  })

  it("returns External for other URLs and paths", () => {
    expect(getLinkHrefType("https://example.com/page")).toBe(
      LINK_TYPES.External,
    )
    expect(getLinkHrefType("/some/page")).toBe(LINK_TYPES.External)
  })
})
