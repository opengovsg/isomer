import type { User } from "@prisma/client"
import { BuildStatusType, ResourceType } from "@prisma/client"
import { auth } from "tests/integration/helpers/auth"
import { resetTables } from "tests/integration/helpers/db"
import {
  addCodebuildProjectToSite,
  setupPageResource,
  setupUser,
} from "tests/integration/helpers/seed"

import { createBaseLogger } from "~/lib/logger"
import * as versionService from "~/server/modules/version/version.service"
import { publishSite } from "../../aws/codebuild.service"
import { db } from "../../database"
import { publishPageResource } from "../../resource/resource.service"

// Mock the publishSite function to avoid sending emails
vi.mock("~/server/modules/aws/codebuild.service.ts", () => ({
  publishSite: vi.fn(),
}))

describe("page.service", () => {
  let user: User
  const logger = createBaseLogger({ path: "test" })
  beforeEach(async () => {
    await resetTables(
      "AuditLog",
      "ResourcePermission",
      "Blob",
      "Version",
      "Resource",
      "CodeBuildJobs",
      "Site",
      "User",
    )
    vi.clearAllMocks()
    vi.restoreAllMocks()
    user = await setupUser({
      email: "test@mock.com",
      isDeleted: false,
    })
    await auth(user)
  })
  describe("publishPageResource", () => {
    it("should publish a page resource, while building the site", async () => {
      // Arrange
      const { page, site } = await setupPageResource({
        resourceType: ResourceType.Page,
      })
      await addCodebuildProjectToSite(site.id)
      const incrementVersionSpy = vi.spyOn(versionService, "incrementVersion")

      // Act
      await publishPageResource({
        logger,
        siteId: site.id,
        resourceId: page.id,
        user,
        isScheduled: false,
        startSitePublish: true,
      })

      // Assert
      // incrementVersion should have been called once
      expect(incrementVersionSpy).toHaveBeenCalledTimes(1)
      const updatedPage = await db
        .selectFrom("Resource")
        .where("id", "=", page.id)
        .selectAll()
        .executeTakeFirstOrThrow()
      // page should be published, draftBlobId cleared, publishedVersionId set
      expect(updatedPage.draftBlobId).toBeNull()
      expect(updatedPage.publishedVersionId).not.toBeNull()
      // codebuildjob row should be created
      const codebuildJobs = await db
        .selectFrom("CodeBuildJobs")
        .where("resourceId", "=", page.id)
        .selectAll()
        .execute()
      expect(codebuildJobs).toHaveLength(1)
      expect(codebuildJobs[0]).toMatchObject({
        resourceId: page.id,
        userId: user.id,
        siteId: site.id,
        isScheduled: false,
        startedAt: null,
        buildId: null,
        status: BuildStatusType.PENDING,
      })
      // expect a site build to have been triggered
      expect(publishSite).toHaveBeenCalledWith(logger, site.id)
    })
    it("should publish a page resource, while not building the site if startSitePublish is false", async () => {
      // Arrange
      const { page, site } = await setupPageResource({
        resourceType: ResourceType.Page,
      })
      await addCodebuildProjectToSite(site.id)
      const incrementVersionSpy = vi.spyOn(versionService, "incrementVersion")

      // Act
      await publishPageResource({
        logger,
        siteId: site.id,
        resourceId: page.id,
        user,
        isScheduled: false,
        startSitePublish: false,
      })

      // Assert
      // incrementVersion should have been called once
      expect(incrementVersionSpy).toHaveBeenCalledTimes(1)
      const updatedPage = await db
        .selectFrom("Resource")
        .where("id", "=", page.id)
        .selectAll()
        .executeTakeFirstOrThrow()
      // page should be published, draftBlobId cleared, publishedVersionId set
      expect(updatedPage.draftBlobId).toBeNull()
      expect(updatedPage.publishedVersionId).not.toBeNull()
      // no site build should have been triggered
      expect(publishSite).not.toHaveBeenCalled()
    })
  })
})
