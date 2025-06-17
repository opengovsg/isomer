import { ResourceType } from "~prisma/generated/generatedEnums"
import { resetTables } from "tests/integration/helpers/db"
import {
  setupFolder,
  setupPageResource,
  setupSite,
} from "tests/integration/helpers/seed"

import { db, jsonb } from "~/server/modules/database"
import { createFolderIndexPage } from "~/server/modules/page/page.service"
import {
  getBlobOfResource,
  getPageById,
} from "~/server/modules/resource/resource.service"
import { up as addOrdering } from "./addOrdering"

describe("addOrdering", () => {
  beforeEach(async () => {
    await resetTables("Blob", "Resource")
  })

  it("should not affect any index pages with ordering", async () => {
    // Arrange
    const { site, folder } = await setupFolder()
    const blob = await db
      .insertInto("Blob")
      .values({ content: jsonb(createFolderIndexPage(folder.title)) })
      .returningAll()
      .executeTakeFirstOrThrow()

    const { page } = await setupPageResource({
      siteId: site.id,
      resourceType: ResourceType.IndexPage,
      parentId: folder.id,
      blobId: blob.id,
    })

    // Act
    await addOrdering()

    // Assert
    const actual = await getBlobOfResource({ db, resourceId: page.id })
    expect(actual.content).toEqual(blob.content)
  })

  it("should add childrenPagesOrdering to pages without it", async () => {
    // Arrange
    const { folder, site } = await setupFolder()
    const blobContent = createFolderIndexPage(folder.title)
    // Remove the childrenPagesOrdering to trigger the migration
    const lastBlock = blobContent.content[blobContent.content.length - 1]
    if (lastBlock?.type === "childrenpages") {
      delete lastBlock.childrenPagesOrdering
    }

    const blob = await db
      .insertInto("Blob")
      .values({ content: jsonb(blobContent) })
      .returningAll()
      .executeTakeFirstOrThrow()

    const { page } = await setupPageResource({
      siteId: site.id,
      resourceType: ResourceType.IndexPage,
      parentId: folder.id,
      blobId: blob.id,
    })

    // Act
    await addOrdering()

    // Assert
    const actual = await getBlobOfResource({ db, resourceId: page.id })
    const lastBlockAfter = actual.content.content[actual.content.content.length - 1]
    expect(lastBlockAfter?.type).toBe("childrenpages")
    expect(lastBlockAfter?.childrenPagesOrdering).toEqual([])
  })
  it("should not affect non index pages", async () => {
    // Arrange
    const { site } = await setupSite()
    const { page } = await setupPageResource({
      siteId: site.id,
      resourceType: ResourceType.IndexPage,
    })
    const expected = await getBlobOfResource({ db, resourceId: page.id })

    // Act
    await addOrdering()

    // Assert
    const actual = await getBlobOfResource({ db, resourceId: page.id })
    expect(actual).toEqual(expected)
  })
  it("should not update other properties in the `childrenpages` block", async () => {
    // Arrange
    const { folder, site } = await setupFolder()
    const blobContent = createFolderIndexPage(folder.title)
    // Remove childrenPagesOrdering and add custom properties to test preservation
    const lastBlock = blobContent.content[blobContent.content.length - 1]
    if (lastBlock?.type === "childrenpages") {
      delete lastBlock.childrenPagesOrdering
      lastBlock.customProperty = "should be preserved"
    }

    const blob = await db
      .insertInto("Blob")
      .values({ content: jsonb(blobContent) })
      .returningAll()
      .executeTakeFirstOrThrow()
    
    const { page } = await setupPageResource({
      siteId: site.id,
      resourceType: ResourceType.IndexPage,
      parentId: folder.id,
      blobId: blob.id,
    })

    // Act
    await addOrdering()

    // Assert
    const actual = await getBlobOfResource({ db, resourceId: page.id })
    const lastBlockAfter = actual.content.content[actual.content.content.length - 1]
    expect(lastBlockAfter?.customProperty).toBe("should be preserved")
    expect(lastBlockAfter?.childrenPagesOrdering).toEqual([])
  })

  it("should not publish the page", async () => {
    // Arrange
    const { folder, site } = await setupFolder()
    const blobContent = createFolderIndexPage(folder.title)
    // Remove the childrenPagesOrdering to trigger the migration
    const lastBlock = blobContent.content[blobContent.content.length - 1]
    if (lastBlock?.type === "childrenpages") {
      delete lastBlock.childrenPagesOrdering
    }

    const blob = await db
      .insertInto("Blob")
      .values({ content: jsonb(blobContent) })
      .returningAll()
      .executeTakeFirstOrThrow()

    const { page } = await setupPageResource({
      siteId: site.id,
      resourceType: ResourceType.IndexPage,
      parentId: folder.id,
      blobId: blob.id,
    })

    const pageBeforeMigration = await getPageById(db, {
      resourceId: Number(page.id),
      siteId: site.id,
    })

    // Act
    await addOrdering()

    // Assert
    const pageAfterMigration = await getPageById(db, {
      resourceId: Number(page.id),
      siteId: site.id,
    })
    // The publishedVersionId should remain unchanged
    expect(pageAfterMigration.publishedVersionId).toEqual(
      pageBeforeMigration.publishedVersionId
    )
  })
})
