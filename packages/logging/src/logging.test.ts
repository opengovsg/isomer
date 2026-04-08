import fs from "node:fs"
import os from "node:os"
import path from "node:path"
import pino from "pino"
import { afterEach, describe, expect, it } from "vitest"

import { createBaseLogger } from "./index"
import { resetPinoLoggerRootForTests } from "./logger"

describe("@isomer/logging", () => {
  let logFile: string | undefined

  afterEach(() => {
    if (logFile !== undefined && fs.existsSync(logFile)) {
      fs.rmSync(logFile)
      logFile = undefined
    }
    resetPinoLoggerRootForTests()
  })

  it("createBaseLogger writes syslog-shaped JSON with env binding", () => {
    // Arrange
    logFile = path.join(os.tmpdir(), `isomer-log-${Date.now()}.ndjson`)
    const dest = pino.destination({ dest: logFile, sync: true })
    const logger = createBaseLogger({
      nodeEnv: "production",
      appEnvLabel: "unit-test",
      destination: dest,
      path: "unit-test/root",
    })

    // Act
    logger.info("ping")
    const raw = fs.readFileSync(logFile, "utf8").trim()
    const row = JSON.parse(raw) as {
      level: string
      env: string
      msg: string
      timestamp: string
    }

    // Assert
    expect(row.level).toBe("INFO")
    expect(row.env).toBe("unit-test")
    expect(row.msg).toBe("ping")
    expect(row.timestamp).toBeDefined()
    expect(() => new Date(row.timestamp).toISOString()).not.toThrow()
    expect(new Date(row.timestamp).toISOString()).toBe(row.timestamp)
  })

  it("createBaseLogger adds path, id, trace_id, and clientIp", () => {
    // Arrange
    logFile = path.join(os.tmpdir(), `isomer-log-child-${Date.now()}.ndjson`)
    const dest = pino.destination({ dest: logFile, sync: true })
    const logger = createBaseLogger({
      nodeEnv: "production",
      appEnvLabel: "unit-test",
      destination: dest,
      path: "test/proc",
      clientIp: "203.0.113.1",
      traceId: "abc-123",
    })

    // Act
    logger.info("child-msg")
    const raw = fs.readFileSync(logFile, "utf8").trim()
    const row = JSON.parse(raw) as {
      path: string
      id: string
      trace_id: string
      clientIp: string
      msg: string
    }

    // Assert
    expect(row.path).toBe("test/proc")
    expect(row.id.length).toBeGreaterThan(0)
    expect(row.trace_id).toBe("abc-123")
    expect(row.clientIp).toBe("203.0.113.1")
    expect(row.msg).toBe("child-msg")
  })
})
