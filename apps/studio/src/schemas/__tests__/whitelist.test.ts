import { describe, expect, it } from "vitest"

import { whitelistEmailsInputSchema } from "../whitelist"

describe("whitelistEmailsInputSchema", () => {
  it("normalises, strips blanks, and deduplicates emails", () => {
    // Arrange
    const input = {
      adminEmails: [" ADMIN@test.com ", "", "admin@test.com", "  "],
      vendorEmails: ["Vendor@test.com", "vendor@test.com"],
    }

    // Act
    const result = whitelistEmailsInputSchema.parse(input)

    // Assert
    expect(result).toEqual({
      adminEmails: ["admin@test.com"],
      vendorEmails: ["vendor@test.com"],
    })
  })

  it("rejects the whole request when any email is invalid", () => {
    // Arrange / Act
    const result = whitelistEmailsInputSchema.safeParse({
      adminEmails: ["valid@test.com", "not-an-email"],
      vendorEmails: [],
    })

    // Assert
    expect(result.success).toBe(false)
  })
})
