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
import { db } from "~/server/modules/database"
import { PageAlreadyUnpublishedError } from "~/server/modules/resource/resource.error"
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
      await setupPublisherPermissions({
        userId: session.userId,
        siteId: site2.id,
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
      await setupPublisherPermissions({
        userId: session.userId,
        siteId: site2.id,
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
    it("does not execute the scheduled action when the scheduling user has been deactivated since scheduling", async () => {
      // Arrange
      const deletedUser = await setupUser({
        email: "deleted@mock.com",
        isDeleted: true,
      })
      const { site, page } = await setupPageResource({
        resourceType: ResourceType.Page,
        scheduledAt: FIXED_NOW,
        scheduledBy: deletedUser.id,
      })
      await setupPublisherPermissions({
        userId: deletedUser.id,
        siteId: site.id,
      })
      const publishPageResourceSpy = vi.spyOn(
        publishPageResourceModule,
        "publishPageResource",
      )
      const sendFailedPublishEmailSpy = vi
        .spyOn(emailService, "sendFailedPublishEmail")
        .mockResolvedValue()

      // Act
      const result = await publishScheduledResources(true, FIXED_NOW)

      // Assert — the action never runs on behalf of a deactivated user
      expect(publishPageResourceSpy).not.toHaveBeenCalled()
      expect(sendFailedPublishEmailSpy).not.toHaveBeenCalled()
      expect(result[site.id]).not.toBeDefined()
      const updated = await db
        .selectFrom("Resource")
        .where("id", "=", page.id)
        .selectAll()
        .executeTakeFirstOrThrow()
      expect(updated.publishedVersionId).toBeNull()
    })
    it("does not execute the scheduled action when the scheduling user no longer has permission on the site", async () => {
      // Arrange — permissions revoked after scheduling: no
      // setupPublisherPermissions call for this user/site.
      const { site, page } = await setupPageResource({
        resourceType: ResourceType.Page,
        scheduledAt: FIXED_NOW,
        scheduledBy: session.userId,
      })
      const publishPageResourceSpy = vi.spyOn(
        publishPageResourceModule,
        "publishPageResource",
      )
      const sendFailedPublishEmailSpy = vi
        .spyOn(emailService, "sendFailedPublishEmail")
        .mockResolvedValue()

      // Act
      const result = await publishScheduledResources(true, FIXED_NOW)

      // Assert — the action never runs without a fresh permission check,
      // and it's handled like any other failure (logged + failure email)
      expect(publishPageResourceSpy).not.toHaveBeenCalled()
      expect(result[site.id]).not.toBeDefined()
      expect(sendFailedPublishEmailSpy).toHaveBeenCalledTimes(1)
      expect(sendFailedPublishEmailSpy).toHaveBeenCalledWith({
        recipientEmail: user.email,
        isScheduled: true,
        resource: expect.objectContaining({ id: page.id }),
      })
      const updated = await db
        .selectFrom("Resource")
        .where("id", "=", page.id)
        .selectAll()
        .executeTakeFirstOrThrow()
      expect(updated.publishedVersionId).toBeNull()
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
      await setupPublisherPermissions({
        userId: session.userId,
        siteId: site2.id,
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

    it("does not execute a scheduled unpublish when the scheduling user no longer has permission on the site", async () => {
      // Arrange — permissions revoked after scheduling: no
      // setupPublisherPermissions call for this user/site.
      const { site, page } = await setupPageResource({
        resourceType: ResourceType.Page,
        state: ResourceState.Published,
        userId: session.userId,
        scheduledAt: FIXED_NOW,
        scheduledBy: session.userId,
        scheduledAction: ScheduledAction.Unpublish,
      })
      const unpublishPageResourceSpy = vi.spyOn(
        publishPageResourceModule,
        "unpublishPageResource",
      )
      const sendFailedUnpublishEmailSpy = vi
        .spyOn(emailService, "sendFailedUnpublishEmail")
        .mockResolvedValue()

      // Act
      const result = await publishScheduledResources(true, FIXED_NOW)

      // Assert
      expect(unpublishPageResourceSpy).not.toHaveBeenCalled()
      expect(result[site.id]).not.toBeDefined()
      expect(sendFailedUnpublishEmailSpy).toHaveBeenCalledTimes(1)
      const updated = await db
        .selectFrom("Resource")
        .where("id", "=", page.id)
        .selectAll()
        .executeTakeFirstOrThrow()
      // still published — the unpublish never ran
      expect(updated.publishedVersionId).not.toBeNull()
    })

    it("does not execute a scheduled unpublish when the unpublish feature flag is off", async () => {
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
      const unpublishPageResourceSpy = vi.spyOn(
        publishPageResourceModule,
        "unpublishPageResource",
      )
      const sendFailedUnpublishEmailSpy = vi
        .spyOn(emailService, "sendFailedUnpublishEmail")
        .mockResolvedValue()

      // Act — isUnpublishEnabled explicitly false, as if the flag was
      // flipped off after this was scheduled
      const result = await publishScheduledResources(true, FIXED_NOW, false)

      // Assert — skipped entirely, not treated as a failure (no failure
      // email, since this isn't the scheduling user's fault)
      expect(unpublishPageResourceSpy).not.toHaveBeenCalled()
      expect(sendFailedUnpublishEmailSpy).not.toHaveBeenCalled()
      expect(result[site.id]).not.toBeDefined()
      const updated = await db
        .selectFrom("Resource")
        .where("id", "=", page.id)
        .selectAll()
        .executeTakeFirstOrThrow()
      // still published — the unpublish never ran
      expect(updated.publishedVersionId).not.toBeNull()
    })

    it("still executes a scheduled publish when the unpublish feature flag is off", async () => {
      // Arrange — flag only gates unpublish, publish is unaffected
      const { site, page } = await setupPageResource({
        resourceType: ResourceType.Page,
        userId: session.userId,
        scheduledAt: FIXED_NOW,
        scheduledBy: session.userId,
        scheduledAction: ScheduledAction.Publish,
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
      const result = await publishScheduledResources(true, FIXED_NOW, false)

      // Assert
      expect(publishPageResourceSpy).toHaveBeenCalledTimes(1)
      expect(result[site.id]?.[0]!.id).toBe(page.id)
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

    it("sends a failed-unpublish email when the page was already unpublished before the scheduled job ran", async () => {
      // NOTE: this can no longer happen via a manual unpublish beating the
      // schedule — unpublishPageResource now blocks manual unpublishing
      // while any schedule is pending (see resource.service.ts) — so this
      // only covers the (very narrow) case of unpublishPageResource still
      // throwing PageAlreadyUnpublishedError for some other reason. There is
      // no dedicated "already unpublished" email/log path anymore; it's
      // treated like any other failure.
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
        throw new PageAlreadyUnpublishedError()
      })
      const sendFailedUnpublishEmailSpy = vi
        .spyOn(emailService, "sendFailedUnpublishEmail")
        .mockResolvedValue()

      const result = await publishScheduledResources(true, FIXED_NOW)

      expect(result[site.id]).toBeUndefined()
      expect(sendFailedUnpublishEmailSpy).toHaveBeenCalledTimes(1)
      expect(sendFailedUnpublishEmailSpy).toHaveBeenCalledWith({
        recipientEmail: user.email,
        isScheduled: true,
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
    it("a failed site publish sends a failed-site-rebuild email (not a failed-publish email) for each resource under the site", async () => {
      // NOTE: every resource passed into publishScheduledSites already had
      // its own publish/unpublish succeed — only the site rebuild fails
      // here — so the email must not claim the page-level action failed.
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
      const sendFailedSiteRebuildEmailSpy = vi
        .spyOn(emailService, "sendFailedSiteRebuildEmail")
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
      expect(sendFailedPublishEmailSpy).not.toHaveBeenCalled()
      expect(sendFailedSiteRebuildEmailSpy).toHaveBeenCalledTimes(1)
      expect(sendFailedSiteRebuildEmailSpy).toHaveBeenCalledWith({
        recipientEmail: user.email,
        verb: "publish",
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

      const sendFailedSiteRebuildEmailSpy = vi
        .spyOn(emailService, "sendFailedSiteRebuildEmail")
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
      expect(sendFailedSiteRebuildEmailSpy).not.toHaveBeenCalled()
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

      const sendFailedSiteRebuildEmailSpy = vi
        .spyOn(emailService, "sendFailedSiteRebuildEmail")
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
      expect(sendFailedSiteRebuildEmailSpy).not.toHaveBeenCalled()
    })
  })
})
