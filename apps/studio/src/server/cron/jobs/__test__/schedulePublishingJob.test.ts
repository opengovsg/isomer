import type { MockInstance } from "vitest"
import type { User } from "~prisma/generated/prisma/client"
import { TRPCError } from "@trpc/server"
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
import { db } from "~/server/modules/database"
import * as publishPageResourceModule from "~/server/modules/resource/resource.service"
import {
  AuditLogEvent,
  ResourceState,
  ResourceType,
  ScheduledAction,
} from "~prisma/generated/prisma/client"

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
    it("publishes a resource which has scheduledAt less than current run time", async () => {
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
        siteId: site.id,
        userId: user.id,
        eventType: AuditLogEvent.Publish,
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
      expect(sendFailedPublishEmailSpy).toHaveBeenCalledTimes(1)
      expect(sendFailedPublishEmailSpy).toHaveBeenCalledWith({
        recipientEmail: user.email,
        isScheduled: true,
        resource: expect.objectContaining({ id: page.id }),
      })
    })
    it("throwing an error when publishing a resource still processes the next resource correctly", async () => {
      // Arrange
      const { site, page } = await setupPageResource({
        resourceType: ResourceType.Page,
        scheduledAt: FIXED_NOW,
        scheduledBy: session.userId,
        permalink: "page-1",
      })
      // setup a second resource which should be published successfully
      const { page: page2, site: site2 } = await setupPageResource({
        resourceType: ResourceType.Page,
        scheduledAt: FIXED_NOW,
        scheduledBy: session.userId,
        permalink: "page-2",
      })
      await setupPublisherPermissions({
        userId: session.userId,
        siteId: site.id,
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
          return await originalPublishPageResource(args)
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
        recipientEmail: user.email,
        isScheduled: true,
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
        resourceType: ResourceType.Page,
        scheduledAt: FIXED_NOW,
        scheduledBy: null, // no user info
        permalink: "page-1",
      })
      // setup a second resource which should be published successfully
      const { page: page2, site: site2 } = await setupPageResource({
        resourceType: ResourceType.Page,
        scheduledAt: FIXED_NOW,
        scheduledBy: session.userId,
        permalink: "page-2",
      })
      await setupPublisherPermissions({
        userId: session.userId,
        siteId: site.id,
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
        resourceType: ResourceType.Page,
        scheduledAt: FIXED_NOW,
        scheduledBy: session.userId,
        permalink: "page-1",
      })
      // setup a second resource which should be published successfully
      const { page: page2, site: site2 } = await setupPageResource({
        resourceType: ResourceType.Page,
        scheduledAt: FIXED_NOW,
        scheduledBy: session.userId,
        permalink: "page-2",
      })
      await setupPublisherPermissions({
        userId: session.userId,
        siteId: site.id,
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
          return await originalPublishPageResource(args)
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
        recipientEmail: user.email,
        isScheduled: true,
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

  describe("schedulePublishJobHandler - scheduled unpublish", () => {
    it("unpublishes a resource which has scheduledAction Unpublish and scheduledAt in the past", async () => {
      // Arrange
      const { site, page } = await setupPageResource({
        resourceType: ResourceType.Page,
        state: ResourceState.Published,
        userId: session.userId,
        scheduledAt: FIXED_NOW,
        scheduledBy: session.userId,
        scheduledAction: ScheduledAction.Unpublish,
      })
      await setupPublisherPermissions({
        userId: session.userId,
        siteId: site.id,
      })

      // Act
      const resourceSiteMap = await publishScheduledResources(true, FIXED_NOW)

      // Assert — the resource is unpublished, not republished
      const updated = await db
        .selectFrom("Resource")
        .where("id", "=", page.id)
        .selectAll()
        .executeTakeFirstOrThrow()
      expect(updated.publishedVersionId).toBeNull()
      expect(updated.state).toEqual(ResourceState.Draft)

      const auditLogs = await db
        .selectFrom("AuditLog")
        .where("siteId", "=", site.id)
        .where("eventType", "=", AuditLogEvent.Unpublish)
        .selectAll()
        .execute()
      expect(auditLogs).toHaveLength(1)

      expect(resourceSiteMap[site.id]).toBeDefined()
      expect(resourceSiteMap[site.id]?.[0]!.id).toBe(page.id)
    })

    it("does not call publishPageResource for a resource scheduled for unpublish", async () => {
      const { site, page } = await setupPageResource({
        resourceType: ResourceType.Page,
        state: ResourceState.Published,
        userId: session.userId,
        scheduledAt: FIXED_NOW,
        scheduledBy: session.userId,
        scheduledAction: ScheduledAction.Unpublish,
      })
      await setupPublisherPermissions({
        userId: session.userId,
        siteId: site.id,
      })
      const publishPageResourceSpy = vi.spyOn(
        publishPageResourceModule,
        "publishPageResource",
      )
      const unpublishPageResourceSpy = vi.spyOn(
        publishPageResourceModule,
        "unpublishPageResource",
      )

      await publishScheduledResources(true, FIXED_NOW)

      expect(publishPageResourceSpy).not.toHaveBeenCalled()
      expect(unpublishPageResourceSpy).toHaveBeenCalledWith(
        expect.objectContaining({ resourceId: page.id }),
      )
    })

    it("resets scheduledAction along with scheduledAt/scheduledBy after processing", async () => {
      const { site, page } = await setupPageResource({
        resourceType: ResourceType.Page,
        state: ResourceState.Published,
        userId: session.userId,
        scheduledAt: FIXED_NOW,
        scheduledBy: session.userId,
        scheduledAction: ScheduledAction.Unpublish,
      })
      await setupPublisherPermissions({
        userId: session.userId,
        siteId: site.id,
      })

      await publishScheduledResources(true, FIXED_NOW)

      const updated = await db
        .selectFrom("Resource")
        .where("id", "=", page.id)
        .selectAll()
        .executeTakeFirstOrThrow()
      expect(updated.scheduledAt).toBeNull()
      expect(updated.scheduledBy).toBeNull()
      expect(updated.scheduledAction).toBeNull()
    })

    it("sends a failed-unpublish email (not the failed-publish template) when a scheduled unpublish fails", async () => {
      const { site, page } = await setupPageResource({
        resourceType: ResourceType.Page,
        state: ResourceState.Published,
        userId: session.userId,
        scheduledAt: FIXED_NOW,
        scheduledBy: session.userId,
        scheduledAction: ScheduledAction.Unpublish,
      })
      await setupPublisherPermissions({
        userId: session.userId,
        siteId: site.id,
      })
      vi.spyOn(
        publishPageResourceModule,
        "unpublishPageResource",
      ).mockImplementation(() => {
        throw new Error("Failed to unpublish page resource")
      })
      const sendFailedPublishEmailSpy = vi
        .spyOn(emailService, "sendFailedPublishEmail")
        .mockResolvedValue()
      const sendFailedUnpublishEmailSpy = vi
        .spyOn(emailService, "sendFailedUnpublishEmail")
        .mockResolvedValue()

      const result = await publishScheduledResources(true, FIXED_NOW)

      expect(result[site.id]).toBeUndefined()
      expect(sendFailedPublishEmailSpy).not.toHaveBeenCalled()
      expect(sendFailedUnpublishEmailSpy).toHaveBeenCalledTimes(1)
      expect(sendFailedUnpublishEmailSpy).toHaveBeenCalledWith({
        recipientEmail: user.email,
        isScheduled: true,
        resource: expect.objectContaining({ id: page.id }),
      })

      const updated = await db
        .selectFrom("Resource")
        .where("id", "=", page.id)
        .selectAll()
        .executeTakeFirstOrThrow()
      expect(updated.publishedVersionId).not.toBeNull()
    })

    it("sends an already-unpublished email (not a failed-unpublish email) when the page was already unpublished before the scheduled job ran", async () => {
      const { site, page } = await setupPageResource({
        resourceType: ResourceType.Page,
        state: ResourceState.Published,
        userId: session.userId,
        scheduledAt: FIXED_NOW,
        scheduledBy: session.userId,
        scheduledAction: ScheduledAction.Unpublish,
      })
      await setupPublisherPermissions({
        userId: session.userId,
        siteId: site.id,
      })
      vi.spyOn(
        publishPageResourceModule,
        "unpublishPageResource",
      ).mockImplementation(() => {
        throw new TRPCError({
          code: "PRECONDITION_FAILED",
          message: "This page is not currently published",
        })
      })
      const sendFailedUnpublishEmailSpy = vi
        .spyOn(emailService, "sendFailedUnpublishEmail")
        .mockResolvedValue()
      const sendAlreadyUnpublishedEmailSpy = vi
        .spyOn(emailService, "sendAlreadyUnpublishedEmail")
        .mockResolvedValue()

      const result = await publishScheduledResources(true, FIXED_NOW)

      expect(result[site.id]).toBeUndefined()
      expect(sendFailedUnpublishEmailSpy).not.toHaveBeenCalled()
      expect(sendAlreadyUnpublishedEmailSpy).toHaveBeenCalledTimes(1)
      expect(sendAlreadyUnpublishedEmailSpy).toHaveBeenCalledWith({
        recipientEmail: user.email,
        resource: expect.objectContaining({ id: page.id }),
      })
    })

    it("does not send a failed-unpublish email when the feature flag is off", async () => {
      const { site } = await setupPageResource({
        resourceType: ResourceType.Page,
        state: ResourceState.Published,
        userId: session.userId,
        scheduledAt: FIXED_NOW,
        scheduledBy: session.userId,
        scheduledAction: ScheduledAction.Unpublish,
      })
      await setupPublisherPermissions({
        userId: session.userId,
        siteId: site.id,
      })
      vi.spyOn(
        publishPageResourceModule,
        "unpublishPageResource",
      ).mockImplementation(() => {
        throw new Error("Failed to unpublish page resource")
      })
      const sendFailedUnpublishEmailSpy = vi
        .spyOn(emailService, "sendFailedUnpublishEmail")
        .mockResolvedValue()

      await publishScheduledResources(false, FIXED_NOW)

      expect(sendFailedUnpublishEmailSpy).not.toHaveBeenCalled()
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
      expect(sendFailedPublishEmailSpy).toHaveBeenCalledTimes(1)
      expect(sendFailedPublishEmailSpy).toHaveBeenCalledWith({
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
