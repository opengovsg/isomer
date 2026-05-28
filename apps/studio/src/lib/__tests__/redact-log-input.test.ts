import { describe, expect, it } from "vitest"

import { redactLogInput } from "../redact-log-input"

describe("redactLogInput", () => {
  it("redacts known sensitive keys at the top level", () => {
    expect(
      redactLogInput({
        email: "user@example.com",
        token: "123456",
        password: "hunter2",
        apiKey: "sk-live",
        secret: "shh",
      }),
    ).toEqual({
      email: "user@example.com",
      token: "[REDACTED]",
      password: "[REDACTED]",
      apiKey: "[REDACTED]",
      secret: "[REDACTED]",
    })
  })

  it("redacts sensitive keys case-insensitively", () => {
    expect(redactLogInput({ OTP: "654321", Token: "abcdef" })).toEqual({
      OTP: "[REDACTED]",
      Token: "[REDACTED]",
    })
  })

  it("redacts sensitive keys in nested objects and arrays", () => {
    expect(
      redactLogInput({
        users: [
          { email: "a@example.com", token: "one" },
          { email: "b@example.com", token: "two" },
        ],
        meta: { refreshToken: "rt-123" },
      }),
    ).toEqual({
      users: [
        { email: "a@example.com", token: "[REDACTED]" },
        { email: "b@example.com", token: "[REDACTED]" },
      ],
      meta: { refreshToken: "[REDACTED]" },
    })
  })

  it("returns primitives unchanged", () => {
    expect(redactLogInput("plain")).toBe("plain")
    expect(redactLogInput(42)).toBe(42)
    expect(redactLogInput(null)).toBeNull()
    expect(redactLogInput(undefined)).toBeUndefined()
  })
})
