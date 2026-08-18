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
  ])("rejects a disallowed href scheme: %s", (linkHref) => {
    const result = linkEditorSchema.safeParse({
      linkText: "Isomer",
      linkHref,
    })
    expect(result.success).toBe(false)
  })
})
