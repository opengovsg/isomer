import { Writable } from "node:stream"
import { describe, expect, it } from "vitest"

import { createLoggerOptions, pino } from "@isomer/logging"

const logOnce = (fields: Record<string, unknown>) => {
  const lines: string[] = []
  const stream = new Writable({
    write(chunk, _encoding, callback) {
      lines.push(String(chunk))
      callback()
    },
  })

  // Pin the level so PINO_LOG_LEVEL in the test env cannot silence the line
  pino({ ...createLoggerOptions("test"), level: "error" }, stream).error(
    fields,
    "failed",
  )

  return JSON.parse(lines[0] ?? "{}") as Record<string, unknown>
}

describe("createLoggerOptions", () => {
  it.each(["err", "error", "originalError"])(
    "serializes an Error under `%s` with its message and stack",
    (key) => {
      // Arrange
      const error = new Error("boom")

      // Act
      const line = logOnce({ [key]: error })

      // Assert
      expect(line[key]).toMatchObject({
        type: "Error",
        message: "boom",
        stack: expect.stringContaining("Error: boom") as string,
      })
    },
  )

  it("leaves a string under `error` unchanged", () => {
    // Arrange
    const error = "Postman API call failed"

    // Act
    const line = logOnce({ error })

    // Assert
    expect(line.error).toBe(error)
  })
})
