import type { User } from "@prisma/client"
import { AuditLogEvent, ResourceType } from "@prisma/client"
import { addSeconds } from "date-fns"
import MockDate from "mockdate"
import { auth } from "tests/integration/helpers/auth"
import { resetTables } from "tests/integration/helpers/db"
import { applyAuthedSession } from "tests/integration/helpers/iron-session"
import {
  addCodebuildProjectToSite,
  setupPageResource,
  setupPublisherPermissions,
  setupSite,
  setupUser,
} from "tests/integration/helpers/seed"

import * as codebuildService from "~/server/modules/aws/codebuild.service"
import { db } from "~/server/modules/database"
import {
  SCHEDULED_AT_TOLERANCE_SECONDS,
  SITE_PUBLISH_BUFFER_SECONDS,
} from "../constants"
import { publishScheduledResource } from "../schedule-publish"
import { sitePublishQueue } from "../site-publish"
import { getJobIdFromResourceIdAndScheduledAt } from "../utils"

vi.mock("~/server/modules/aws/utils.ts", async () => {
  const actual = await vi.importActual<
    // eslint-disable-next-line @typescript-eslint/consistent-type-imports
    typeof import("~/server/modules/aws/utils.ts")
  >("~/server/modules/aws/utils.ts")
  return {
    ...actual,
    // mock the buildChanges to always return that a new build is needed
    computeBuildChanges: vi.fn().mockResolvedValue({ isNewBuildNeeded: true }),
    // do not actually start a codebuild project
    startProjectById: vi.fn().mockResolvedValue({
      id: "test-build-id",
      startTime: new Date("2024-01-01T00:00:00.000Z"),
    }),
  }
})

const FIXED_NOW = new Date("2024-01-01T00:00:00.000Z")

describe("scheduled-publish", async () => {
  const session = await applyAuthedSession()
  let user: User
  beforeEach(async () => {
    vi.clearAllMocks()
    await resetTables(
      "AuditLog",
      "ResourcePermission",
      "Blob",
      "Version",
      "Resource",
      "Site",
      "User",
    )
    user = await setupUser({
      userId: session.userId,
      email: "test@mock.com",
      isDeleted: false,
    })
    await auth(user)
    // clear any existing jobs in the site & scheduled queues
    await sitePublishQueue.obliterate({ force: true })
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
      const scheduledAt = FIXED_NOW
      const { site, page } = await setupPageResource({
        resourceType: ResourceType.Page,
        scheduledAt,
      })
      await addCodebuildProjectToSite(site.id)
      await setupPublisherPermissions({
        userId: session.userId,
        siteId: site.id,
      })

      // Act
      await publishScheduledResource(
        "test-job-id",
        {
          resourceId: Number(page.id),
          siteId: site.id,
          userId: user.id,
          scheduledAt: scheduledAt.toISOString(),
        },
        0,
      )

      // Assert
      // expect a version to be created for the resource
      const versions = await db
        .selectFrom("Version")
        .where("resourceId", "=", page.id)
        .selectAll()
        .execute()
      expect(versions).toHaveLength(1)
      expect(versions[0]).toMatchObject({
        resourceId: page.id,
        versionNum: 1,
      })

      // expect the scheduledAt field to be cleared in the resource table
      const resource = await db
        .selectFrom("Resource")
        .where("id", "=", page.id)
        .selectAll()
        .executeTakeFirstOrThrow()
      expect(resource.scheduledAt).toBeNull()
      // expect the codebuildjobs table to be updated correctly
      const codebuildjobs = await db
        .selectFrom("CodeBuildJobs")
        .where("buildId", "is", null)
        .where("siteId", "=", site.id)
        .selectAll()
        .execute()
      expect(codebuildjobs).toHaveLength(1)
      const [codebuildjob] = codebuildjobs
      expect(codebuildjob).toMatchObject({
        siteId: site.id,
        userId: user.id,
        startedAt: null,
        status: "PENDING",
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
      })
    })
    it("does not publish the resource IF the scheduledAt time is outside the buffer", async () => {
      // Arrange
      const scheduledAt = addSeconds(
        FIXED_NOW,
        SCHEDULED_AT_TOLERANCE_SECONDS + 1,
      ) // beyond the buffer
      const { site, page } = await setupPageResource({
        resourceType: ResourceType.Page,
        scheduledAt,
      })
      await addCodebuildProjectToSite(site.id)
      await setupPublisherPermissions({
        userId: session.userId,
        siteId: site.id,
      })

      // Act
      const res = await publishScheduledResource(
        "test-job-id",
        {
          resourceId: Number(page.id),
          siteId: site.id,
          userId: user.id,
          scheduledAt: scheduledAt.toISOString(),
        },
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
      const scheduledAt = addSeconds(
        FIXED_NOW,
        SCHEDULED_AT_TOLERANCE_SECONDS + 1,
      )
      const { site, page } = await setupPageResource({
        resourceType: ResourceType.Page,
        scheduledAt,
      })
      await addCodebuildProjectToSite(site.id)
      await setupPublisherPermissions({
        userId: session.userId,
        siteId: site.id,
      })
      const previousVersions = await db
        .selectFrom("Version")
        .where("resourceId", "=", page.id)
        .select("Version.versionNum")
        .execute()

      // Act
      await publishScheduledResource(
        "test-job-id",
        {
          resourceId: Number(page.id),
          siteId: site.id,
          userId: user.id,
          scheduledAt: scheduledAt.toISOString(),
        },
        1, // previous attempts
      )

      // Assert
      // expect a version to be created for the resource
      const versions = await db
        .selectFrom("Version")
        .where("resourceId", "=", page.id)
        .selectAll()
        .execute()

      expect(previousVersions).toHaveLength(0)
      expect(versions).toHaveLength(1)
      expect(versions[0]).toMatchObject({
        resourceId: page.id,
        versionNum: 1,
      })
    })
    it("fails to publish the resource if the user does not have the right permissions when the job executes", async () => {
      // Arrange
      const scheduledAt = FIXED_NOW
      const { site, page } = await setupPageResource({
        resourceType: ResourceType.Page,
        scheduledAt: FIXED_NOW,
      })

      // Act + Assert
      await expect(
        publishScheduledResource(
          "test-job-id",
          {
            resourceId: Number(page.id),
            siteId: site.id,
            userId: user.id,
            scheduledAt: scheduledAt.toISOString(),
          },
          0,
        ),
      ).rejects.toThrowError(
        "You do not have sufficient permissions to perform this action",
      )
    })
    it("pushes a job onto the site publish queue if the page publish succeeds", async () => {
      // Arrange
      const scheduledAt = FIXED_NOW
      const { site, page } = await setupPageResource({
        resourceType: ResourceType.Page,
        scheduledAt,
      })
      await addCodebuildProjectToSite(site.id)
      await setupPublisherPermissions({
        userId: session.userId,
        siteId: site.id,
      })

      // Act
      await publishScheduledResource(
        "test-job-id",
        {
          resourceId: Number(page.id),
          siteId: site.id,
          userId: user.id,
          scheduledAt: scheduledAt.toISOString(),
        },
        0, // previous attempts
      )

      // Assert
      // The site has NOT been published yet
      const publishSiteSpy = vi.spyOn(codebuildService, "publishSite")
      expect(publishSiteSpy).not.toHaveBeenCalled()
      // but a job has been added to the site publish queue with a delay of SITE_PUBLISH_BUFFER_SECONDS
      const job = await sitePublishQueue.getJob(
        getJobIdFromResourceIdAndScheduledAt(site.id.toString(), scheduledAt),
      )
      expect(job!.data).toEqual({
        siteId: site.id,
      })
      expect(job!.opts.delay).toBeCloseTo(
        SITE_PUBLISH_BUFFER_SECONDS * 1000,
        -3, // rounding to the nearest second (3 decimal places)
      )
    })
    it("does not push a job onto the site publish queue if the site does not have a codebuild project", async () => {
      // Arrange
      const scheduledAt = FIXED_NOW
      const { site, page } = await setupPageResource({
        resourceType: ResourceType.Page,
        scheduledAt,
      })
      await setupPublisherPermissions({
        userId: session.userId,
        siteId: site.id,
      })

      // Act
      await publishScheduledResource(
        "test-job-id",
        {
          resourceId: Number(page.id),
          siteId: site.id,
          userId: user.id,
          scheduledAt: scheduledAt.toISOString(),
        },
        0, // previous attempts
      )

      // Assert
      const job = await sitePublishQueue.getJob(
        getJobIdFromResourceIdAndScheduledAt(site.id.toString(), scheduledAt),
      )
      expect(job).not.toBeDefined()
    })
    it("publishing many resources for the same site only creates ONE site publish job", async () => {
      // Arrange
      const scheduledAt = FIXED_NOW
      const { site } = await setupSite()
      await addCodebuildProjectToSite(site.id)
      const PAGES_TO_PUBLISH = 5
      const pageIds: string[] = []
      for (let i = 0; i < PAGES_TO_PUBLISH; i++) {
        const { page } = await setupPageResource({
          resourceType: ResourceType.Page,
          scheduledAt,
          siteId: site.id,
          permalink: `page-${i}`, // ensure unique permalinks
        })
        pageIds.push(page.id)
      }
      await setupPublisherPermissions({
        userId: session.userId,
        siteId: site.id,
      })

      // Act - publish all the pages
      await Promise.all(
        pageIds.map((pageId) =>
          publishScheduledResource(
            "test-job-id",
            {
              resourceId: Number(pageId),
              siteId: site.id,
              userId: user.id,
              scheduledAt: scheduledAt.toISOString(),
            },
            0, // previous attempts
          ),
        ),
      )

      // Assert
      const allJobs = await sitePublishQueue.getJobs()
      expect(allJobs).toHaveLength(1)
      const [job] = allJobs
      expect(job!.data).toEqual({
        siteId: site.id,
      })
      expect(job!.opts.delay).toBeCloseTo(
        SITE_PUBLISH_BUFFER_SECONDS * 1000,
        -3, // rounding to the nearest second (3 decimal places)
      )
    })
  })
})
