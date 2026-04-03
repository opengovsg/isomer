import fs from "node:fs"
import os from "node:os"
import path from "node:path"

import pino from "pino"
import { afterEach, describe, expect, it } from "vitest"

import { createChildLogger, createRootLogger } from "./index"

describe("@isomer/logging", () => {
  let logFile: string | undefined

  afterEach(() => {
    if (logFile !== undefined && fs.existsSync(logFile)) {
      fs.rmSync(logFile)
      logFile = undefined
    }
  })

  it("createRootLogger writes syslog-shaped JSON with env binding", () => {
    logFile = path.join(os.tmpdir(), `isomer-log-${Date.now()}.ndjson`)
    const dest = pino.destination({ dest: logFile, sync: true })
    const root = createRootLogger({
      nodeEnv: "production",
      appEnvLabel: "unit-test",
      destination: dest,
    })
    root.info("ping")
    const raw = fs.readFileSync(logFile, "utf8").trim()
    const row = JSON.parse(raw) as {
      level: string
      env: string
      msg: string
    }
    expect(row.level).toBe("INFO")
    expect(row.env).toBe("unit-test")
    expect(row.msg).toBe("ping")
  })

  it("createChildLogger adds path, id, trace_id, and clientIp", () => {
    logFile = path.join(os.tmpdir(), `isomer-log-child-${Date.now()}.ndjson`)
    const dest = pino.destination({ dest: logFile, sync: true })
    const root = createRootLogger({
      nodeEnv: "production",
      appEnvLabel: "unit-test",
      destination: dest,
    })
    const child = createChildLogger(root, {
      path: "test/proc",
      clientIp: "203.0.113.1",
      traceId: "abc-123",
    })
    child.info("child-msg")
    const raw = fs.readFileSync(logFile, "utf8").trim()
    const row = JSON.parse(raw) as {
      path: string
      id: string
      trace_id: string
      clientIp: string
      msg: string
    }
    expect(row.path).toBe("test/proc")
    expect(row.id.length).toBeGreaterThan(0)
    expect(row.trace_id).toBe("abc-123")
    expect(row.clientIp).toBe("203.0.113.1")
    expect(row.msg).toBe("child-msg")
  })
})
