import type { User } from "@prisma/client"
import MockDate from "mockdate"
import { auth } from "tests/integration/helpers/auth"
import { resetTables } from "tests/integration/helpers/db"
import {
  applyAuthedSession,
  createMockRequest,
} from "tests/integration/helpers/iron-session"
import { setupPageResource, setupUser } from "tests/integration/helpers/seed"

import { sendSuccessfulScheduledPublishEmail } from "~/features/mail/service"
import { createCallerFactory } from "~/server/trpc"
import { db } from "../../database"
import { webhookRouter } from "../webhook.router"

// Mock the publishSite function to avoid making actual AWS SDK calls during tests
vi.mock("~/features/mail/service", () => ({
  sendSuccessfulScheduledPublishEmail: vi.fn(),
  sendFailedSchedulePublishEmail: vi.fn(),
}))

const createCaller = createCallerFactory(webhookRouter)
const FIXED_NOW = new Date("2024-01-01T00:00:00.000Z")

// This function can be expanded to set up any necessary data for the tests
const setupCodeBuildJob = async ({
  userId,
  buildId,
}: {
  userId: string
  buildId: string
}) => {
  const { page, site } = await setupPageResource({
    resourceType: "Page",
  })
  await db
    .insertInto("CodeBuildJobs")
    .values({
      siteId: site.id,
      userId,
      buildId,
      startedAt: FIXED_NOW,
      status: "IN_PROGRESS",
    })
    .executeTakeFirstOrThrow()

  const codebuildJob = await db
    .selectFrom("CodeBuildJobs")
    .where("buildId", "=", buildId)
    .selectAll()
    .executeTakeFirstOrThrow()

  return { site, page, codebuildJob }
}

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
    it("updates the codebuildjobs table based on the received webhook", async () => {
      // Arrange
      const { site, codebuildJob } = await setupCodeBuildJob({
        userId: user.id,
        buildId: "test-build-id",
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
  })
})
