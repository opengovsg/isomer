import { describe, expect, it } from "vitest"

import { redactLogInput } from "../redact-log-input"

describe("redactLogInput", () => {
  it("redacts known sensitive keys at the top level", () => {
    // Arrange
    const input = {
      apiKey: "sk-live",
      email: "user@example.com",
      password: "hunter2",
      secret: "shh",
      token: "123456",
    }

    // Act
    const result = redactLogInput(input)

    // Assert
    expect(result).toEqual({
      apiKey: "[REDACTED]",
      email: "user@example.com",
      password: "[REDACTED]",
      secret: "[REDACTED]",
      token: "[REDACTED]",
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
      meta: { refreshToken: "rt-123" },
      users: [
        { email: "a@example.com", token: "one" },
        { email: "b@example.com", token: "two" },
      ],
    }

    // Act
    const result = redactLogInput(input)

    // Assert
    expect(result).toEqual({
      meta: { refreshToken: "[REDACTED]" },
      users: [
        { email: "a@example.com", token: "[REDACTED]" },
        { email: "b@example.com", token: "[REDACTED]" },
      ],
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
    const undefinedResult = redactLogInput()

    // Assert
    expect(stringResult).toBe("plain")
    expect(numberResult).toBe(42)
    expect(nullResult).toBeNull()
    expect(undefinedResult).toBeUndefined()
  })
})
