import { describe, expect, it } from "vitest"

import { redactLogInput } from "../redact-log-input"

describe("redactLogInput", () => {
  it("redacts known sensitive keys at the top level", () => {
    // Arrange
    const input = {
      email: "user@example.com",
      token: "123456",
      password: "hunter2",
      apiKey: "sk-live",
      secret: "shh",
    }

    // Act
    const result = redactLogInput(input)

    // Assert
    expect(result).toEqual({
      email: "user@example.com",
      token: "[REDACTED]",
      password: "[REDACTED]",
      apiKey: "[REDACTED]",
      secret: "[REDACTED]",
    })
  })

  it("redacts sensitive keys case-insensitively", () => {
    // Arrange
    const input = { OTP: "654321", Token: "abcdef" }

    // Act
    const result = redactLogInput(input)

    // Assert
    expect(result).toEqual({
      OTP: "[REDACTED]",
      Token: "[REDACTED]",
    })
  })

  it("redacts sensitive keys in nested objects and arrays", () => {
    // Arrange
    const input = {
      users: [
        { email: "a@example.com", token: "one" },
        { email: "b@example.com", token: "two" },
      ],
      meta: { refreshToken: "rt-123" },
    }

    // Act
    const result = redactLogInput(input)

    // Assert
    expect(result).toEqual({
      users: [
        { email: "a@example.com", token: "[REDACTED]" },
        { email: "b@example.com", token: "[REDACTED]" },
      ],
      meta: { refreshToken: "[REDACTED]" },
    })
  })

  it("returns primitives unchanged", () => {
    // Arrange
    const stringInput = "plain"
    const numberInput = 42

    // Act
    const stringResult = redactLogInput(stringInput)
    const numberResult = redactLogInput(numberInput)
    const nullResult = redactLogInput(null)
    const undefinedResult = redactLogInput(undefined)

    // Assert
    expect(stringResult).toBe("plain")
    expect(numberResult).toBe(42)
    expect(nullResult).toBeNull()
    expect(undefinedResult).toBeUndefined()
  })
})
