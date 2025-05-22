// This migration is to update the Folders that currently
// do not have an `IndexPage` to have a default one.
// It is a one-time migration to update the existing Folder records
// It is not reversible

import { ResourceType } from "~prisma/generated/generatedEnums"
import { resetTables } from "tests/integration/helpers/db"
import {
  setupCollection,
  setupFolder,
  setupPageResource,
  setupSite,
} from "tests/integration/helpers/seed"

import { db, jsonb } from "~/server/modules/database"
import { createFolderIndexPage } from "~/server/modules/page/page.service"
import { createDefaultFolderIndexPage } from "../addDefaultIndexPage"

describe("createDefaultFolderIndexPage", () => {
  let site: Awaited<ReturnType<typeof setupSite>>["site"]

  beforeEach(async () => {
    await resetTables("Blob", "Resource")
  })

  beforeAll(async () => {
    const { site: _site } = await setupSite()
    site = _site
  })

  it("should not impact folders with existing index pages", async () => {
    // Arrange
    const { folder } = await setupFolder({ siteId: site.id })
    const { page } = await setupPageResource({
      parentId: folder.id,
      siteId: site.id,
      resourceType: ResourceType.IndexPage,
    })

    // Act
    await createDefaultFolderIndexPage()

    // Assert
    const indexPage = await getIndexPageOf(folder.id)
    expect(indexPage).toEqual(page)
  })
  it("should create index pages for folders at root that do not have index pages ", async () => {
    // Arrange
    await createFolderWithChildren(site.id)
    const { folder } = await setupFolder({
      siteId: site.id,
      title: "Folder without index page",
      permalink: "noIndex",
    })
    const indexPageBlobContent = createFolderIndexPage(folder.title)

    // Act
    await createDefaultFolderIndexPage()

    // Assert
    const indexPage = await getIndexPageOf(folder.id)
    expect(indexPage?.draftBlobId).toBeDefined()
    const draftBlob = await getBlob(indexPage?.draftBlobId ?? "")
    // NOTE: For some reason, the date comparisons fail between the `page.lastModified` and the `Blob.content.page.lastModified`
    // but the values are only off by 1 nanosecond
    expect(draftBlob?.content.content).toEqual(indexPageBlobContent.content)
  })
  it("should create index pages for nested folders that do not have index pages", async () => {
    // Arrange
    const { folder: parent } = await createFolderWithChildren(site.id)
    const { folder } = await setupFolder({
      siteId: site.id,
      title: "Folder without index page",
      permalink: "noIndex",
      parentId: parent.id,
    })
    const indexPageBlobContent = createFolderIndexPage(folder.title)

    // Act
    await createDefaultFolderIndexPage()

    // Assert
    const indexPage = await getIndexPageOf(folder.id)
    expect(indexPage?.draftBlobId).toBeDefined()
    const draftBlob = await getBlob(indexPage?.draftBlobId ?? "")
    // NOTE: For some reason, the date comparisons fail between the `page.lastModified` and the `Blob.content.page.lastModified`
    // but the values are only off by 1 nanosecond
    expect(draftBlob?.content.content).toEqual(indexPageBlobContent.content)
  })

  it("should not create index pages for collections with index pages", async () => {
    // Arrange
    await createFolderWithChildren(site.id)
    const { collection } = await setupCollection({ siteId: site.id })
    const { page } = await setupPageResource({
      parentId: collection.id,
      siteId: site.id,
      resourceType: ResourceType.IndexPage,
    })
    const blobContent = createFolderIndexPage(collection.title)
    const blob = await db
      .insertInto("Blob")
      .values({ content: jsonb(blobContent) })
      .returningAll()
      .executeTakeFirstOrThrow()
    await db
      .updateTable("Resource")
      .set({ draftBlobId: blob.id })
      .where("id", "=", page.id)
      .execute()

    // Act
    await createDefaultFolderIndexPage()

    // Assert
    const indexPage = await getIndexPageOf(collection.id)
    expect(indexPage?.draftBlobId).toBeDefined()
    const draftBlob = await getBlob(indexPage?.draftBlobId ?? "")
    expect(draftBlob?.content.content).toEqual(blob.content.content)
    const possiblyUpdatedIndexPage = await db
      .selectFrom("Resource")
      .where("id", "=", page.id)
      .select("draftBlobId")
      .executeTakeFirstOrThrow()
    // Expect that no changes occured as a result of this change -
    // both the draft blob and the id are identical
    expect(possiblyUpdatedIndexPage.draftBlobId).toEqual(blob.id)
  })
  it("should not create index pages for collections without index pages", async () => {
    // Arrange
    await createFolderWithChildren(site.id)
    const { collection } = await setupCollection({ siteId: site.id })

    // Act
    await createDefaultFolderIndexPage()

    // Assert
    const indexPage = await getIndexPageOf(collection.id)
    expect(indexPage).toBeUndefined()
  })
  it("should not create any versions for the newly created index pages", async () => {
    // Arrange
    const { folder } = await createFolderWithChildren(site.id)

    // Act
    await createDefaultFolderIndexPage()

    // Assert
    const indexPage = await getIndexPageOf(folder.id)
    expect(indexPage).toBeDefined()
    const versions = await db
      .selectFrom("Version")
      .where("Version.resourceId", "=", indexPage!.id)
      .selectAll()
      .execute()
    expect(versions).toStrictEqual([])
  })
})

const getIndexPageOf = (resourceId: string) => {
  return db
    .selectFrom("Resource")
    .where("parentId", "=", resourceId)
    .where("type", "=", ResourceType.IndexPage)
    .selectAll()
    .executeTakeFirst()
}

const getBlob = (blobId: string) =>
  db
    .selectFrom("Blob")
    .where("id", "=", blobId)
    .select("content")
    .executeTakeFirst()

const createFolderWithChildren = async (siteId: number, parentId?: string) => {
  const { folder } = await setupFolder({ siteId, parentId })
  const { page } = await setupPageResource({
    parentId: folder.id,
    siteId,
    resourceType: ResourceType.IndexPage,
  })

  return { folder, page }
}
