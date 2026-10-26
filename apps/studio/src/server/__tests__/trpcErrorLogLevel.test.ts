import { TRPCError } from "@trpc/server"
import { describe, expect, it } from "vitest"

import { getTrpcErrorLogLevel } from "../trpcErrorLogLevel"

describe("getTrpcErrorLogLevel", () => {
  it.each([
    "BAD_REQUEST",
    "UNAUTHORIZED",
    "FORBIDDEN",
    "NOT_FOUND",
    "CONFLICT",
    "PRECONDITION_FAILED",
    "TOO_MANY_REQUESTS",
  ] as const)("logs %s as warn", (code) => {
    // Arrange
    const error = new TRPCError({ code })

    // Act
    const level = getTrpcErrorLogLevel(error)

    // Assert
    expect(level).toBe("warn")
  })

  it.each(["INTERNAL_SERVER_ERROR", "NOT_IMPLEMENTED"] as const)(
    "logs %s as error",
    (code) => {
      // Arrange
      const error = new TRPCError({ code })

      // Act
      const level = getTrpcErrorLogLevel(error)

      // Assert
      expect(level).toBe("error")
    },
  )
})
