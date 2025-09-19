import type { User } from "@prisma/client"
import { AuditLogEvent, ResourceType } from "@prisma/client"
import { addSeconds } from "date-fns"
import MockDate from "mockdate"
import { auth } from "tests/integration/helpers/auth"
import { resetTables } from "tests/integration/helpers/db"
import { applyAuthedSession } from "tests/integration/helpers/iron-session"
import {
  setupPageResource,
  setupPublisherPermissions,
  setupUser,
} from "tests/integration/helpers/seed"

import { db } from "~/server/modules/database"
import {
  BUFFER_IN_SECONDS,
  publishScheduledResource,
} from "../schedule-publish"

// Mock the publishSite function to avoid making actual AWS SDK calls during tests
vi.mock("~/server/modules/aws/codebuild.service.ts", () => ({
  publishSite: vi.fn().mockResolvedValue({
    startedBuild: {
      id: "started-test-id",
      startTime: new Date("2024-01-01T00:00:00.000Z"),
    },
    stoppedBuild: { id: "stopped-test-id" },
  }),
}))

const FIXED_NOW = new Date("2024-01-01T00:00:00.000Z")

describe("scheduled-publish", async () => {
  const session = await applyAuthedSession()
  let user: User
  beforeEach(async () => {
    vi.clearAllMocks()
    await resetTables(
      "Resource",
      "User",
      "ResourcePermission",
      "Version",
      "AuditLog",
      "CodeBuildJobs",
    )
    user = await setupUser({
      userId: session.userId,
      email: "test@mock.com",
      isDeleted: false,
    })
    await auth(user)
  })

  describe("publishScheduledResource", () => {
    beforeEach(() => {
      MockDate.set(FIXED_NOW) // Freeze time before each test
    })
    afterEach(() => {
      MockDate.reset() // Reset time after each test
    })
    it("publishes a resource and updates the codebuildjobs table", async () => {
      // Arrange
      const { site, page } = await setupPageResource({
        resourceType: ResourceType.Page,
        scheduledAt: FIXED_NOW,
      })
      await setupPublisherPermissions({
        userId: session.userId,
        siteId: site.id,
      })

      // Act
      const res = await publishScheduledResource(
        "test-job-id",
        { resourceId: Number(page.id), siteId: site.id, userId: user.id },
        0,
      )

      // Assert
      // expect a version to be created
      expect(String(res?.versionId)).toEqual("1")
      expect(String(res?.versionNum)).toEqual("1")
      // expect the scheduledAt field to be cleared in the resource table
      const resource = await db
        .selectFrom("Resource")
        .where("id", "=", page.id)
        .selectAll()
        .executeTakeFirstOrThrow()
      expect(resource.scheduledAt).toBeNull()
      // expect the codebuildjobs table to be updated with the new build
      const codebuildjobs = await db
        .selectFrom("CodeBuildJobs")
        .where("siteId", "=", site.id)
        .selectAll()
        .execute()
      expect(codebuildjobs).toHaveLength(1)
      expect(codebuildjobs[0]).toMatchObject({
        siteId: site.id,
        userId: user.id,
        buildId: "started-test-id",
        startedAt: FIXED_NOW,
        status: "IN_PROGRESS",
      })
      // expect the audit log to be created with the correct info
      const auditLogs = await db
        .selectFrom("AuditLog")
        .where("siteId", "=", site.id)
        .selectAll()
        .execute()
      expect(auditLogs).toHaveLength(1)
      expect(auditLogs[0]).toMatchObject({
        siteId: site.id,
        userId: user.id,
        eventType: AuditLogEvent.Publish,
        delta: { after: res, before: null },
      })
    })
    it("does not publish the resource IF the scheduledAt time is outside the buffer", async () => {
      // Arrange
      const { site, page } = await setupPageResource({
        resourceType: ResourceType.Page,
        scheduledAt: addSeconds(FIXED_NOW, BUFFER_IN_SECONDS + 1), // beyond the buffer
      })
      await setupPublisherPermissions({
        userId: session.userId,
        siteId: site.id,
      })

      // Act
      const res = await publishScheduledResource(
        "test-job-id",
        { resourceId: Number(page.id), siteId: site.id, userId: user.id },
        0,
      )

      // Assert
      // expect no version to be created
      expect(res).toBeUndefined()
      // expect the scheduledAt field to still be set in the resource table
      const resource = await db
        .selectFrom("Resource")
        .where("id", "=", page.id)
        .selectAll()
        .executeTakeFirstOrThrow()
      expect(resource.scheduledAt).not.toBeNull()
      // expect the codebuildjobs table to be empty
      const codebuildjobs = await db
        .selectFrom("CodeBuildJobs")
        .where("siteId", "=", site.id)
        .selectAll()
        .execute()
      expect(codebuildjobs).toHaveLength(0)
      // expect the audit log to not be created
      const auditLogs = await db
        .selectFrom("AuditLog")
        .where("siteId", "=", site.id)
        .selectAll()
        .execute()
      expect(auditLogs).toHaveLength(0)
    })
    it("publishes the resource IF the scheduledAt time is outside the buffer, but previous attempts have been made", async () => {
      // Arrange
      const { site, page } = await setupPageResource({
        resourceType: ResourceType.Page,
        scheduledAt: addSeconds(FIXED_NOW, BUFFER_IN_SECONDS + 1), // beyond the buffer
      })
      await setupPublisherPermissions({
        userId: session.userId,
        siteId: site.id,
      })

      // Act
      const res = await publishScheduledResource(
        "test-job-id",
        { resourceId: Number(page.id), siteId: site.id, userId: user.id },
        1, // previous attempts
      )

      // Assert
      // expect the version to be created
      expect(res).toBeDefined()
    })
    it("fails to publish the resource if the user does not have the right permissions when the job executes", async () => {
      // Arrange
      const { site, page } = await setupPageResource({
        resourceType: ResourceType.Page,
        scheduledAt: FIXED_NOW,
      })

      // Act + Assert
      await expect(
        publishScheduledResource(
          "test-job-id",
          { resourceId: Number(page.id), siteId: site.id, userId: user.id },
          0,
        ),
      ).rejects.toThrowError(
        "You do not have sufficient permissions to perform this action",
      )
    })
  })
})
