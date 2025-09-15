import type { User } from "@prisma/client"
import type { Job } from "bullmq"
import { QueueEvents } from "bullmq"
import { addMilliseconds, addSeconds } from "date-fns"
import MockDate from "mockdate"
import { auth } from "tests/integration/helpers/auth"
import { resetTables } from "tests/integration/helpers/db"
import { applyAuthedSession } from "tests/integration/helpers/iron-session"
import { setupPageResource, setupUser } from "tests/integration/helpers/seed"

import { RedisClient } from "@isomer/redis"

import type { ScheduledPublishJobData } from "../schedule-publish"
import { db } from "~/server/modules/database"
import * as resourceService from "~/server/modules/resource/resource.service"
import {
  BUFFER_IN_SECONDS,
  createScheduledPublishWorker,
  getJobIdFromResourceId,
  scheduledPublishQueue,
} from "../schedule-publish"

const queueEvents = new QueueEvents(scheduledPublishQueue.name, {
  connection: RedisClient,
})

describe("bullMq.scheduledPublishQueue", async () => {
  const FIXED_NOW = new Date("2024-01-01T00:00:00.000Z")
  const session = await applyAuthedSession()
  let user: User
  beforeEach(async () => {
    await resetTables("Resource", "User")
    user = await setupUser({
      userId: session.userId ?? undefined,
      email: "test@mock.com",
      isDeleted: false,
    })
    await auth(user)
    await queueEvents.waitUntilReady()
  })
  afterAll(async () => {
    await queueEvents.close()
  })
  beforeEach(async () => {
    await scheduledPublishQueue.obliterate({ force: true })
    MockDate.set(FIXED_NOW) // Freeze time before each test
    vi.spyOn(resourceService, "publishPageResource")
  })
  afterEach(() => {
    vi.restoreAllMocks()
    MockDate.reset()
  })
  describe("publishScheduledResource", () => {
    it("publishes a resource successfully", async () => {
      // Arrange
      const scheduleDate = addMilliseconds(FIXED_NOW, 100) // 100 milliseconds from now
      const { site, page: expectedPage } = await setupPageResource({
        resourceType: "Page",
        scheduledAt: scheduleDate,
      })
      const jobData: ScheduledPublishJobData = {
        resourceId: Number(expectedPage.id),
        siteId: site.id,
        userId: user.id,
      }
      const addedJob = await scheduledPublishQueue.add(
        "scheduled-publish",
        jobData,
        { delay: scheduleDate.getTime() - FIXED_NOW.getTime() },
      )
      expect(addedJob).toBeDefined()
      const jobs = await scheduledPublishQueue.getJobs()
      expect(jobs.length).toBe(1)
      const job = jobs[0]!
      expect(job.data).toEqual(jobData)
      expect(job.name).toBe("scheduled-publish")

      // Act
      MockDate.set(scheduleDate) // Move time forward to ensure job is due
      const finishedJobId: Job<ScheduledPublishJobData> =
        await job.waitUntilFinished(queueEvents, 2000)

      // Assert
      expect(finishedJobId).toBe(addedJob.id)
      expect(resourceService.publishPageResource).toHaveBeenCalledOnce()
      const updatedPage = await resourceService.getPageById(db, {
        resourceId: Number(expectedPage.id),
        siteId: site.id,
      })
      expect(updatedPage!.scheduledAt).toBeNull()
    })
    it("exists the job if the scheduledAt is not within the BUFFER_TIME", async () => {
      // Arrange
      const scheduleDate = addSeconds(FIXED_NOW, BUFFER_IN_SECONDS * 2)
      const { site, page: expectedPage } = await setupPageResource({
        resourceType: "Page",
        scheduledAt: scheduleDate,
      })
      const jobData: ScheduledPublishJobData = {
        resourceId: Number(expectedPage.id),
        siteId: site.id,
        userId: user.id,
      }
      const job = await scheduledPublishQueue.add(
        "scheduled-publish",
        jobData,
        { delay: 0 }, // make job immediately available, even though the scheduledAt is 2 * BUFFER_IN_SECONDS in the future
      )

      // Act
      await job.waitUntilFinished(queueEvents, 2000)

      // Assert
      expect(resourceService.publishPageResource).not.toHaveBeenCalled()
      const updatedPage = await resourceService.getPageById(db, {
        resourceId: Number(expectedPage.id),
        siteId: site.id,
      })
      // scheduledAt should remain unchanged, since the job should exit early without publishing
      expect(updatedPage!.scheduledAt).toEqual(scheduleDate)
    })
    it("multiple workers process the job only once", async () => {
      // Arrange
      const scheduleDate = addMilliseconds(FIXED_NOW, 100) // 100 milliseconds from now
      const { site, page: expectedPage } = await setupPageResource({
        resourceType: "Page",
        scheduledAt: scheduleDate,
      })
      const jobData: ScheduledPublishJobData = {
        resourceId: Number(expectedPage.id),
        siteId: site.id,
        userId: user.id,
      }
      // Create workers to simulate multiple workers trying to process the same job
      const workers = await Promise.all(
        Array.from({ length: 5 }).map(() => {
          const worker = createScheduledPublishWorker()
          return worker.waitUntilReady().then(() => worker)
        }),
      )
      const addedJob = await scheduledPublishQueue.add(
        "scheduled-publish",
        jobData,
        { delay: scheduleDate.getTime() - FIXED_NOW.getTime() },
      )

      // Act
      MockDate.set(scheduleDate) // Move time forward to ensure job is due
      const finishedJobId: string = await addedJob.waitUntilFinished(
        queueEvents,
        2000,
      )

      // Assert
      expect(finishedJobId).toEqual(addedJob.id)
      expect(resourceService.publishPageResource).toHaveBeenCalledOnce()

      // Cleanup: close all workers
      await Promise.all(workers.map((w) => w.close()))
    })
    it("multiple duplicated jobs for the same resource are handled correctly", async () => {
      // Arrange
      const { site, page: expectedPage } = await setupPageResource({
        resourceType: "Page",
        scheduledAt: FIXED_NOW,
      })
      const jobData: ScheduledPublishJobData = {
        resourceId: Number(expectedPage.id),
        siteId: site.id,
        userId: user.id,
      }

      // Create workers to simulate multiple workers trying to process the same job
      const workers = await Promise.all(
        Array.from({ length: 5 }).map(async () => {
          const worker = createScheduledPublishWorker()
          return worker.waitUntilReady().then(() => worker)
        }),
      )

      // Add multiple jobs for the same resource concurrently
      // NOTE: in practice, this should not happen due to our jobId deduplication logic
      // but we test this to ensure our locking logic works correctly
      // even if duplicate jobs for the same resource are added due to some unforeseen reason
      const jobs = await Promise.all(
        Array.from({ length: 5 }).map((_, i) =>
          scheduledPublishQueue.add("scheduled-publish", jobData, {
            // Make the jobIds unique to bypass BullMQ's built-in deduplication
            // In practice, our job addition logic should prevent duplicates via jobId
            jobId: `${getJobIdFromResourceId(jobData.resourceId.toString())}-${i}`,
            attempts: 1, // no retries to speed up the test
          }),
        ),
      )

      // Act
      // Wait for all jobs to complete, using Promise.allSettled since locking in a test environment
      // may cause some jobs to fail with ExecutionError since they cannot achieve a quorum
      await Promise.allSettled(
        jobs.map((job) => job.waitUntilFinished(queueEvents, 2000)),
      )

      // Assert
      expect(resourceService.publishPageResource).toHaveBeenCalledOnce()

      // Cleanup: close all workers
      await Promise.all(workers.map((w) => w.close()))
    })
  })
})
