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
import * as emailService from "~/features/mail/service"
import * as awsUtils from "~/server/modules/aws/utils"
import { db } from "~/server/modules/database/database"
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
      email: "test@mock.com",
      isDeleted: false,
      userId: session.userId,
    })
    await auth(user)
  })

  afterEach(() => {
    MockDate.reset() // Reset time after each test
  })

  describe("schedulePublishJobHandler", () => {
    it("publishes a resource which has scheduledAt less than current run time", async () => {
      // Arrange
      const { site, page } = await setupPageResource({
        resourceType: ResourceType.Page,
        scheduledAt: FIXED_NOW,
        scheduledBy: session.userId,
      })
      await setupPublisherPermissions({
        siteId: site.id,
        userId: session.userId,
      })

      // Act
      const resourceSiteMap = await publishScheduledResources(true, FIXED_NOW)

      // Assert
      // expect a version to be created for the resource, since the resource is published
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

      // expect the audit log to be created with the correct info corresponding to the publish action
      const auditLogs = await db
        .selectFrom("AuditLog")
        .where("siteId", "=", site.id)
        .selectAll()
        .execute()
      expect(auditLogs).toHaveLength(1)
      expect(auditLogs[0]).toMatchObject({
        eventType: AuditLogEvent.Publish,
        siteId: site.id,
        userId: user.id,
      })

      // expect the resourceSiteMap to contain the site and resource
      expect(resourceSiteMap[site.id]).toBeDefined()
      expect(resourceSiteMap[site.id]?.[0]!.id).toBe(page.id)
    })
    it("does not publish a resource if scheduledAt time is in the future", async () => {
      // Arrange
      const { site, page } = await setupPageResource({
        resourceType: ResourceType.Page,
        scheduledAt: addSeconds(FIXED_NOW, 10),
        scheduledBy: session.userId,
      })
      await setupPublisherPermissions({
        siteId: site.id,
        userId: session.userId,
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
        siteId: site.id,
        userId: session.userId,
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
      expect(sendFailedPublishEmailSpy).toHaveBeenCalledTimes(1)
      expect(sendFailedPublishEmailSpy).toHaveBeenCalledWith({
        isScheduled: true,
        recipientEmail: user.email,
        resource: expect.objectContaining({ id: page.id }),
      })
    })
    it("throwing an error when publishing a resource still processes the next resource correctly", async () => {
      // Arrange
      const { site, page } = await setupPageResource({
        permalink: "page-1",
        resourceType: ResourceType.Page,
        scheduledAt: FIXED_NOW,
        scheduledBy: session.userId,
      })
      // setup a second resource which should be published successfully
      const { page: page2, site: site2 } = await setupPageResource({
        permalink: "page-2",
        resourceType: ResourceType.Page,
        scheduledAt: FIXED_NOW,
        scheduledBy: session.userId,
      })
      await setupPublisherPermissions({
        siteId: site.id,
        userId: session.userId,
      })
      // mock the publishPageResource to throw an error to simulate failure
      // the second call should use the original function implementation
      const originalPublishPageResource =
        publishPageResourceModule.publishPageResource

      vi.spyOn(
        publishPageResourceModule,
        "publishPageResource",
      ).mockImplementation(async (args) => {
        if (args.resourceId === page.id) {
          // first call throws error
          throw new Error("Mock error for resource 1")
        } else {
          // second call uses original implementation
           await originalPublishPageResource(args); return;
        }
      })

      const sendFailedPublishEmailSpy = vi
        .spyOn(emailService, "sendFailedPublishEmail")
        .mockResolvedValue()

      // Act
      const result = await publishScheduledResources(true, FIXED_NOW)

      // Assert
      expect(sendFailedPublishEmailSpy).toHaveBeenCalledTimes(1)
      expect(sendFailedPublishEmailSpy).toHaveBeenCalledWith({
        isScheduled: true,
        recipientEmail: user.email,
        resource: expect.objectContaining({ id: page.id }),
      })
      expect(result[site.id]).not.toBeDefined()
      expect(result[site2.id]?.length).toBe(1)
      expect(result[site2.id]?.[0]!.id).toBe(page2.id)

      // expect a version to be created only for the second resource
      const versionsPage1 = await db
        .selectFrom("Version")
        .where("resourceId", "=", page.id)
        .selectAll()
        .execute()
      expect(versionsPage1).toHaveLength(0)

      const versionsPage2 = await db
        .selectFrom("Version")
        .where("resourceId", "=", page2.id)
        .selectAll()
        .execute()

      expect(versionsPage2).toHaveLength(1)
      expect(versionsPage2[0]).toMatchObject({
        resourceId: page2.id,
        versionNum: 1,
      })
    })
    it("a resource without userId inside scheduledBy is skipped and does not prevent other resources from being published", async () => {
      // Arrange
      const { site, page } = await setupPageResource({
        permalink: "page-1",
        resourceType: ResourceType.Page,
        scheduledAt: FIXED_NOW,
        scheduledBy: null, // no user info,
      })
      // setup a second resource which should be published successfully
      const { page: page2, site: site2 } = await setupPageResource({
        permalink: "page-2",
        resourceType: ResourceType.Page,
        scheduledAt: FIXED_NOW,
        scheduledBy: session.userId,
      })
      await setupPublisherPermissions({
        siteId: site.id,
        userId: session.userId,
      })
      const publishPageResourceSpy = vi.spyOn(
        publishPageResourceModule,
        "publishPageResource",
      )

      // Act
      const result = await publishScheduledResources(true, FIXED_NOW)

      // Assert
      expect(publishPageResourceSpy).toHaveBeenCalledTimes(1)
      expect(result[site.id]).not.toBeDefined()
      expect(result[site2.id]?.length).toBe(1)
      expect(result[site2.id]?.[0]!.id).toBe(page2.id)

      // expect a version to be created only for the second resource
      const versionsPage1 = await db
        .selectFrom("Version")
        .where("resourceId", "=", page.id)
        .selectAll()
        .execute()
      expect(versionsPage1).toHaveLength(0)

      const versionsPage2 = await db
        .selectFrom("Version")
        .where("resourceId", "=", page2.id)
        .selectAll()
        .execute()

      expect(versionsPage2).toHaveLength(1)
      expect(versionsPage2[0]).toMatchObject({
        resourceId: page2.id,
        versionNum: 1,
      })
    })
    it("throwing an error when sending an email for a resource still processes the next resource correctly", async () => {
      // Arrange
      const { site, page } = await setupPageResource({
        permalink: "page-1",
        resourceType: ResourceType.Page,
        scheduledAt: FIXED_NOW,
        scheduledBy: session.userId,
      })
      // setup a second resource which should be published successfully
      const { page: page2, site: site2 } = await setupPageResource({
        permalink: "page-2",
        resourceType: ResourceType.Page,
        scheduledAt: FIXED_NOW,
        scheduledBy: session.userId,
      })
      await setupPublisherPermissions({
        siteId: site.id,
        userId: session.userId,
      })

      // mock the publishPageResource to throw an error to simulate failure
      // the second call should use the original function implementation
      const originalPublishPageResource =
        publishPageResourceModule.publishPageResource

      vi.spyOn(
        publishPageResourceModule,
        "publishPageResource",
      ).mockImplementation(async (args) => {
        if (args.resourceId === page.id) {
          // first call throws error
          throw new Error("Mock error for resource 1")
        } else {
          // second call uses original implementation
           await originalPublishPageResource(args); return;
        }
      })

      const emailServiceSpy = vi
        .spyOn(emailService, "sendFailedPublishEmail")
        .mockImplementation(() => {
          throw new Error("Mock email send error for resource")
        })

      // Act
      const result = await publishScheduledResources(true, FIXED_NOW)

      // Assert
      expect(emailServiceSpy).toHaveBeenCalledTimes(1)
      expect(emailServiceSpy).toHaveBeenCalledWith({
        isScheduled: true,
        recipientEmail: user.email,
        resource: expect.objectContaining({ id: page.id }),
      })

      expect(result[site.id]).not.toBeDefined()
      expect(result[site2.id]?.length).toBe(1)
      expect(result[site2.id]?.[0]!.id).toBe(page2.id)

      // expect a version to be created only for the second resource
      const versionsPage1 = await db
        .selectFrom("Version")
        .where("resourceId", "=", page.id)
        .selectAll()
        .execute()
      expect(versionsPage1).toHaveLength(0)

      const versionsPage2 = await db
        .selectFrom("Version")
        .where("resourceId", "=", page2.id)
        .selectAll()
        .execute()

      expect(versionsPage2).toHaveLength(1)
      expect(versionsPage2[0]).toMatchObject({
        resourceId: page2.id,
        versionNum: 1,
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
        siteId: site.id,
        userId: session.userId,
      })

      // Act
      await publishScheduledSites(
        {
          [site.id]: [
            {
              ...page,
              email: user.email,
              scheduledBy: String(session.userId),
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
        isScheduled: true,
        resourceId: page.id,
        siteId: site.id,
        startedAt: FIXED_NOW,
        status: "IN_PROGRESS",
        userId: session.userId,
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
        siteId: site.id,
        userId: session.userId,
      })

      // Act
      await publishScheduledSites(
        {
          [site.id]: [
            {
              ...page,
              email: user.email,
              scheduledBy: String(session.userId),
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
        siteId: site.id,
        userId: session.userId,
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
              email: user.email,
              scheduledBy: String(session.userId),
              userDeletedAt: null,
            },
          ],
        },
        true,
      )

      // Assert
      expect(sendFailedPublishEmailSpy).toHaveBeenCalledTimes(1)
      expect(sendFailedPublishEmailSpy).toHaveBeenCalledWith({
        isScheduled: true,
        recipientEmail: user.email,
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
        siteId: site.id,
        userId: session.userId,
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
              email: user.email,
              scheduledBy: String(session.userId),
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
        siteId: site.id,
        userId: session.userId,
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
              email: null, // simulate missing email
              scheduledBy: String(session.userId),
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
