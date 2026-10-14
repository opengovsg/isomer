import { describe, expect, it } from "vitest"
import { normaliseEmail } from "~/utils/zod"

import { emailSignInSchema } from "../auth/email/sign-in"

describe("normaliseEmail", () => {
  it("trims and lowercases a valid email", () => {
    expect(normaliseEmail.parse("  Admin@Example.COM  ")).toBe(
      "admin@example.com",
    )
  })

  it("rejects empty input after trim", () => {
    expect(normaliseEmail.safeParse("   ").success).toBe(false)
  })

  it("rejects strings that are not valid emails", () => {
    expect(normaliseEmail.safeParse("not-an-email").success).toBe(false)
  })
})

describe("emailSignInSchema", () => {
  it("normalises email before sign-in validation", () => {
    const result = emailSignInSchema.parse({
      email: "  user@example.com ",
    })

    expect(result.email).toBe("user@example.com")
  })

  it("rejects invalid emails for sign-in", () => {
    const result = emailSignInSchema.safeParse({
      email: "invalid",
    })

    expect(result.success).toBe(false)
  })
})
