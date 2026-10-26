import { describe, expect, it } from "vitest"

import { shouldKeepHref } from "../standaloneHtml"

describe("shouldKeepHref", () => {
  const host = "www.isomer.gov.sg"

  it("keeps links to external hosts", () => {
    expect(shouldKeepHref("https://google.com", host)).toBe(true)
    expect(shouldKeepHref("http://other.gov.sg/path", host)).toBe(true)
  })

  it("keeps in-page anchors", () => {
    expect(shouldKeepHref("#section", host)).toBe(true)
  })

  it("drops relative internal links", () => {
    expect(shouldKeepHref("/about", host)).toBe(false)
    expect(shouldKeepHref("faq", host)).toBe(false)
  })

  it("drops absolute links back to the same site", () => {
    expect(shouldKeepHref(`https://${host}/about`, host)).toBe(false)
  })

  it("drops malformed hrefs", () => {
    expect(shouldKeepHref("https://", host)).toBe(false)
  })
})
