import type { MockInstance } from "vitest"
import type { User } from "~prisma/generated/prisma/client"
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
import {
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest"
import * as emailService from "~/features/mail/service"
import * as awsUtils from "~/server/modules/aws/utils"
import { db } from "~/server/modules/database"
import * as publishPageResourceModule from "~/server/modules/resource/resource.service"
import { AuditLogEvent, ResourceType } from "~prisma/generated/prisma/client"

import {
  publishScheduledResources,
  publishScheduledSites,
} from "../schedulePublishingJob"

const addCodebuildProjectToSite = async (siteId: number) => {
  await db
    .updateTable("Site")
    .set({ codeBuildId: "test-codebuild-project-id" })
    .where("id", "=", siteId)
    .execute()
}

const FIXED_NOW = new Date("2024-01-01T00:00:00.000Z")

const getVersionsForResource = (resourceId: string) =>
  db
    .selectFrom("Version")
    .where("resourceId", "=", resourceId)
    .selectAll()
    .execute()

const getAuditLogsForSite = (siteId: number) =>
  db.selectFrom("AuditLog").where("siteId", "=", siteId).selectAll().execute()

type SetupPageResourceResult = Awaited<ReturnType<typeof setupPageResource>>
type PublishScheduledResourcesResult = Awaited<
  ReturnType<typeof publishScheduledResources>
>
type VersionRows = Awaited<ReturnType<typeof getVersionsForResource>>
type AuditLogRows = Awaited<ReturnType<typeof getAuditLogsForSite>>

describe("schedulePublishingJob", async () => {
  const session = await applyAuthedSession()
  let user: User
  beforeEach(async () => {
    vi.restoreAllMocks()
    MockDate.set(FIXED_NOW) // Freeze time before each test
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
  })

  afterEach(() => {
    MockDate.reset() // Reset time after each test
  })

  describe("schedulePublishJobHandler", () => {
    describe("publishes a resource which has scheduledAt less than current run time", () => {
      let site: SetupPageResourceResult["site"]
      let page: SetupPageResourceResult["page"]
      let resourceSiteMap: PublishScheduledResourcesResult
      let versions: VersionRows
      let auditLogs: AuditLogRows

      beforeAll(async () => {
        // Arrange
        ;({ site, page } = await setupPageResource({
          resourceType: ResourceType.Page,
          scheduledAt: FIXED_NOW,
          scheduledBy: session.userId,
        }))
        await setupPublisherPermissions({
          userId: session.userId,
          siteId: site.id,
        })

        // Act
        resourceSiteMap = await publishScheduledResources(true, FIXED_NOW)

        versions = await getVersionsForResource(String(page.id))

        auditLogs = await getAuditLogsForSite(site.id)
      })

      it("creates a version for the published resource", () => {
        expect(versions).toHaveLength(1)
        expect(versions[0]).toMatchObject({
          resourceId: page.id,
          versionNum: 1,
        })
      })

      it("creates an audit log for the publish action", () => {
        expect(auditLogs).toHaveLength(1)
        expect(auditLogs[0]).toMatchObject({
          siteId: site.id,
          userId: user.id,
          eventType: AuditLogEvent.Publish,
        })
      })

      it("includes the site and resource in the resourceSiteMap", () => {
        expect(resourceSiteMap[site.id]).toBeDefined()
        expect(resourceSiteMap[site.id]?.[0]!.id).toBe(page.id)
      })
    })

    it("does not publish a resource if scheduledAt time is in the future", async () => {
      // Arrange
      const { site, page } = await setupPageResource({
        resourceType: ResourceType.Page,
        scheduledAt: addSeconds(FIXED_NOW, 10),
        scheduledBy: session.userId,
      })
      await setupPublisherPermissions({
        userId: session.userId,
        siteId: site.id,
      })

      // Act
      await publishScheduledResources(true, FIXED_NOW)

      // Assert
      // expect a version to be created for the resource, since the resource is published
      const versions = await db
        .selectFrom("Version")
        .where("resourceId", "=", page.id)
        .selectAll()
        .execute()

      expect(versions).toHaveLength(0)
    })

    it("throwing an error when publishing a resource sends failed publish email", async () => {
      // Arrange
      const { site, page } = await setupPageResource({
        resourceType: ResourceType.Page,
        scheduledAt: FIXED_NOW,
        scheduledBy: session.userId,
      })
      await setupPublisherPermissions({
        userId: session.userId,
        siteId: site.id,
      })
      // mock the publishPageResource to throw an error to simulate failure
      vi.spyOn(
        publishPageResourceModule,
        "publishPageResource",
      ).mockImplementation(() => {
        throw new Error("Failed to publish page resource")
      })
      const sendFailedPublishEmailSpy = vi
        .spyOn(emailService, "sendFailedPublishEmail")
        .mockResolvedValue()

      // Act
      const result = await publishScheduledResources(true, FIXED_NOW)

      // Assert
      // expect no version to be created for the resource, since the publish failed
      const versions = await db
        .selectFrom("Version")
        .where("resourceId", "=", page.id)
        .selectAll()
        .execute()

      expect(versions).toHaveLength(0)
      expect(result[site.id]).toBeUndefined()
      expect(sendFailedPublishEmailSpy).toHaveBeenCalledExactlyOnceWith({
        recipientEmail: user.email,
        isScheduled: true,
        resource: expect.objectContaining({ id: page.id }),
      })
    })

    describe("throwing an error when publishing a resource still processes the next resource correctly", () => {
      let site: SetupPageResourceResult["site"]
      let site2: SetupPageResourceResult["site"]
      let page: SetupPageResourceResult["page"]
      let page2: SetupPageResourceResult["page"]
      let result: PublishScheduledResourcesResult
      let failedEmailCall: Parameters<
        typeof emailService.sendFailedPublishEmail
      >[0]
      let versionsPage1: VersionRows
      let versionsPage2: VersionRows

      beforeAll(async () => {
        // Arrange
        ;({ site, page } = await setupPageResource({
          resourceType: ResourceType.Page,
          scheduledAt: FIXED_NOW,
          scheduledBy: session.userId,
          permalink: "page-1",
        }))
        ;({ page: page2, site: site2 } = await setupPageResource({
          resourceType: ResourceType.Page,
          scheduledAt: FIXED_NOW,
          scheduledBy: session.userId,
          permalink: "page-2",
        }))
        await setupPublisherPermissions({
          userId: session.userId,
          siteId: site.id,
        })
        const originalPublishPageResource =
          publishPageResourceModule.publishPageResource

        vi.spyOn(
          publishPageResourceModule,
          "publishPageResource",
        ).mockImplementation(async (args) => {
          if (args.resourceId === page.id) {
            throw new Error("Mock error for resource 1")
          }
          return await originalPublishPageResource(args)
        })

        const sendFailedPublishEmailSpy = vi
          .spyOn(emailService, "sendFailedPublishEmail")
          .mockResolvedValue()

        // Act
        result = await publishScheduledResources(true, FIXED_NOW)

        failedEmailCall = sendFailedPublishEmailSpy.mock.calls[0]![0]!

        versionsPage1 = await getVersionsForResource(String(page.id))

        versionsPage2 = await getVersionsForResource(String(page2.id))
      })

      it("sends a failed publish email for the first resource", () => {
        expect(failedEmailCall).toMatchObject({
          recipientEmail: user.email,
          isScheduled: true,
          resource: expect.objectContaining({ id: page.id }),
        })
      })

      it("excludes the failed site from the resourceSiteMap", () => {
        expect(result[site.id]).toBeUndefined()
      })

      it("includes the successfully published resource in the resourceSiteMap", () => {
        expect(result[site2.id]?.length).toBe(1)
        expect(result[site2.id]?.[0]!.id).toBe(page2.id)
      })

      it("creates a version only for the successfully published resource", () => {
        expect(versionsPage1).toHaveLength(0)
        expect(versionsPage2).toHaveLength(1)
        expect(versionsPage2[0]).toMatchObject({
          resourceId: page2.id,
          versionNum: 1,
        })
      })
    })

    describe("a resource without userId inside scheduledBy is skipped and does not prevent other resources from being published", () => {
      let site: SetupPageResourceResult["site"]
      let site2: SetupPageResourceResult["site"]
      let page: SetupPageResourceResult["page"]
      let page2: SetupPageResourceResult["page"]
      let result: PublishScheduledResourcesResult
      let publishPageResourceCallCount: number
      let versionsPage1: VersionRows
      let versionsPage2: VersionRows

      beforeAll(async () => {
        // Arrange
        ;({ site, page } = await setupPageResource({
          resourceType: ResourceType.Page,
          scheduledAt: FIXED_NOW,
          scheduledBy: null,
          permalink: "page-1",
        }))
        ;({ page: page2, site: site2 } = await setupPageResource({
          resourceType: ResourceType.Page,
          scheduledAt: FIXED_NOW,
          scheduledBy: session.userId,
          permalink: "page-2",
        }))
        await setupPublisherPermissions({
          userId: session.userId,
          siteId: site.id,
        })
        const publishPageResourceSpy = vi.spyOn(
          publishPageResourceModule,
          "publishPageResource",
        )

        // Act
        result = await publishScheduledResources(true, FIXED_NOW)

        publishPageResourceCallCount = publishPageResourceSpy.mock.calls.length

        versionsPage1 = await getVersionsForResource(String(page.id))

        versionsPage2 = await getVersionsForResource(String(page2.id))
      })

      it("publishes only the resource with a valid scheduledBy user", () => {
        expect(publishPageResourceCallCount).toBe(1)
        expect(result[site.id]).toBeUndefined()
      })

      it("includes the successfully published resource in the resourceSiteMap", () => {
        expect(result[site2.id]?.length).toBe(1)
        expect(result[site2.id]?.[0]!.id).toBe(page2.id)
      })

      it("creates a version only for the successfully published resource", () => {
        expect(versionsPage1).toHaveLength(0)
        expect(versionsPage2).toHaveLength(1)
        expect(versionsPage2[0]).toMatchObject({
          resourceId: page2.id,
          versionNum: 1,
        })
      })
    })

    describe("throwing an error when sending an email for a resource still processes the next resource correctly", () => {
      let site: SetupPageResourceResult["site"]
      let site2: SetupPageResourceResult["site"]
      let page: SetupPageResourceResult["page"]
      let page2: SetupPageResourceResult["page"]
      let result: PublishScheduledResourcesResult
      let failedEmailCall: Parameters<
        typeof emailService.sendFailedPublishEmail
      >[0]
      let versionsPage1: VersionRows
      let versionsPage2: VersionRows

      beforeAll(async () => {
        // Arrange
        ;({ site, page } = await setupPageResource({
          resourceType: ResourceType.Page,
          scheduledAt: FIXED_NOW,
          scheduledBy: session.userId,
          permalink: "page-1",
        }))
        ;({ page: page2, site: site2 } = await setupPageResource({
          resourceType: ResourceType.Page,
          scheduledAt: FIXED_NOW,
          scheduledBy: session.userId,
          permalink: "page-2",
        }))
        await setupPublisherPermissions({
          userId: session.userId,
          siteId: site.id,
        })

        const originalPublishPageResource =
          publishPageResourceModule.publishPageResource

        vi.spyOn(
          publishPageResourceModule,
          "publishPageResource",
        ).mockImplementation(async (args) => {
          if (args.resourceId === page.id) {
            throw new Error("Mock error for resource 1")
          }
          return await originalPublishPageResource(args)
        })

        const emailServiceSpy = vi
          .spyOn(emailService, "sendFailedPublishEmail")
          .mockImplementation(() => {
            throw new Error("Mock email send error for resource")
          })

        // Act
        result = await publishScheduledResources(true, FIXED_NOW)

        failedEmailCall = emailServiceSpy.mock.calls[0]![0]!

        versionsPage1 = await getVersionsForResource(String(page.id))

        versionsPage2 = await getVersionsForResource(String(page2.id))
      })

      it("attempts to send a failed publish email for the first resource", () => {
        expect(failedEmailCall).toMatchObject({
          recipientEmail: user.email,
          isScheduled: true,
          resource: expect.objectContaining({ id: page.id }),
        })
      })

      it("excludes the failed site from the resourceSiteMap", () => {
        expect(result[site.id]).toBeUndefined()
      })

      it("includes the successfully published resource in the resourceSiteMap", () => {
        expect(result[site2.id]?.length).toBe(1)
        expect(result[site2.id]?.[0]!.id).toBe(page2.id)
      })

      it("creates a version only for the successfully published resource", () => {
        expect(versionsPage1).toHaveLength(0)
        expect(versionsPage2).toHaveLength(1)
        expect(versionsPage2[0]).toMatchObject({
          resourceId: page2.id,
          versionNum: 1,
        })
      })
    })
  })

  describe("publishScheduledSites", () => {
    let computeBuildChangesSpy: MockInstance
    let startProjectByIdSpy: MockInstance
    beforeEach(() => {
      computeBuildChangesSpy = vi
        .spyOn(awsUtils, "computeBuildChanges")
        .mockResolvedValue({
          isNewBuildNeeded: true,
        })
      startProjectByIdSpy = vi
        .spyOn(awsUtils, "startProjectById")
        .mockResolvedValue({
          id: "test-build-id",
          startTime: FIXED_NOW,
        })
    })

    it("publishes sites for resources inside the input resourceMap", async () => {
      // Arrange
      const { site, page } = await setupPageResource({
        resourceType: ResourceType.Page,
        scheduledAt: FIXED_NOW,
        scheduledBy: session.userId,
      })
      await addCodebuildProjectToSite(site.id)
      await setupPublisherPermissions({
        userId: session.userId,
        siteId: site.id,
      })

      // Act
      await publishScheduledSites(
        {
          [site.id]: [
            {
              ...page,
              scheduledBy: String(session.userId),
              email: user.email,
              userDeletedAt: null,
            },
          ],
        },
        true,
      )

      // Assert
      // expect the codebuildjob to be inserted for the site, since the site is published
      expect(computeBuildChangesSpy).toHaveBeenCalledOnce()
      expect(startProjectByIdSpy).toHaveBeenCalledOnce()
      const codebuildJobs = await db
        .selectFrom("CodeBuildJobs")
        .where("siteId", "=", site.id)
        .selectAll()
        .execute()

      expect(codebuildJobs).toHaveLength(1)
      expect(codebuildJobs[0]).toMatchObject({
        siteId: site.id,
        userId: session.userId,
        resourceId: page.id,
        status: "IN_PROGRESS",
        startedAt: FIXED_NOW,
        isScheduled: true,
      })
    })

    it("passing in enableCodebuildJobs false leads to no codebuild row being inserted", async () => {
      // Arrange
      const { site, page } = await setupPageResource({
        resourceType: ResourceType.Page,
        scheduledAt: FIXED_NOW,
        scheduledBy: session.userId,
      })
      await addCodebuildProjectToSite(site.id)
      await setupPublisherPermissions({
        userId: session.userId,
        siteId: site.id,
      })

      // Act
      await publishScheduledSites(
        {
          [site.id]: [
            {
              ...page,
              scheduledBy: String(session.userId),
              email: user.email,
              userDeletedAt: null,
            },
          ],
        },
        false,
      )

      // Assert
      const codebuildJobs = await db
        .selectFrom("CodeBuildJobs")
        .where("siteId", "=", site.id)
        .selectAll()
        .execute()
      expect(codebuildJobs).toHaveLength(0)
      expect(computeBuildChangesSpy).toHaveBeenCalledOnce()
      expect(startProjectByIdSpy).toHaveBeenCalledOnce()
    })

    it("a failed site publish leads to an email being sent for each resource under the site", async () => {
      // Arrange
      const { site, page } = await setupPageResource({
        resourceType: ResourceType.Page,
        scheduledAt: FIXED_NOW,
        scheduledBy: session.userId,
      })
      await addCodebuildProjectToSite(site.id)
      await setupPublisherPermissions({
        userId: session.userId,
        siteId: site.id,
      })

      // mock the startProjectByIdSpy to throw an error to simulate failure to start codebuild
      startProjectByIdSpy.mockRejectedValueOnce(
        new Error("Failed to start codebuild project"),
      )

      const sendFailedPublishEmailSpy = vi
        .spyOn(emailService, "sendFailedPublishEmail")
        .mockResolvedValue()

      // Act
      await publishScheduledSites(
        {
          [site.id]: [
            {
              ...page,
              scheduledBy: String(session.userId),
              email: user.email,
              userDeletedAt: null,
            },
          ],
        },
        true,
      )

      // Assert
      expect(sendFailedPublishEmailSpy).toHaveBeenCalledExactlyOnceWith({
        recipientEmail: user.email,
        isScheduled: true,
        resource: expect.objectContaining({ id: page.id }),
      })
    })

    it("a failed site publish does NOT send emails if user is deleted", async () => {
      // Arrange
      const { site, page } = await setupPageResource({
        resourceType: ResourceType.Page,
        scheduledAt: FIXED_NOW,
        scheduledBy: session.userId,
      })
      await addCodebuildProjectToSite(site.id)
      await setupPublisherPermissions({
        userId: session.userId,
        siteId: site.id,
      })

      // mock the startProjectByIdSpy to throw an error to simulate failure to start codebuild
      startProjectByIdSpy.mockRejectedValueOnce(
        new Error("Failed to start codebuild project"),
      )

      const sendFailedPublishEmailSpy = vi
        .spyOn(emailService, "sendFailedPublishEmail")
        .mockResolvedValue()

      // Act
      await publishScheduledSites(
        {
          [site.id]: [
            {
              ...page,
              scheduledBy: String(session.userId),
              email: user.email,
              userDeletedAt: FIXED_NOW, // simulate deleted user
            },
          ],
        },
        true,
      )

      // Assert
      expect(sendFailedPublishEmailSpy).not.toHaveBeenCalled()
    })

    it("a failed site publish does NOT send emails if user is missing an email", async () => {
      // Arrange
      const { site, page } = await setupPageResource({
        resourceType: ResourceType.Page,
        scheduledAt: FIXED_NOW,
        scheduledBy: session.userId,
      })
      await addCodebuildProjectToSite(site.id)
      await setupPublisherPermissions({
        userId: session.userId,
        siteId: site.id,
      })

      // mock the startProjectByIdSpy to throw an error to simulate failure to start codebuild
      startProjectByIdSpy.mockRejectedValueOnce(
        new Error("Failed to start codebuild project"),
      )

      const sendFailedPublishEmailSpy = vi
        .spyOn(emailService, "sendFailedPublishEmail")
        .mockResolvedValue()

      // Act
      await publishScheduledSites(
        {
          [site.id]: [
            {
              ...page,
              scheduledBy: String(session.userId),
              email: null, // simulate missing email
              userDeletedAt: null,
            },
          ],
        },
        true,
      )

      // Assert
      expect(sendFailedPublishEmailSpy).not.toHaveBeenCalled()
    })
  })
})
