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
    it("updates the codebuildjobs table based on the received webhook - success", async () => {
      // Arrange
      const { site, codebuildJob } = await setupCodeBuildJob({
        userId: user.id,
        buildId: "test-build-id",
        startedAt: FIXED_NOW,
        isScheduled: true,
      })
      const caller = getCallerWithMockGrowthbook(session)

      // Act
      await caller.updateCodebuildWebhook({
        projectName: "test-project",
        siteId: site.id,
        buildId: codebuildJob.buildId, // saved in the db
        buildStatus: "SUCCEEDED",
      })

      // Assert
      expect(sendSuccessfulPublishEmail).toHaveBeenCalledOnce()
      expect(sendSuccessfulPublishEmail).toHaveBeenCalledWith({
        recipientEmail: user.email,
        publishTime: FIXED_NOW,
        isScheduled: true,
      })
    })
    it("updates the codebuildjobs table based on the received webhook - failure", async () => {
      // Arrange
      const { site, codebuildJob } = await setupCodeBuildJob({
        userId: user.id,
        buildId: "test-build-id",
        startedAt: FIXED_NOW,
        isScheduled: true,
      })
      const caller = getCallerWithMockGrowthbook(session)

      // Act
      await caller.updateCodebuildWebhook({
        projectName: "test-project",
        siteId: site.id,
        buildId: codebuildJob.buildId, // saved in the db
        buildStatus: "FAILED",
      })

      // Assert
      expect(sendFailedPublishEmail).toHaveBeenCalledOnce()
      expect(sendFailedPublishEmail).toHaveBeenCalledWith({
        isScheduled: true,
        recipientEmail: user.email,
      })
    })
    it("do not send an email if the status has not changed", async () => {
      // Arrange
      const { site, codebuildJob } = await setupCodeBuildJob({
        userId: user.id,
        buildId: "test-build-id",
        buildStatus: "SUCCEEDED", // initial status is SUCCEEDED
        startedAt: FIXED_NOW,
        isScheduled: true,
      })
      const caller = getCallerWithMockGrowthbook(session)

      // Act
      await caller.updateCodebuildWebhook({
        projectName: "test-project",
        siteId: site.id,
        buildId: codebuildJob.buildId,
        buildStatus: "SUCCEEDED", // same status as before
      })

      // Assert
      expect(sendSuccessfulPublishEmail).not.toHaveBeenCalled()
    })
    it("sends a success email with the correct isScheduled flag", async () => {
      // Arrange
      const { site, codebuildJob } = await setupCodeBuildJob({
        userId: user.id,
        buildId: "test-build-id",
        buildStatus: "IN_PROGRESS",
        startedAt: FIXED_NOW,
        isScheduled: false, // not a scheduled publish
      })
      const caller = getCallerWithMockGrowthbook(session)

      // Act
      await caller.updateCodebuildWebhook({
        projectName: "test-project",
        siteId: site.id,
        buildId: codebuildJob.buildId,
        buildStatus: "SUCCEEDED",
      })

      // Assert
      expect(sendSuccessfulPublishEmail).toHaveBeenCalledOnce()
      expect(sendSuccessfulPublishEmail).toHaveBeenCalledWith({
        recipientEmail: user.email,
        publishTime: FIXED_NOW,
        isScheduled: false,
      })
    })
    it("sends a failure email with the correct isScheduled flag", async () => {
      // Arrange
      const { site, codebuildJob } = await setupCodeBuildJob({
        userId: user.id,
        buildId: "test-build-id",
        buildStatus: "IN_PROGRESS",
        startedAt: FIXED_NOW,
        isScheduled: false, // not a scheduled publish
      })
      const caller = getCallerWithMockGrowthbook(session)

      // Act
      await caller.updateCodebuildWebhook({
        projectName: "test-project",
        siteId: site.id,
        buildId: codebuildJob.buildId,
        buildStatus: "FAILED",
      })

      // Assert
      expect(sendFailedPublishEmail).toHaveBeenCalledOnce()
      expect(sendFailedPublishEmail).toHaveBeenCalledWith({
        recipientEmail: user.email,
        isScheduled: false,
      })
    })
    it("does not send a success email if the feature flag is disabled", async () => {
      // Arrange
      const { site, codebuildJob } = await setupCodeBuildJob({
        userId: user.id,
        buildId: "test-build-id",
        buildStatus: "IN_PROGRESS",
        startedAt: FIXED_NOW,
        isScheduled: true,
      })
      const caller = getCallerWithMockGrowthbook(session, false) // feature flag disabled

      // Act
      await caller.updateCodebuildWebhook({
        projectName: "test-project",
        siteId: site.id,
        buildId: codebuildJob.buildId,
        buildStatus: "SUCCEEDED",
      })

      // Assert
      expect(sendSuccessfulPublishEmail).not.toHaveBeenCalled()
    })
    it("does not send a failure email if the feature flag is disabled", async () => {
      // Arrange
      const { site, codebuildJob } = await setupCodeBuildJob({
        userId: user.id,
        buildId: "test-build-id",
        buildStatus: "IN_PROGRESS",
        startedAt: FIXED_NOW,
        isScheduled: true,
      })
      const caller = getCallerWithMockGrowthbook(session, false) // feature flag disabled

      // Act
      await caller.updateCodebuildWebhook({
        projectName: "test-project",
        siteId: site.id,
        buildId: codebuildJob.buildId,
        buildStatus: "FAILED",
      })

      // Assert
      expect(sendFailedPublishEmail).not.toHaveBeenCalled()
    })
  })
})
