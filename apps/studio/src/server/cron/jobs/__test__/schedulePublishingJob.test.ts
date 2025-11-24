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

import * as emailService from "~/features/mail/service"
import { db } from "~/server/modules/database"
import * as publishPageResourceModule from "~/server/modules/resource/resource.service"
import { publishScheduledResources } from "../schedulePublishingJob"

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

describe("schedulePublishingJob", async () => {
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
  })

  const addCodebuildProjectToSite = async (siteId: number) => {
    await db
      .updateTable("Site")
      .set({ codeBuildId: "test-codebuild-project-id" })
      .where("id", "=", siteId)
      .execute()
  }

  describe("schedulePublishJobHandler", () => {
    beforeEach(() => {
      MockDate.set(FIXED_NOW) // Freeze time before each test
    })
    afterEach(() => {
      MockDate.reset() // Reset time after each test
      vi.restoreAllMocks()
    })
    it("publishes a resource which has scheduledAt less than current run time", async () => {
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
      await addCodebuildProjectToSite(site.id)
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
      await addCodebuildProjectToSite(site.id)
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
      await addCodebuildProjectToSite(site.id)
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
  })
})
