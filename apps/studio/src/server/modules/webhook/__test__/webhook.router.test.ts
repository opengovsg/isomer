import type { User } from "@prisma/client"
import { TRPCError } from "@trpc/server"
import MockDate from "mockdate"
import { auth } from "tests/integration/helpers/auth"
import { resetTables } from "tests/integration/helpers/db"
import {
  applyAuthedSession,
  createMockRequest,
} from "tests/integration/helpers/iron-session"
import { setupCodeBuildJob, setupUser } from "tests/integration/helpers/seed"

import {
  sendFailedSchedulePublishEmail,
  sendSuccessfulScheduledPublishEmail,
} from "~/features/mail/service"
import { createCallerFactory } from "~/server/trpc"
import { webhookRouter } from "../webhook.router"

// Mock the publishSite function to avoid sending emails
vi.mock("~/features/mail/service", () => ({
  sendSuccessfulScheduledPublishEmail: vi.fn(),
  sendFailedSchedulePublishEmail: vi.fn(),
}))

const createCaller = createCallerFactory(webhookRouter)
const FIXED_NOW = new Date("2024-01-01T00:00:00.000Z")

describe("webhook.router", async () => {
  let caller: ReturnType<typeof createCaller>
  const session = await applyAuthedSession()
  let user: User
  beforeEach(async () => {
    vi.clearAllMocks()
    caller = createCaller(createMockRequest(session))
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
      })

      // Act
      await caller.updateCodebuildWebhook({
        projectName: "test-project",
        siteId: site.id,
        buildId: codebuildJob.buildId, // saved in the db
        buildNumber: 1,
        buildStatus: "SUCCEEDED",
      })

      // Assert
      expect(sendSuccessfulScheduledPublishEmail).toHaveBeenCalledOnce()
      expect(sendSuccessfulScheduledPublishEmail).toHaveBeenCalledWith({
        recipientEmail: user.email,
        publishTime: FIXED_NOW,
      })
    })
    it("updates the codebuildjobs table based on the received webhook - failure", async () => {
      // Arrange
      const { site, codebuildJob } = await setupCodeBuildJob({
        userId: user.id,
        buildId: "test-build-id",
        startedAt: FIXED_NOW,
      })

      // Act
      await caller.updateCodebuildWebhook({
        projectName: "test-project",
        siteId: site.id,
        buildId: codebuildJob.buildId, // saved in the db
        buildNumber: 1,
        buildStatus: "FAILED",
      })

      // Assert
      expect(sendFailedSchedulePublishEmail).toHaveBeenCalledOnce()
      expect(sendFailedSchedulePublishEmail).toHaveBeenCalledWith({
        recipientEmail: user.email,
      })
    })
    it("throws an error if the codebuild job is not found", async () => {
      // Arrange
      const { site, codebuildJob } = await setupCodeBuildJob({
        userId: user.id,
        buildId: "test-build-id",
        startedAt: FIXED_NOW,
      })

      // Act + Assert
      await expect(
        caller.updateCodebuildWebhook({
          projectName: "test-project",
          siteId: site.id,
          buildId: codebuildJob.buildId + "-incorrect", // not present in the db
          buildNumber: 1,
          buildStatus: "SUCCEEDED",
        }),
      ).rejects.toThrow(
        new TRPCError({
          code: "BAD_REQUEST",
          message: `CodeBuild job could not be found for siteId ${String(site.id)} with buildId ${String(codebuildJob.buildId + "-incorrect")}`,
        }),
      )
      expect(sendSuccessfulScheduledPublishEmail).not.toHaveBeenCalled()
    })
    it("do not send an email if the status has not changed", async () => {
      // Arrange
      const { site, codebuildJob } = await setupCodeBuildJob({
        userId: user.id,
        buildId: "test-build-id",
        buildStatus: "SUCCEEDED", // initial status is SUCCEEDED
        startedAt: FIXED_NOW,
      })

      // Act
      await caller.updateCodebuildWebhook({
        projectName: "test-project",
        siteId: site.id,
        buildId: codebuildJob.buildId,
        buildNumber: 1,
        buildStatus: "SUCCEEDED", // same status as before
      })

      // Assert
      expect(sendSuccessfulScheduledPublishEmail).not.toHaveBeenCalled()
    })
  })
})
