import type { NextApiRequest, NextApiResponse } from "next"
import type { z } from "zod"
import type { env } from "~/env.mjs"
import { createMocks } from "node-mocks-http"
import { resetTables } from "tests/integration/helpers/db"
import { createTestUser } from "tests/integration/helpers/iron-session"
import { setupCodeBuildJob, setupUser } from "tests/integration/helpers/seed"
import handler from "~/pages/api/webhooks/updateCodebuildWebhook"
import { WEBHOOK_X_API_KEY_HEADER } from "~/server/trpc"

import type { codeBuildWebhookSchema } from "../webhook"

const { WEBHOOK_API_KEY, INVALID_WEBHOOK_API_KEY_WITH_EXPECTED_LENGTH } =
  vi.hoisted(() => ({
    WEBHOOK_API_KEY: "00000000-0000-4000-8000-000000000000",
    INVALID_WEBHOOK_API_KEY_WITH_EXPECTED_LENGTH:
      "11111111-1111-4111-8111-111111111111",
  }))

vi.mock("~/env.mjs", async () => {
  // Import the real module first to get all default values
  const actual = await vi.importActual<{ env: typeof env }>("~/env.mjs")
  return {
    env: {
      ...actual.env,
      // override some env variables for testing
      STUDIO_SSM_WEBHOOK_API_KEY: WEBHOOK_API_KEY,
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
  arn,
  apiKey = WEBHOOK_API_KEY,
}: {
  arn: string
  apiKey?: string | null
}) => {
  const body: z.input<typeof codeBuildWebhookSchema> = {
    projectName: "test-project",
    arn,
    status: "SUCCEEDED",
  }
  const { req, res }: { req: NextApiRequest; res: NextApiResponse } =
    createMocks({
      method: "POST",
      headers: {
        "content-type": "application/json",
        ...(apiKey === null ? {} : { [WEBHOOK_X_API_KEY_HEADER]: apiKey }),
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
      await setupCodeBuildJob({
        userId: user.id,
        arn: "build/test-id",
        startedAt: new Date(),
        isScheduled: true,
      })
      const { req, res } = createMockRequest({
        arn: "build/test-id",
      })

      // Act
      await handler(req, res)

      // Assert
      expect(res.statusCode).toBe(200)
    })
    it("providing an incorrect API key causes a 401", async () => {
      // Arrange
      const user = await setupUser(createTestUser())
      await setupCodeBuildJob({
        userId: user.id,
        arn: "build/test-id",
        startedAt: new Date(),
        isScheduled: true,
      })
      const { req, res } = createMockRequest({
        arn: "build/test-id",
        apiKey: "wrong-api-key",
      })

      // Act
      await handler(req, res)

      // Assert
      expect(res.statusCode).toBe(401)
    })
    it("providing an incorrect API key with the expected length causes a 401", async () => {
      // Arrange
      const user = await setupUser(createTestUser())
      await setupCodeBuildJob({
        userId: user.id,
        arn: "build/test-id",
        startedAt: new Date(),
        isScheduled: true,
      })
      const { req, res } = createMockRequest({
        arn: "build/test-id",
        apiKey: INVALID_WEBHOOK_API_KEY_WITH_EXPECTED_LENGTH,
      })

      // Act
      await handler(req, res)

      // Assert
      expect(res.statusCode).toBe(401)
    })
    it("requests missing an API key causes a 401", async () => {
      // Arrange
      const user = await setupUser(createTestUser())
      await setupCodeBuildJob({
        userId: user.id,
        arn: "build/test-id",
        startedAt: new Date(),
      })
      const { req, res } = createMockRequest({
        arn: "build/test-id",
        apiKey: null,
      })

      // Act
      await handler(req, res)

      // Assert
      expect(res.statusCode).toBe(401)
    })
  })
})
