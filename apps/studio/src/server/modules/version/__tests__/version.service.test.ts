import { resetTables } from "tests/integration/helpers/db"
import {
  setupBlob,
  setupPageResource,
  setupUser,
} from "tests/integration/helpers/seed"
import { ResourceType } from "~prisma/generated/prisma/client"

import { db, ResourceState } from "../../database"
import { getLatestVersionByResourceId } from "../version.service"

describe("version.service", () => {
  beforeEach(async () => {
    await resetTables("Site", "Resource", "Blob", "Version", "User")
  })

  describe("getLatestVersionByResourceId", () => {
    it("should return undefined if the resource has no `Version` rows at all", async () => {
      // Arrange
      const { page } = await setupPageResource({
        resourceType: ResourceType.Page,
        state: ResourceState.Draft,
      })

      // Act
      const result = await getLatestVersionByResourceId(db, {
        resourceId: page.id,
      })

      // Assert
      expect(result).toBeUndefined()
    })

    it("should return the single `Version` row if only one exists", async () => {
      // Arrange
      const user = await setupUser({})
      const { page } = await setupPageResource({
        resourceType: ResourceType.Page,
        state: ResourceState.Published,
        userId: user.id,
      })

      // Act
      const result = await getLatestVersionByResourceId(db, {
        resourceId: page.id,
      })

      // Assert
      expect(result).toBeDefined()
      expect(result?.resourceId).toBe(page.id)
      expect(result?.versionNum).toBe(1)
      expect(result?.id).toBe(page.publishedVersionId)
    })

    it("should return the row with the highest `versionNum`, not the most recently inserted one", async () => {
      // Arrange
      const user = await setupUser({})
      const { page } = await setupPageResource({
        resourceType: ResourceType.Page,
        state: ResourceState.Published,
        userId: user.id,
      })

      // Insert a higher versionNum row first...
      const higherVersionBlob = await setupBlob()
      const higherVersion = await db
        .insertInto("Version")
        .values({
          versionNum: 3,
          resourceId: page.id,
          blobId: higherVersionBlob.id,
          publishedBy: user.id,
        })
        .returning(["id", "versionNum"])
        .executeTakeFirstOrThrow()

      // ...then insert a lower versionNum row afterwards, so insertion order
      // and versionNum order disagree.
      const lowerVersionBlob = await setupBlob()
      await db
        .insertInto("Version")
        .values({
          versionNum: 2,
          resourceId: page.id,
          blobId: lowerVersionBlob.id,
          publishedBy: user.id,
        })
        .returning(["id", "versionNum"])
        .executeTakeFirstOrThrow()

      // Act
      const result = await getLatestVersionByResourceId(db, {
        resourceId: page.id,
      })

      // Assert
      expect(result?.id).toBe(higherVersion.id)
      expect(result?.versionNum).toBe(3)
    })

    it("should return the latest historical `Version` even if the resource is currently archived (publishedVersionId is null)", async () => {
      // Arrange: simulate a resource that was published before, then archived.
      const user = await setupUser({})
      const { page } = await setupPageResource({
        resourceType: ResourceType.Page,
        state: ResourceState.Published,
        userId: user.id,
      })

      const secondVersionBlob = await setupBlob()
      const latestVersion = await db
        .insertInto("Version")
        .values({
          versionNum: 2,
          resourceId: page.id,
          blobId: secondVersionBlob.id,
          publishedBy: user.id,
        })
        .returning(["id", "versionNum"])
        .executeTakeFirstOrThrow()

      // Simulate unpublishing: clear `publishedVersionId` on the resource
      // while leaving its `Version` history intact.
      await db
        .updateTable("Resource")
        .where("id", "=", page.id)
        .set({ publishedVersionId: null, state: ResourceState.Archived })
        .executeTakeFirstOrThrow()

      // Act
      const result = await getLatestVersionByResourceId(db, {
        resourceId: page.id,
      })

      // Assert: even though `publishedVersionId` is null, the helper should
      // still surface the latest historical version.
      expect(result).toBeDefined()
      expect(result?.id).toBe(latestVersion.id)
      expect(result?.versionNum).toBe(2)
    })

    it("should scope to the given `resourceId` and not return another resource's versions", async () => {
      // Arrange
      const user = await setupUser({})
      const { page: pageA } = await setupPageResource({
        resourceType: ResourceType.Page,
        state: ResourceState.Published,
        userId: user.id,
      })
      const { page: pageB } = await setupPageResource({
        resourceType: ResourceType.Page,
        state: ResourceState.Published,
        userId: user.id,
      })
      expect(pageA.id).not.toBe(pageB.id)

      // Act
      const result = await getLatestVersionByResourceId(db, {
        resourceId: pageA.id,
      })

      // Assert
      expect(result?.resourceId).toBe(pageA.id)
      expect(result?.id).toBe(pageA.publishedVersionId)
    })
  })
})
