import type { NextApiRequest, NextApiResponse } from "next"
import type { z } from "zod"
import { createMocks } from "node-mocks-http"
import { resetTables } from "tests/integration/helpers/db"
import { createTestUser } from "tests/integration/helpers/iron-session"
import { setupCodeBuildJob, setupUser } from "tests/integration/helpers/seed"

import type { codeBuildWebhookSchema } from "../webhook"
import handler from "~/pages/api/webhooks/updateCodebuildWebhook"

vi.mock("~/env.mjs", async () => {
  // Import the real module first to get all default values
  const actual = await vi.importActual("~/env.mjs")
  return {
    env: {
      ...actual,
      // override some env variables for testing
      WEBHOOK_API_KEY: "test-webhook-api-key",
      GROWTHBOOK_CLIENT_KEY: "test-growthbook-client-key",
    },
  }
})

// Mock the publishSite function to avoid sending emails
vi.mock("~/features/mail/service", () => ({
  sendSuccessfulScheduledPublishEmail: vi.fn(),
  sendFailedSchedulePublishEmail: vi.fn(),
}))

const createMockRequest = ({
  siteId,
  buildId,
  apiKey = "test-webhook-api-key",
}: {
  siteId: number
  buildId: string
  apiKey?: string
}) => {
  const body: z.infer<typeof codeBuildWebhookSchema> = {
    projectName: "test-project",
    siteId,
    buildId,
    buildStatus: "SUCCEEDED",
  }
  const { req, res }: { req: NextApiRequest; res: NextApiResponse } =
    createMocks({
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": apiKey,
      },
      body,
    })
  return { req, res }
}

describe("webhook", () => {
  beforeEach(async () => {
    await resetTables("CodeBuildJobs", "Resource", "Site")
  })
  describe("updateCodebuildWebhook", () => {
    it("should process valid webhook payload", async () => {
      // Arrange
      const user = await setupUser(createTestUser())
      const { codebuildJob, site } = await setupCodeBuildJob({
        userId: user.id,
        buildId: "test-build-id",
        startedAt: new Date(),
      })
      const { req, res } = createMockRequest({
        siteId: site.id,
        buildId: codebuildJob.buildId,
      })

      // Act
      await handler(req, res)

      // Assert
      expect(res.statusCode).toBe(200)
    })
    it("providing an incorrect API key causes a 500", async () => {
      // Arrange
      const user = await setupUser(createTestUser())
      const { codebuildJob, site } = await setupCodeBuildJob({
        userId: user.id,
        buildId: "test-build-id",
        startedAt: new Date(),
      })
      const { req, res } = createMockRequest({
        siteId: site.id,
        buildId: codebuildJob.buildId,
        apiKey: "wrong-api-key",
      })

      // Act
      await handler(req, res)

      // Assert
      expect(res.statusCode).toBe(500)
    })
  })
})
