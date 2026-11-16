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

  it("copies a shared object once, so a reference chain stays linear", () => {
    // Arrange: 30 levels, each referencing the level below twice (2^30 paths)
    let node: unknown = { token: "secret" }
    for (let i = 0; i < 30; i++) node = [node, node]

    // Act
    const start = performance.now()
    const result = redactLogInput(node) as unknown[]

    // Assert
    expect(performance.now() - start).toBeLessThan(100)
    expect(result[0]).toBe(result[1])
  })

  it("terminates on a cycle", () => {
    // Arrange
    const input: Record<string, unknown> = { password: "p" }
    input.self = input

    // Act
    const result = redactLogInput(input) as Record<string, unknown>

    // Assert
    expect(result.password).toBe("[REDACTED]")
    expect(result.self).toBe(result)
  })
})
