import { describe, expect, it } from "vitest"

import { linkEditorSchema } from "./LinkEditorModal"

describe("linkEditorSchema", () => {
  it("accepts a valid external link", () => {
    const result = linkEditorSchema.safeParse({
      linkText: "Isomer",
      linkHref: "https://isomer.gov.sg",
    })
    expect(result.success).toBe(true)
  })

  it("rejects an empty linkText", () => {
    const result = linkEditorSchema.safeParse({
      linkText: "",
      linkHref: "https://isomer.gov.sg",
    })
    expect(result.success).toBe(false)
  })

  it("rejects an empty linkHref", () => {
    const result = linkEditorSchema.safeParse({
      linkText: "Isomer",
      linkHref: "",
    })
    expect(result.success).toBe(false)
  })

  it("trims stray leading/trailing whitespace from a valid linkHref", () => {
    const result = linkEditorSchema.safeParse({
      linkText: "Isomer",
      linkHref: "  https://isomer.gov.sg  ",
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.linkHref).toBe("https://isomer.gov.sg")
    }
  })

  it("rejects a linkHref that is only whitespace", () => {
    const result = linkEditorSchema.safeParse({
      linkText: "Isomer",
      linkHref: "   ",
    })
    expect(result.success).toBe(false)
  })

  it("does not reject a valid link containing internal whitespace-like characters", () => {
    const result = linkEditorSchema.safeParse({
      linkText: "Isomer",
      linkHref: "https://example.com/foo\tbar\nbaz",
    })
    expect(result.success).toBe(true)
  })

  it("rejects a bare https:// scheme with no domain", () => {
    const result = linkEditorSchema.safeParse({
      linkText: "Isomer",
      linkHref: "https://",
    })
    expect(result.success).toBe(false)
  })

  it("rejects a bare mailto: scheme with no address", () => {
    const result = linkEditorSchema.safeParse({
      linkText: "Isomer",
      linkHref: "mailto:",
    })
    expect(result.success).toBe(false)
  })

  it.each([
    "javascript:alert(1)",
    "JavaScript:alert(1)",
    "data:text/html,<script>alert(1)</script>",
    "vbscript:msgbox(1)",
    "  javascript:alert(1)",
    // Browsers strip internal tabs/newlines/CRs before parsing the URL
    // scheme, so these are all equivalent to "javascript:alert(1)".
    "java\tscript:alert(1)",
    "java\nscript:alert(1)",
    "java\rscript:alert(1)",
    "\tjavascript:alert(1)",
  ])("rejects a disallowed href scheme: %s", (linkHref) => {
    const result = linkEditorSchema.safeParse({
      linkText: "Isomer",
      linkHref,
    })
    expect(result.success).toBe(false)
  })
})
