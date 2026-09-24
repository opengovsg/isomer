import type { Mock } from "vitest"
import type { HeartbeatOptions } from "~/utils"
import { sendHeartbeat } from "~/utils"

import { type BaseLogger, pino } from "@isomer/logging"

import type { GlobalWithPgBoss } from ".."
import { registerPgbossJob } from ".."

const { mockEnv } = vi.hoisted(() => ({
  mockEnv: {
    ENABLE_CRON_WORKERS: true,
    DATABASE_URL:
      process.env.DATABASE_URL ?? "postgres://root:root@localhost:5431/test",
  },
}))

vi.mock("../env", () => ({
  env: mockEnv,
}))

const logger: BaseLogger = pino({ level: "silent" })

describe("client", () => {
  let globalForPgboss: GlobalWithPgBoss
  beforeEach(() => {
    globalForPgboss = global as unknown as GlobalWithPgBoss
    globalForPgboss.pgBoss = undefined
    globalForPgboss.registeredPgbossJobs = new Set<string>()
  })
  afterEach(() => {
    mockEnv.ENABLE_CRON_WORKERS = true
    vi.restoreAllMocks()
  })
  describe("registerPgbossJob", () => {
    it("does not start PgBoss or register a job when cron workers are disabled", async () => {
      // Arrange
      mockEnv.ENABLE_CRON_WORKERS = false
      const handler = vi.fn().mockResolvedValue(undefined)

      // Act
      const { stop } = await registerPgbossJob(
        logger,
        "disabled-job",
        "* * * * *",
        handler,
      )

      // Assert
      expect(globalForPgboss.pgBoss).toBeUndefined()
      expect(globalForPgboss.registeredPgbossJobs).toEqual(new Set())
      expect(handler).not.toHaveBeenCalled()
      expect(stop()).toBeUndefined()
    })

    it("creates queue, registers worker, and schedules job", async () => {
      // Arrange
      const handler = vi.fn().mockResolvedValue(undefined)

      // Act
      const { stop } = await registerPgbossJob(
        logger,
        "test-job",
        "* * * * *",
        handler,
      )

      // Assert
      expect(globalForPgboss.registeredPgbossJobs.has("test-job")).toBe(true)
      expect(globalForPgboss.pgBoss).toBeDefined()
      expect(handler).not.toHaveBeenCalled()

      const existingSchedules = await globalForPgboss.pgBoss!.getSchedules()
      expect(existingSchedules.length).toBe(1)
      const schedule = existingSchedules[0]
      expect(schedule!.cron).toBe("* * * * *")
      expect(schedule!.name).toBe("test-job")

      const queue = await globalForPgboss.pgBoss!.getQueue("test-job")
      expect(queue).toBeDefined()

      const offWorkSpy = vi
        .spyOn(globalForPgboss.pgBoss!, "offWork")
        .mockResolvedValue()
      await stop()
      expect(offWorkSpy).toHaveBeenCalledTimes(1)
    })

    it("does not register the job again if already registered", async () => {
      // Arrange
      const handler = vi.fn().mockResolvedValue(undefined)

      // Act
      await registerPgbossJob(logger, "test-job", "* * * * *", handler)
      const { stop } = await registerPgbossJob(
        logger,
        "test-job",
        "* * * * *",
        handler,
      )

      // Assert
      const existingSchedules = await globalForPgboss.pgBoss!.getSchedules()
      expect(existingSchedules.length).toBe(1)

      const offWorkSpy = vi
        .spyOn(globalForPgboss.pgBoss!, "offWork")
        .mockResolvedValue()
      await stop()
      expect(offWorkSpy).toHaveBeenCalledTimes(1)
    })
  })
  describe("sendHeartbeat", () => {
    let fetchMock: Mock
    beforeEach(() => {
      fetchMock = vi.fn()
      global.fetch = fetchMock
    })
    const MOCK_URL = "http://example.com/heartbeat"
    it("sends heartbeat successfully on first attempt", async () => {
      // Arrange
      fetchMock.mockResolvedValueOnce({ ok: true, status: 200 })
      const options: HeartbeatOptions = {
        heartbeatURL: MOCK_URL,
      }

      // Act
      await sendHeartbeat(logger, "job-123", options)

      // Assert
      expect(fetchMock).toHaveBeenCalledTimes(1)
      expect(fetchMock).toHaveBeenCalledWith(MOCK_URL, {
        method: "POST",
      })
    })
    it("tries a max of 3 times before failing", async () => {
      // Arrange
      fetchMock.mockResolvedValue({ ok: false, status: 500 })
      const options: HeartbeatOptions = {
        heartbeatURL: MOCK_URL,
      }

      // Act
      await sendHeartbeat(logger, "job-123", options)

      // Assert
      expect(fetchMock).toHaveBeenCalledTimes(3)
      expect(fetchMock).toHaveBeenCalledWith(MOCK_URL, {
        method: "POST",
      })
    })
  })
})
