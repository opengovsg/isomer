import type { GrowthBook } from "@growthbook/growthbook"
import type { Session } from "~/lib/types/session"
import type { User } from "~prisma/generated/prisma/client"
import MockDate from "mockdate"
import { auth } from "tests/integration/helpers/auth"
import { resetTables } from "tests/integration/helpers/db"
import {
  applyAuthedSession,
  createMockRequest,
} from "tests/integration/helpers/iron-session"
import {
  createSupersededBuildRows,
  setupCodeBuildJob,
  setupPageResource,
  setupSite,
  setupUser,
} from "tests/integration/helpers/seed"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { TOPPAN_EMAIL_DOMAIN } from "~/constants/toppan"
import * as mailService from "~/features/mail/service"
import { buildIdFromArn } from "~/schemas/webhook"
import { WEBHOOK_X_API_KEY_HEADER, createCallerFactory } from "~/server/trpc"

import { db } from "../../database/database"
import { webhookRouter } from "../webhook.router"

const getCallerWithMockGrowthbook = (
  session: Session,
  mockReturnValue = true,
  apiKey: string | null = "test-webhook-api-key",
): ReturnType<typeof createCaller> => {
  const mockRequest = createMockRequest(session, {
    headers:
      apiKey === null
        ? undefined
        : {
            [WEBHOOK_X_API_KEY_HEADER]: apiKey,
          },
    method: "GET",
  })
  const mockGrowthBook: Partial<GrowthBook> = {
    destroy: vi.fn(),
    isOn: vi.fn().mockReturnValue(mockReturnValue),
  }
  // SAFETY: webhook tests only need GrowthBook feature-flag methods on the request
  mockRequest.gb = mockGrowthBook as GrowthBook
  return createCaller(mockRequest)
}

const createCaller = createCallerFactory(webhookRouter)
const FIXED_NOW = new Date("2024-01-01T00:00:00.000Z")

describe("webhook.router", async () => {
  const session = await applyAuthedSession()
  let user: User
  beforeEach(async () => {
    vi.clearAllMocks()
    vi.spyOn(mailService, "sendSuccessfulPublishEmail").mockResolvedValue()
    vi.spyOn(mailService, "sendFailedPublishEmail").mockResolvedValue()
    await resetTables("CodeBuildJobs", "User", "Resource", "Site")
    user = await setupUser({
      email: "test@mock.com",
      isDeleted: false,
      userId: session.userId,
    })
    await auth(user)
  })

  describe("updateCodebuildWebhook", () => {
    beforeEach(() => {
      MockDate.set(FIXED_NOW)
      // Freeze time before each test
    })
    afterEach(() => {
      MockDate.reset()
      // Reset time after each test
    })
    it("it should update the codebuildjobs table if the received build status is successful", async () => {
      // Arrange
      const { page, codebuildJob } = await setupCodeBuildJob({
        arn: "build/test-id",
        isScheduled: true,
        startedAt: FIXED_NOW,
        userId: user.id,
      })
      const caller = getCallerWithMockGrowthbook(session)

      // Act
      await caller.updateCodebuildWebhook({
        arn: "build/test-id",
        // saved in the db
        projectName: "test-project",
        status: "SUCCEEDED",
      })

      // Assert
      expect(mailService.sendSuccessfulPublishEmail).toHaveBeenCalledOnce()
      expect(mailService.sendSuccessfulPublishEmail).toHaveBeenCalledWith({
        isScheduled: true,
        recipientEmail: user.email,
        resource: expect.objectContaining(page),
      })

      // check the codebuildjobs table to see if the status has been updated
      const job = await db
        .selectFrom("CodeBuildJobs")
        .where("buildId", "=", codebuildJob.buildId)
        .selectAll()
        .executeTakeFirstOrThrow()

      expect(job).toEqual(
        expect.objectContaining({
          emailSent: true,
          status: "SUCCEEDED",
        }),
      )
    })
    it("does not send a success email to toppan users", async () => {
      // Arrange
      const toppanUser = await setupUser({
        email: `toppan-user${TOPPAN_EMAIL_DOMAIN}`,
      })
      const { codebuildJob } = await setupCodeBuildJob({
        arn: "build/test-id",
        isScheduled: true,
        startedAt: FIXED_NOW,
        userId: toppanUser.id,
      })
      const caller = getCallerWithMockGrowthbook(session)

      // Act
      await caller.updateCodebuildWebhook({
        arn: "build/test-id",
        // saved in the db
        projectName: "test-project",
        status: "SUCCEEDED",
      })

      // Assert
      expect(mailService.sendSuccessfulPublishEmail).not.toHaveBeenCalled()
      // the build status should still be updated, but no email should be sent
      const job = await db
        .selectFrom("CodeBuildJobs")
        .where("buildId", "=", codebuildJob.buildId)
        .selectAll()
        .executeTakeFirstOrThrow()
      expect(job).toEqual(
        expect.objectContaining({
          emailSent: false,
          // emailSent should remain false
          status: "SUCCEEDED",
        }),
      )
    })
    it("rejects authenticated callers that do not provide the webhook API key", async () => {
      // Arrange
      await setupCodeBuildJob({
        arn: "build/test-id",
        startedAt: FIXED_NOW,
        userId: user.id,
      })
      const caller = getCallerWithMockGrowthbook(session, true, null)

      // Act + Assert
      await expect(
        caller.updateCodebuildWebhook({
          arn: "build/test-id",
          projectName: "test-project",
          status: "SUCCEEDED",
        }),
      ).rejects.toThrow("Invalid Webhook API key provided")
      expect(mailService.sendSuccessfulPublishEmail).not.toHaveBeenCalled()
    })
    it("it should update the codebuildjobs table when multiple resources specify the same buildId", async () => {
      // Arrange
      const { site } = await setupSite()
      const NUM_RESOURCES_WITH_SAME_BUILD_ID = 3
      const ARN = "build/test-id"
      const buildId = buildIdFromArn(ARN)!
      // create another 2 builds with the same buildId to simulate multiple resources being published with the same build
      // NOTE: these don't have to be for the same site
      for (let i = 0; i < NUM_RESOURCES_WITH_SAME_BUILD_ID; i++) {
        // oxlint-disable-next-line eslint/no-await-in-loop -- sequential integration setup
        await setupCodeBuildJob({
          arn: ARN,
          isScheduled: true,
          permalink: `test-page-${i}`,
          // so that the resource is unique
          siteId: site.id,
          startedAt: FIXED_NOW,
          userId: user.id,
        })
      }
      const caller = getCallerWithMockGrowthbook(session)

      // Act
      await caller.updateCodebuildWebhook({
        arn: "build/test-id",
        // saved in the db
        projectName: "test-project",
        status: "SUCCEEDED",
      })

      // Assert
      expect(mailService.sendSuccessfulPublishEmail).toHaveBeenCalledTimes(
        NUM_RESOURCES_WITH_SAME_BUILD_ID,
      )
      // check the codebuildjobs table to see if the status has been updated for all the jobs with the same buildId
      const jobs = await db
        .selectFrom("CodeBuildJobs")
        .where("buildId", "=", buildId)
        .selectAll()
        .execute()

      expect(jobs.length).toBe(NUM_RESOURCES_WITH_SAME_BUILD_ID)
      jobs.forEach((job) => {
        expect(job.status).toBe("SUCCEEDED")
        expect(job.emailSent).toBe(true)
      })
    })
    it("it should update the codebuildjobs table if the received build status is failed", async () => {
      // Arrange
      const { page, codebuildJob } = await setupCodeBuildJob({
        arn: "build/test-id",
        isScheduled: true,
        startedAt: FIXED_NOW,
        userId: user.id,
      })
      const caller = getCallerWithMockGrowthbook(session)

      // Act
      await caller.updateCodebuildWebhook({
        arn: "build/test-id",
        // saved in the db
        projectName: "test-project",
        status: "FAILED",
      })

      // Assert
      expect(mailService.sendFailedPublishEmail).toHaveBeenCalledOnce()
      expect(mailService.sendFailedPublishEmail).toHaveBeenCalledWith({
        isScheduled: true,
        recipientEmail: user.email,
        resource: expect.objectContaining(page),
      })
      // check the codebuildjobs table to see if the status has been updated
      const job = await db
        .selectFrom("CodeBuildJobs")
        .where("buildId", "=", codebuildJob.buildId)
        .selectAll()
        .executeTakeFirstOrThrow()

      // expect the job status to be updated to SUCCEEDED, and emailSent to be true
      expect(job).toEqual(
        expect.objectContaining({
          emailSent: true,
          status: "FAILED",
        }),
      )
    })
    it("do not send an email if the the email has already been sent", async () => {
      // Arrange
      await setupCodeBuildJob({
        arn: "build/test-id",
        emailSent: true,
        // email already sent
        isScheduled: true,
        startedAt: FIXED_NOW,
        status: "SUCCEEDED",
        // initial status is SUCCEEDED
        userId: user.id,
      })
      const caller = getCallerWithMockGrowthbook(session)

      // Act
      await caller.updateCodebuildWebhook({
        arn: "build/test-id",
        projectName: "test-project",
        status: "SUCCEEDED",
        // same status as before
      })

      // Assert
      expect(mailService.sendSuccessfulPublishEmail).not.toHaveBeenCalled()
    })
    it("sends a success email with the correct isScheduled flag", async () => {
      // Arrange
      const { page } = await setupCodeBuildJob({
        arn: "build/test-id",
        isScheduled: false,
        // not a scheduled publish
        startedAt: FIXED_NOW,
        status: "IN_PROGRESS",
        userId: user.id,
      })
      const caller = getCallerWithMockGrowthbook(session)

      // Act
      await caller.updateCodebuildWebhook({
        arn: "build/test-id",
        projectName: "test-project",
        status: "SUCCEEDED",
      })

      // Assert
      expect(mailService.sendSuccessfulPublishEmail).toHaveBeenCalledOnce()
      expect(mailService.sendSuccessfulPublishEmail).toHaveBeenCalledWith({
        isScheduled: false,
        recipientEmail: user.email,
        resource: expect.objectContaining(page),
      })
    })
    it("sends a failure email with the correct isScheduled flag", async () => {
      // Arrange
      const { page } = await setupCodeBuildJob({
        arn: "build/test-id",
        isScheduled: false,
        // not a scheduled publish
        startedAt: FIXED_NOW,
        status: "IN_PROGRESS",
        userId: user.id,
      })
      const caller = getCallerWithMockGrowthbook(session)

      // Act
      await caller.updateCodebuildWebhook({
        arn: "build/test-id",
        projectName: "test-project",
        status: "FAILED",
      })

      // Assert
      expect(mailService.sendFailedPublishEmail).toHaveBeenCalledOnce()
      expect(mailService.sendFailedPublishEmail).toHaveBeenCalledWith({
        isScheduled: false,
        recipientEmail: user.email,
        resource: expect.objectContaining(page),
      })
    })
    it("does not send a success email if the feature flag is disabled", async () => {
      // Arrange
      await setupCodeBuildJob({
        arn: "build/test-id",
        isScheduled: true,
        startedAt: FIXED_NOW,
        status: "IN_PROGRESS",
        userId: user.id,
      })
      const caller = getCallerWithMockGrowthbook(session, false)
      // feature flag disabled

      // Act
      await caller.updateCodebuildWebhook({
        arn: "build/test-id",
        projectName: "test-project",
        status: "SUCCEEDED",
      })

      // Assert
      expect(mailService.sendSuccessfulPublishEmail).not.toHaveBeenCalled()
    })
    it("does not send a failure email if the feature flag is disabled", async () => {
      // Arrange
      await setupCodeBuildJob({
        arn: "build/test-id",
        isScheduled: true,
        startedAt: FIXED_NOW,
        status: "IN_PROGRESS",
        userId: user.id,
      })
      const caller = getCallerWithMockGrowthbook(session, false)
      // feature flag disabled

      // Act
      await caller.updateCodebuildWebhook({
        arn: "build/test-id",
        projectName: "test-project",
        status: "FAILED",
      })

      // Assert
      expect(mailService.sendFailedPublishEmail).not.toHaveBeenCalled()
    })
    it("sends a success email to multiple users if multiple builds are superseded by the same build id", async () => {
      // Arrange
      const NUMBER_SUPERSEDED_BUILDS = 4

      const { codebuildJob, page: pageForMainBuild } = await setupCodeBuildJob({
        arn: "build/test-id",
        isScheduled: true,
        startedAt: FIXED_NOW,
        status: "IN_PROGRESS",
        userId: user.id,
      })
      // create 4 more builds that are superseded by the above build, but belong to a different user
      const { page: pageForSupersededBuild } = await setupPageResource({
        resourceType: "Page",
      })
      const userForSupersededBuilds = await setupUser({})
      await createSupersededBuildRows({
        numberOfSupersededBuilds: NUMBER_SUPERSEDED_BUILDS,
        resourceId: pageForSupersededBuild.id,
        supersedingBuild: codebuildJob,
        userId: userForSupersededBuilds.id,
      })
      const caller = getCallerWithMockGrowthbook(session)

      // Act
      await caller.updateCodebuildWebhook({
        arn: "build/test-id",
        projectName: "test-project",
        status: "SUCCEEDED",
      })

      // Assert
      expect(mailService.sendSuccessfulPublishEmail).toHaveBeenCalledTimes(5)
      // once for the original build + 4 for the superseded builds
      const { calls } = vi.mocked(mailService.sendSuccessfulPublishEmail).mock
      // check that an email was sent to the original user
      const callsWithOriginalUser = calls
        .map(([arg]) => arg)
        .filter((call) => call.recipientEmail === user.email)
      // check that emails were sent to the user with the superseded builds
      const callsWithSupersededUser = calls
        .map(([arg]) => arg)
        .filter((call) => call.recipientEmail === userForSupersededBuilds.email)
      expect(callsWithOriginalUser.length).toEqual(1)
      expect(callsWithSupersededUser.length).toEqual(NUMBER_SUPERSEDED_BUILDS)
      // assert that the calls contain the correct parameters
      callsWithOriginalUser.forEach((call) => {
        expect(call).toEqual({
          isScheduled: codebuildJob.isScheduled,
          recipientEmail: user.email,
          resource: expect.objectContaining(pageForMainBuild),
        })
      })
      callsWithSupersededUser.forEach((call) => {
        expect(call).toEqual({
          isScheduled: codebuildJob.isScheduled,
          recipientEmail: userForSupersededBuilds.email,
          resource: expect.objectContaining(pageForSupersededBuild),
        })
      })
      // check that the codebuild job is updated with the emailSent flag
      const updatedCodebuildJob = await db
        .selectFrom("CodeBuildJobs")
        .selectAll()
        .execute()
      expect(updatedCodebuildJob.length).toBe(NUMBER_SUPERSEDED_BUILDS + 1)
      // +1 for the original build
      updatedCodebuildJob.forEach((job) => {
        expect(job.emailSent).toBe(true)
        // all jobs should have emailSent = true
      })
    })
    it("does not send an email if the publish is a site-level publish", async () => {
      // Arrange
      const { codebuildJob } = await setupCodeBuildJob({
        arn: "build/test-id",
        isScheduled: true,
        omitResourceId: true,
        // this will create a codebuild job without a resourceId, simulating a site publish
        startedAt: FIXED_NOW,
        userId: user.id,
      })
      const caller = getCallerWithMockGrowthbook(session)

      // Act
      await caller.updateCodebuildWebhook({
        arn: "build/test-id",
        // saved in the db
        projectName: "test-project",
        status: "SUCCEEDED",
      })

      // Assert
      expect(mailService.sendSuccessfulPublishEmail).not.toHaveBeenCalled()
      // check the codebuildjobs table to see if the status has been updated
      await db
        .selectFrom("CodeBuildJobs")
        .where("buildId", "=", codebuildJob.buildId)
        .selectAll()
        .executeTakeFirstOrThrow()
        .then((job) => {
          // expect the job status to be updated to SUCCEEDED
          expect(job).toEqual(
            expect.objectContaining({
              emailSent: false,
              // emailSent should remain false
              status: "SUCCEEDED",
            }),
          )
        })
    })
  })
})
