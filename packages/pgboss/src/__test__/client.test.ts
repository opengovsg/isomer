import { beforeEach, vi, afterEach, describe, expect, it } from 'vitest';
import type { Mock } from "vitest"
import type { HeartbeatOptions } from "~/utils"
import { sendHeartbeat } from "~/utils"

import { type BaseLogger, pino } from "@isomer/logging"

import type { GlobalWithPgBoss } from ".."
import { registerPgbossJob } from ".."
import { env } from "../env"

const logger: BaseLogger = pino({ level: "silent" })

describe("client", () => {
  let globalForPgboss: GlobalWithPgBoss
  beforeEach(() => {
    globalForPgboss = global as unknown as GlobalWithPgBoss
    globalForPgboss.pgBoss = undefined
    globalForPgboss.registeredPgbossJobs = new Set<string>()
  })
  afterEach(() => {
    env.ENABLE_CRON_WORKERS = true
    vi.restoreAllMocks()
  })
  describe(registerPgbossJob, () => {
    it("does not start PgBoss or register a job when cron workers are disabled", async () => {
      env.ENABLE_CRON_WORKERS = false
      const handler = vi.fn<() => Promise<void>>().mockResolvedValue(undefined)

      const { stop } = await registerPgbossJob(
        logger,
        "disabled-job",
        "* * * * *",
        handler,
      )

      expect(globalForPgboss.pgBoss).toBeUndefined()
      expect(globalForPgboss.registeredPgbossJobs).toStrictEqual(new Set())
      expect(handler).not.toHaveBeenCalled()
      expect(stop()).toBeUndefined()
    })

    it("creates queue, registers worker, and schedules job", async () => {
      const handler = vi.fn<() => Promise<void>>().mockResolvedValue(undefined)

      const { stop } = await registerPgbossJob(
        logger,
        "test-job",
        "* * * * *",
        handler,
      )

      // expect the global PgBoss instance to have the job registered, as per singleton pattern
      expect({
        hasJob: globalForPgboss.registeredPgbossJobs.has("test-job"),
        pgBossDefined: globalForPgboss.pgBoss !== undefined,
        handlerCalled: handler.mock.calls.length,
      }).toStrictEqual({
        hasJob: true,
        pgBossDefined: true,
        handlerCalled: 0,
      })

      // verify that the schedule was created in the database
      const existingSchedules = await globalForPgboss.pgBoss!.getSchedules()
      const queue = await globalForPgboss.pgBoss!.getQueue("test-job")
      expect({
        scheduleCount: existingSchedules.length,
        schedule: existingSchedules[0],
        queueDefined: queue !== undefined,
      }).toMatchObject({
        scheduleCount: 1,
        schedule: { cron: "* * * * *", name: "test-job" },
        queueDefined: true,
      })

      // verify that calling stop works
      const offWorkSpy = vi
        .spyOn(globalForPgboss.pgBoss!, "offWork")
        .mockResolvedValue()
      await stop()
      expect(offWorkSpy).toHaveBeenCalledOnce()
    })

    it("does not register the job again if already registered", async () => {
      const handler = vi.fn<() => Promise<void>>().mockResolvedValue(undefined)

      // First registration
      await registerPgbossJob(logger, "test-job", "* * * * *", handler)

      // Second registration attempt
      const { stop } = await registerPgbossJob(
        logger,
        "test-job",
        "* * * * *",
        handler,
      )

      // Verify that only one schedule exists in the database
      const existingSchedules = await globalForPgboss.pgBoss!.getSchedules()
      expect(existingSchedules).toHaveLength(1)

      // Verify that calling stop works
      const offWorkSpy = vi
        .spyOn(globalForPgboss.pgBoss!, "offWork")
        .mockResolvedValue()
      await stop()
      expect(offWorkSpy).toHaveBeenCalledOnce()
    })
  })
  describe(sendHeartbeat, () => {
    let fetchMock: Mock
    beforeEach(() => {
      fetchMock = vi.fn<typeof fetch>()
      global.fetch = fetchMock
    })
    const MOCK_URL = "http://example.com/heartbeat"

    it("sends heartbeat successfully on first attempt", async () => {
      // Mock fetch to succeed on first attempt with a 200 response
      fetchMock.mockResolvedValueOnce({ ok: true, status: 200 })
      const options: HeartbeatOptions = {
        heartbeatURL: MOCK_URL,
      }

      await sendHeartbeat(logger, "job-123", options)

      expect(fetchMock).toHaveBeenCalledExactlyOnceWith(MOCK_URL, {
        method: "POST",
      })
    })

    it("tries a max of 3 times before failing", async () => {
      // Mock fetch to fail with a 500 response
      fetchMock.mockResolvedValue({ ok: false, status: 500 })
      const options: HeartbeatOptions = {
        heartbeatURL: MOCK_URL,
      }

      await sendHeartbeat(logger, "job-123", options)

      expect(fetchMock).toHaveBeenCalledTimes(3)
      expect(fetchMock).toHaveBeenCalledWith(MOCK_URL, {
        method: "POST",
      })
    })
  })
})
