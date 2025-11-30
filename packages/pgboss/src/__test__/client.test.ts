import pino from "pino";
import type { GlobalWithPgBoss } from "..";
import { registerPgbossJob } from "..";
import type { Mock } from "vitest";
import type { HeartbeatOptions } from "~/utils";
import { sendHeartbeat } from "~/utils";

const logger: pino.Logger<string> = pino({ level: "silent" });

describe("client", () => {
  let globalForPgboss: GlobalWithPgBoss;
  beforeEach(() => {
    globalForPgboss = global as unknown as GlobalWithPgBoss;
    globalForPgboss.pgBoss = undefined;
    globalForPgboss.registeredPgbossJobs = new Set<string>();
  });
  afterEach(() => {
    vi.restoreAllMocks();
  });
  describe("registerPgbossJob", () => {
    it("creates queue, registers worker, and schedules job", async () => {
      const handler = vi.fn().mockResolvedValue(undefined);

      const { stop } = await registerPgbossJob(
        logger,
        "test-job",
        "* * * * *",
        handler,
      );

      // expect the global PgBoss instance to have the job registered, as per singleton pattern
      expect(globalForPgboss.registeredPgbossJobs.has("test-job")).toBe(true);
      expect(globalForPgboss.pgBoss).toBeDefined();
      // the handler should not have been called yet
      expect(handler).not.toHaveBeenCalled();

      // verify that the schedule was created in the database
      const existingSchedules = await globalForPgboss.pgBoss!.getSchedules();
      expect(existingSchedules.length).toBe(1);
      const schedule = existingSchedules[0];
      expect(schedule!.cron).toBe("* * * * *");
      expect(schedule!.name).toBe("test-job");

      // verify that the queue was created in the database
      const queue = await globalForPgboss.pgBoss!.getQueue("test-job");
      expect(queue).toBeDefined();

      // verify that calling stop works
      const offWorkSpy = vi
        .spyOn(globalForPgboss.pgBoss!, "offWork")
        .mockResolvedValue();
      await stop();
      expect(offWorkSpy).toHaveBeenCalledTimes(1);
    });

    it("does not register the job again if already registered", async () => {
      const handler = vi.fn().mockResolvedValue(undefined);

      // First registration
      await registerPgbossJob(logger, "test-job", "* * * * *", handler);

      // Second registration attempt
      const { stop } = await registerPgbossJob(
        logger,
        "test-job",
        "* * * * *",
        handler,
      );

      // Verify that only one schedule exists in the database
      const existingSchedules = await globalForPgboss.pgBoss!.getSchedules();
      expect(existingSchedules.length).toBe(1);

      // Verify that calling stop works
      const offWorkSpy = vi
        .spyOn(globalForPgboss.pgBoss!, "offWork")
        .mockResolvedValue();
      await stop();
      expect(offWorkSpy).toHaveBeenCalledTimes(1);
    });
  });
  describe("sendHeartbeat", () => {
    let fetchMock: Mock;
    beforeEach(() => {
      fetchMock = vi.fn();
      global.fetch = fetchMock;
    });
    const MOCK_URL = "http://example.com/heartbeat";
    it("sends heartbeat successfully on first attempt", async () => {
      // Mock fetch to succeed on first attempt with a 200 response
      fetchMock.mockResolvedValueOnce({ ok: true, status: 200 });
      const options: HeartbeatOptions = {
        heartbeatURL: MOCK_URL,
      };

      await sendHeartbeat(logger, "job-123", options);

      expect(fetchMock).toHaveBeenCalledTimes(1);
      expect(fetchMock).toHaveBeenCalledWith(MOCK_URL, {
        method: "POST",
      });
    });
    it("tries a max of 3 times before failing", async () => {
      // Mock fetch to fail with a 500 response
      fetchMock.mockResolvedValue({ ok: false, status: 500 });
      const options: HeartbeatOptions = {
        heartbeatURL: MOCK_URL,
      };

      await sendHeartbeat(logger, "job-123", options);

      expect(fetchMock).toHaveBeenCalledTimes(3);
      expect(fetchMock).toHaveBeenCalledWith(MOCK_URL, {
        method: "POST",
      });
    });
  });
});
