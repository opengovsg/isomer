import type { NextApiRequest, NextApiResponse } from "next"
import type { z } from "zod"
import { createMocks } from "node-mocks-http"
import { resetTables } from "tests/integration/helpers/db"
import { createTestUser } from "tests/integration/helpers/iron-session"
import { setupCodeBuildJob, setupUser } from "tests/integration/helpers/seed"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { env } from "~/env.mjs"
import * as mailService from "~/features/mail/service"
import handler from "~/pages/api/webhooks/updateCodebuildWebhook"
import { WEBHOOK_X_API_KEY_HEADER } from "~/server/trpc"

import type { codeBuildWebhookSchema } from "../webhook"

const WEBHOOK_API_KEY = "00000000-0000-4000-8000-000000000000"
const INVALID_WEBHOOK_API_KEY_WITH_EXPECTED_LENGTH =
  "11111111-1111-4111-8111-111111111111"

const createMockRequest = ({
  arn,
  apiKey = WEBHOOK_API_KEY,
}: {
  arn: string
  apiKey?: string | null
}) => {
  const body: z.input<typeof codeBuildWebhookSchema> = {
    arn,
    projectName: "test-project",
    status: "SUCCEEDED",
  }
  const headers: { "content-type": string } & Partial<
    Record<typeof WEBHOOK_X_API_KEY_HEADER, string>
  > = {
    "content-type": "application/json",
  }
  if (apiKey !== null) {
    headers[WEBHOOK_X_API_KEY_HEADER] = apiKey
  }
  const { req, res }: { req: NextApiRequest; res: NextApiResponse } =
    createMocks({
      body,
      headers,
      method: "POST",
    })
  return { req, res }
}

describe("webhook", () => {
  beforeEach(async () => {
    env.STUDIO_SSM_WEBHOOK_API_KEY = WEBHOOK_API_KEY
    env.GROWTHBOOK_CLIENT_KEY = "test-growthbook-client-key"
    vi.spyOn(mailService, "sendSuccessfulPublishEmail").mockResolvedValue()
    vi.spyOn(mailService, "sendFailedPublishEmail").mockResolvedValue()
    await resetTables("CodeBuildJobs", "Resource", "Site")
  })
  describe("updateCodebuildWebhook", () => {
    it("should process valid webhook payload", async () => {
      // Arrange
      const user = await setupUser(createTestUser())
      await setupCodeBuildJob({
        arn: "build/test-id",
        isScheduled: true,
        startedAt: new Date(),
        userId: user.id,
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
        arn: "build/test-id",
        isScheduled: true,
        startedAt: new Date(),
        userId: user.id,
      })
      const { req, res } = createMockRequest({
        apiKey: "wrong-api-key",
        arn: "build/test-id",
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
        arn: "build/test-id",
        isScheduled: true,
        startedAt: new Date(),
        userId: user.id,
      })
      const { req, res } = createMockRequest({
        apiKey: INVALID_WEBHOOK_API_KEY_WITH_EXPECTED_LENGTH,
        arn: "build/test-id",
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
        arn: "build/test-id",
        startedAt: new Date(),
        userId: user.id,
      })
      const { req, res } = createMockRequest({
        apiKey: null,
        arn: "build/test-id",
      })

      // Act
      await handler(req, res)

      // Assert
      expect(res.statusCode).toBe(401)
    })
  })
})
