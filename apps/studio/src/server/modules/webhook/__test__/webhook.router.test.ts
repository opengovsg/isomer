import type { GrowthBook } from "@growthbook/growthbook/dist/GrowthBook"
import type { User } from "@prisma/client"
import MockDate from "mockdate"
import { auth } from "tests/integration/helpers/auth"
import { resetTables } from "tests/integration/helpers/db"
import {
  applyAuthedSession,
  createMockRequest,
} from "tests/integration/helpers/iron-session"
import { setupCodeBuildJob, setupUser } from "tests/integration/helpers/seed"

import type { Session } from "~/lib/types/session"
import {
  sendFailedPublishEmail,
  sendSuccessfulPublishEmail,
} from "~/features/mail/service"
import { createCallerFactory } from "~/server/trpc"
import { db } from "../../database"
import { webhookRouter } from "../webhook.router"

// Mock the publishSite function to avoid sending emails
vi.mock("~/features/mail/service", () => ({
  sendSuccessfulPublishEmail: vi.fn(),
  sendFailedPublishEmail: vi.fn(),
}))

const getCallerWithMockGrowthbook = (
  session: Session,
  mockReturnValue = true,
): ReturnType<typeof createCaller> => {
  const mockRequest = createMockRequest(session)
  const mockGrowthBook: Partial<GrowthBook> = {
    isOn: vi.fn().mockReturnValue(mockReturnValue),
  }
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
    await resetTables("CodeBuildJobs", "User", "Resource", "Site")
    user = await setupUser({
      userId: session.userId,
      email: "test@mock.com",
      isDeleted: false,
    })
    await auth(user)
  })

  describe("updateCodebuildWebhook", () => {
    beforeEach(() => {
      MockDate.set(FIXED_NOW) // Freeze time before each test
    })
    afterEach(() => {
      MockDate.reset() // Reset time after each test
    })
    it("it should update the codebuildjobs table if the received build status is successful", async () => {
      // Arrange
      const { site, page, codebuildJob } = await setupCodeBuildJob({
        userId: user.id,
        arn: "build/test-id",
        startedAt: FIXED_NOW,
        isScheduled: true,
      })
      const caller = getCallerWithMockGrowthbook(session)

      // Act
      await caller.updateCodebuildWebhook({
        projectName: "test-project",
        siteId: site.id,
        arn: "build/test-id", // saved in the db
        buildStatus: "SUCCEEDED",
      })

      // Assert
      expect(sendSuccessfulPublishEmail).toHaveBeenCalledOnce()
      expect(sendSuccessfulPublishEmail).toHaveBeenCalledWith({
        recipientEmail: user.email,
        publishTime: FIXED_NOW,
        isScheduled: true,
        title: page.title,
      })

      // check the codebuildjobs table to see if the status has been updated
      const job = await db
        .selectFrom("CodeBuildJobs")
        .where("buildId", "=", codebuildJob.buildId)
        .selectAll()
        .executeTakeFirstOrThrow()

      expect(job).toEqual(
        expect.objectContaining({
          status: "SUCCEEDED",
          emailSent: true,
        }),
      )
    })
    it("it should update the codebuildjobs table if the received build status is failed", async () => {
      // Arrange
      const { site, page, codebuildJob } = await setupCodeBuildJob({
        userId: user.id,
        arn: "build/test-id",
        startedAt: FIXED_NOW,
        isScheduled: true,
      })
      const caller = getCallerWithMockGrowthbook(session)

      // Act
      await caller.updateCodebuildWebhook({
        projectName: "test-project",
        siteId: site.id,
        arn: "build/test-id", // saved in the db
        buildStatus: "FAILED",
      })

      // Assert
      expect(sendFailedPublishEmail).toHaveBeenCalledOnce()
      expect(sendFailedPublishEmail).toHaveBeenCalledWith({
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
          status: "FAILED",
          emailSent: true,
        }),
      )
    })
    it("do not send an email if the the email has already been sent", async () => {
      // Arrange
      const { site } = await setupCodeBuildJob({
        userId: user.id,
        arn: "build/test-id",
        buildStatus: "SUCCEEDED", // initial status is SUCCEEDED
        startedAt: FIXED_NOW,
        emailSent: true, // email already sent
        isScheduled: true,
      })
      const caller = getCallerWithMockGrowthbook(session)

      // Act
      await caller.updateCodebuildWebhook({
        projectName: "test-project",
        siteId: site.id,
        arn: "build/test-id",
        buildStatus: "SUCCEEDED", // same status as before
      })

      // Assert
      expect(sendSuccessfulPublishEmail).not.toHaveBeenCalled()
    })
    it("sends a success email with the correct isScheduled flag", async () => {
      // Arrange
      const { site, page } = await setupCodeBuildJob({
        userId: user.id,
        arn: "build/test-id",
        buildStatus: "IN_PROGRESS",
        startedAt: FIXED_NOW,
        isScheduled: false, // not a scheduled publish
      })
      const caller = getCallerWithMockGrowthbook(session)

      // Act
      await caller.updateCodebuildWebhook({
        projectName: "test-project",
        siteId: site.id,
        arn: "build/test-id",
        buildStatus: "SUCCEEDED",
      })

      // Assert
      expect(sendSuccessfulPublishEmail).toHaveBeenCalledOnce()
      expect(sendSuccessfulPublishEmail).toHaveBeenCalledWith({
        recipientEmail: user.email,
        publishTime: FIXED_NOW,
        isScheduled: false,
        title: page.title,
      })
    })
    it("sends a failure email with the correct isScheduled flag", async () => {
      // Arrange
      const { site, page } = await setupCodeBuildJob({
        userId: user.id,
        arn: "build/test-id",
        buildStatus: "IN_PROGRESS",
        startedAt: FIXED_NOW,
        isScheduled: false, // not a scheduled publish
      })
      const caller = getCallerWithMockGrowthbook(session)

      // Act
      await caller.updateCodebuildWebhook({
        projectName: "test-project",
        siteId: site.id,
        arn: "build/test-id",
        buildStatus: "FAILED",
      })

      // Assert
      expect(sendFailedPublishEmail).toHaveBeenCalledOnce()
      expect(sendFailedPublishEmail).toHaveBeenCalledWith({
        recipientEmail: user.email,
        isScheduled: false,
        resource: expect.objectContaining(page),
      })
    })
    it("does not send a success email if the feature flag is disabled", async () => {
      // Arrange
      const { site } = await setupCodeBuildJob({
        userId: user.id,
        arn: "build/test-id",
        buildStatus: "IN_PROGRESS",
        startedAt: FIXED_NOW,
        isScheduled: true,
      })
      const caller = getCallerWithMockGrowthbook(session, false) // feature flag disabled

      // Act
      await caller.updateCodebuildWebhook({
        projectName: "test-project",
        siteId: site.id,
        arn: "build/test-id",
        buildStatus: "SUCCEEDED",
      })

      // Assert
      expect(sendSuccessfulPublishEmail).not.toHaveBeenCalled()
    })
    it("does not send a failure email if the feature flag is disabled", async () => {
      // Arrange
      const { site } = await setupCodeBuildJob({
        userId: user.id,
        arn: "build/test-id",
        buildStatus: "IN_PROGRESS",
        startedAt: FIXED_NOW,
        isScheduled: true,
      })
      const caller = getCallerWithMockGrowthbook(session, false) // feature flag disabled

      // Act
      await caller.updateCodebuildWebhook({
        projectName: "test-project",
        siteId: site.id,
        arn: "build/test-id",
        buildStatus: "FAILED",
      })

      // Assert
      expect(sendFailedPublishEmail).not.toHaveBeenCalled()
    })
  })
})
