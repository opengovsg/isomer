import type { GrowthBook } from "@growthbook/growthbook"
import MockDate from "mockdate"
import { resetTables } from "tests/integration/helpers/db"
import { setupCodeBuildJob, setupUser } from "tests/integration/helpers/seed"

import type { User } from "../../database"
import { sendFailedPublishEmail } from "~/features/mail/service"
import { createBaseLogger } from "~/lib/logger"
import { db } from "../../database"
import { updateCodebuildStatusAndSendEmails } from "../webhook.utils"

// Mock the publishSite function to avoid sending emails
vi.mock("~/features/mail/service", () => ({
  sendSuccessfulPublishEmail: vi.fn(),
  sendFailedPublishEmail: vi.fn(),
}))

const getMockGrowthbook = (mockReturnValue = true) => {
  const mockGrowthBook: Partial<GrowthBook> = {
    isOn: vi.fn().mockReturnValue(mockReturnValue),
  }
  return mockGrowthBook as GrowthBook
}

describe("updateCodebuildStatusAndSendEmails", () => {
  let user: User
  const FIXED_NOW = new Date("2024-01-01T00:15:00.000Z")
  afterEach(() => {
    MockDate.reset() // Reset time after each test
  })
  beforeEach(async () => {
    MockDate.set(FIXED_NOW) // Freeze time before each test
    vi.clearAllMocks()
    await resetTables("CodeBuildJobs", "User", "Resource", "Site")
    user = await setupUser({})
  })
  it("when a null buildId is provided, should update codebuildjob rows and dispatch emails correctly", async () => {
    // Arrange
    const { site, page, codebuildJob } = await setupCodeBuildJob({
      userId: user.id,
      arn: null, // setup a codebuildjob with a null buildId
      startedAt: FIXED_NOW,
      isScheduled: true,
    })

    // Act
    const gb = getMockGrowthbook()
    const result = await updateCodebuildStatusAndSendEmails(
      createBaseLogger({ path: "test" }),
      gb,
      null, // pass in null buildId
      site.id,
      "FAILED",
    )

    // Assert
    const updatedCodebuildJob = await db
      .selectFrom("CodeBuildJobs")
      .selectAll()
      .where("id", "=", codebuildJob.id)
      .executeTakeFirstOrThrow()
    // Build job should be updated correctly to FAILED
    expect(updatedCodebuildJob.status).toBe("FAILED")
    expect(updatedCodebuildJob.emailSent).toBe(true)
    expect(result.codebuildJobIdsForSentEmails).toHaveLength(1)
    // The email should be sent for the codebuild job with null buildId
    expect(result.codebuildJobIdsForSentEmails[0]).toBe(codebuildJob.id)
    expect(sendFailedPublishEmail).toHaveBeenCalledWith({
      isScheduled: true,
      recipientEmail: user.email,
      resource: expect.objectContaining(page),
    })
  })
})
