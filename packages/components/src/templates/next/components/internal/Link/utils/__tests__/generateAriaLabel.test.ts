import { describe, expect, it } from "vitest"

import { generateAriaLabel } from "../generateAriaLabel"

describe("generateAriaLabel", () => {
  it("should return label if its truthy", () => {
    const result = generateAriaLabel({
      label: "Test",
    })
    expect(result).toBe("Test")
  })

  it("should return undefined if the textContent is not provided", () => {
    const result = generateAriaLabel({})
    expect(result).toBeUndefined()
  })

  it("should return undefined if the textContent is not a link (it's a text)", () => {
    const result = generateAriaLabel({
      textContent: "This is a test",
    })
    expect(result).toBeUndefined()
  })

  it("should return the label if the textContent is a link", () => {
    const result = generateAriaLabel({
      textContent: "https://www.example.com",
    })
    expect(result).toBe("Link to www.example.com")
  })

  it("should return the label if the textContent is a link (apex domain)", () => {
    const result = generateAriaLabel({
      textContent: "https://example.com",
    })
    expect(result).toBe("Link to example.com")
  })

  it("should return the label if the textContent is a link (multiple subdomains)", () => {
    const result = generateAriaLabel({
      textContent: "https://www.subdomain.example.com",
    })
    expect(result).toBe("Link to www.subdomain.example.com")
  })

  it("should return the label and (opens in new tab) if the textContent is an external link", () => {
    const result = generateAriaLabel({
      textContent: "https://www.example.com",
      isExternal: true,
    })
    expect(result).toBe("Link to www.example.com (opens in new tab)")
  })

  it("should only return the domain and not the entire url", () => {
    const result = generateAriaLabel({
      textContent: "https://www.example.com/test",
    })
    expect(result).toBe("Link to www.example.com")
  })

  it("should only return the domain and not the entire url (with http)", () => {
    const result = generateAriaLabel({
      textContent: "http://www.example.com/test",
    })
    expect(result).toBe("Link to www.example.com")
  })

  it("should return the label if the textContent is a half-url", () => {
    const result = generateAriaLabel({
      textContent: "www.example.com",
    })
    expect(result).toBe("Link to www.example.com")
  })

  it("should return the label if the textContent is a half-url (no subdomain but ends with .com)", () => {
    const result = generateAriaLabel({
      textContent: "example.com",
    })
    expect(result).toBe("Link to example.com")
  })

  it("should return undefined if the textContent is a half-url (no subdomain but ends with non-.com)", () => {
    const result = generateAriaLabel({
      textContent: "example.xyz",
    })
    expect(result).toBeUndefined()
  })

  it("should return the label if the textContent is a half-url (starts with www. but ends with non-.com)", () => {
    const result = generateAriaLabel({
      textContent: "www.example.xyz",
    })
    expect(result).toBe("Link to www.example.xyz")
  })

  it("should return the label if the textContent starts with mailto:", () => {
    const result = generateAriaLabel({
      textContent: "mailto:test@example.com",
    })
    expect(result).toBe("Send an email to test@example.com")
  })
})
