import { resetTables } from "tests/integration/helpers/db"
import {
  setupBlob,
  setupPageResource,
  setupUser,
} from "tests/integration/helpers/seed"
import { ResourceType } from "~prisma/generated/prisma/client"

import { db, ResourceState } from "../../database"
import { incrementVersion } from "../version.service"

describe("version.service", () => {
  beforeEach(async () => {
    await resetTables("Resource", "Version", "Blob", "User", "Site")
  })

  describe("incrementVersion", () => {
    it("should return null if there is no draft to publish", async () => {
      // Arrange
      const user = await setupUser({})
      const { site, page } = await setupPageResource({
        resourceType: ResourceType.Page,
        state: ResourceState.Published,
        userId: user.id,
      })

      // Act
      const result = await db.transaction().execute((tx) =>
        incrementVersion({
          siteId: site.id,
          resourceId: page.id,
          userId: user.id,
          tx,
        }),
      )

      // Assert
      expect(result).toBeNull()
    })

    it("should start version numbering at 1 for a page that has never been published", async () => {
      // Arrange
      const user = await setupUser({})
      const { site, page } = await setupPageResource({
        resourceType: ResourceType.Page,
        state: ResourceState.Draft,
        userId: user.id,
      })

      // Act
      const result = await db.transaction().execute((tx) =>
        incrementVersion({
          siteId: site.id,
          resourceId: page.id,
          userId: user.id,
          tx,
        }),
      )

      // Assert
      expect(result?.previousVersion).toBeNull()
      expect(result?.newVersion.versionNum).toEqual(1)
    })

    it("should continue version numbering from Version history even after publishedVersionId has been cleared (unpublish)", async () => {
      // Arrange
      const user = await setupUser({})
      const { site, page } = await setupPageResource({
        resourceType: ResourceType.Page,
        state: ResourceState.Published,
        userId: user.id,
      })
      // Simulate an unpublish: publishedVersionId is cleared but the
      // Version history (versionNum 1) remains untouched.
      const newDraftBlob = await setupBlob()
      await db
        .updateTable("Resource")
        .where("id", "=", page.id)
        .set({
          publishedVersionId: null,
          draftBlobId: newDraftBlob.id,
          state: ResourceState.Draft,
        })
        .execute()

      // Act
      const result = await db.transaction().execute((tx) =>
        incrementVersion({
          siteId: site.id,
          resourceId: page.id,
          userId: user.id,
          tx,
        }),
      )

      // Assert
      expect(result?.previousVersion?.versionNum).toEqual(1)
      expect(result?.newVersion.versionNum).toEqual(2)
    })
  })
})
