import { describe, expect, it } from "vitest"
import { normaliseEmail } from "~/utils/zod"

import { emailSignInSchema } from "../auth/email/sign-in"

describe("normaliseEmail", () => {
  it("trims and lowercases a valid email", () => {
    // Arrange / Act
    const result = normaliseEmail.parse("  Admin@Example.COM  ")

    // Assert
    expect(result).toBe("admin@example.com")
  })

  it("rejects empty input after trim", () => {
    // Arrange / Act
    const result = normaliseEmail.safeParse("   ")

    // Assert
    expect(result.success).toBe(false)
  })

  it("rejects strings that are not valid emails", () => {
    // Arrange / Act
    const result = normaliseEmail.safeParse("not-an-email")

    // Assert
    expect(result.success).toBe(false)
  })
})

describe("emailSignInSchema", () => {
  it("normalises email before sign-in validation", () => {
    // Arrange / Act
    const result = emailSignInSchema.parse({
      email: "  user@example.com ",
    })

    // Assert
    expect(result.email).toBe("user@example.com")
  })

  it("rejects invalid emails for sign-in", () => {
    // Arrange / Act
    const result = emailSignInSchema.safeParse({
      email: "invalid",
    })

    // Assert
    expect(result.success).toBe(false)
  })
})
