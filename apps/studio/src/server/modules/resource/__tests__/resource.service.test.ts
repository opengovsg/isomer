import { ResourceType } from "@prisma/client"
import { pick } from "lodash"
import {
  setupBlob,
  setupCollectionMeta,
  setupFolder,
  setupFolderMeta,
  setupFullSite,
  setupPageResource,
  setupSite,
  setupUser,
} from "tests/integration/helpers/seed"

import type { Resource } from "../../database"
import { db, ResourceState } from "../../database"
import {
  getBatchAncestryWithSelfQuery,
  getFullPageById,
  getLocalisedSitemap,
  getNavBar,
  getPageById,
  getSiteResourceById,
  updateBlobById,
  updatePageById,
} from "../resource.service"
import { PAGE_BLOB } from "./constants"

describe("resource.service", () => {
  // TODO: Implement tests when publish works
  describe.skip("publishPage", () => {
    it.skip("should trigger a publish automatically on creation of a folder", () => {})
    it.skip("should trigger a publish automatically on deletion of a folder", () => {})
    it.skip("should trigger a publish automatically on move of a folder", () => {})
    it.skip("should trigger a publish automatically on update of a folder's title", () => {})
    it.skip("should trigger a publish automatically on update of a folder's permalink", () => {})
    it.skip("should trigger a publish automatically on creation of a collection", () => {})
    it.skip("should trigger a publish automatically on deletion of a collection", () => {})
    it.skip("should trigger a publish automatically on update of a collection's title", () => {})
    it.skip("should trigger a publish automatically on update of a collection's permalink", () => {})
    it.skip("should trigger a publish automatically on move of a page", () => {})
    it.skip("should not trigger a publish if there is a currently running publish witin the past minute", () => {})
  })

  describe("getBatchAncestryWithSelfQuery", () => {
    it("should return empty array if no resources exist", async () => {
      // Arrange
      const { site } = await setupSite()

      // Act
      const result = await getBatchAncestryWithSelfQuery({
        siteId: site.id,
        resourceIds: ["99999"], // non-existent id
      })

      // Assert
      expect(result).toEqual([])
    })

    it("should return empty array for root page resources", async () => {
      // Arrange
      const { site, page } = await setupPageResource({
        resourceType: ResourceType.RootPage,
      })

      // Act
      const result = await getBatchAncestryWithSelfQuery({
        siteId: site.id,
        resourceIds: [page.id],
      })

      // Assert
      expect(result).toEqual([])
    })

    it("should return single item array for root-level resources", async () => {
      // Arrange
      const { site, page } = await setupPageResource({
        resourceType: ResourceType.Page,
      })

      // Act
      const result = await getBatchAncestryWithSelfQuery({
        siteId: site.id,
        resourceIds: [page.id],
      })

      // Assert
      expect(result).toEqual([
        [
          {
            id: page.id,
            title: page.title,
            permalink: page.permalink,
            type: page.type,
            parentId: page.parentId,
          },
        ],
      ])
    })

    it("should return ancestry path for nested resources", async () => {
      // Arrange
      const { site } = await setupSite()
      const { folder: parentFolder } = await setupFolder({
        siteId: site.id,
        parentId: null,
        permalink: "parent-folder",
        title: "Parent folder",
      })
      const { folder: childFolder } = await setupFolder({
        siteId: site.id,
        parentId: parentFolder.id,
        permalink: "child-folder",
        title: "Child folder",
      })
      const { page: grandChildPage } = await setupPageResource({
        resourceType: ResourceType.Page,
        siteId: site.id,
        parentId: childFolder.id,
        permalink: "grand-child-page",
        title: "Grand child page",
      })

      // Act
      const result = await getBatchAncestryWithSelfQuery({
        siteId: site.id,
        resourceIds: [grandChildPage.id],
      })

      // Assert
      expect(result).toEqual([
        [
          {
            id: parentFolder.id,
            title: parentFolder.title,
            permalink: parentFolder.permalink,
            type: parentFolder.type,
            parentId: parentFolder.parentId,
          },
          {
            id: childFolder.id,
            title: childFolder.title,
            permalink: childFolder.permalink,
            type: childFolder.type,
            parentId: childFolder.parentId,
          },
          {
            id: grandChildPage.id,
            title: grandChildPage.title,
            permalink: grandChildPage.permalink,
            type: grandChildPage.type,
            parentId: grandChildPage.parentId,
          },
        ],
      ])
    })

    it("should return multiple ancestry paths for multiple resources", async () => {
      // Arrange
      const { site } = await setupSite()

      // First path
      const { folder: folder1 } = await setupFolder({
        siteId: site.id,
        parentId: null,
        permalink: "folder-1",
        title: "Folder 1",
      })
      const { page: page1 } = await setupPageResource({
        resourceType: ResourceType.Page,
        siteId: site.id,
        parentId: folder1.id,
        permalink: "page-1",
        title: "Page 1",
      })

      // Second path
      const { folder: folder2 } = await setupFolder({
        siteId: site.id,
        parentId: null,
        permalink: "folder-2",
        title: "Folder 2",
      })
      const { page: page2 } = await setupPageResource({
        resourceType: ResourceType.Page,
        siteId: site.id,
        parentId: folder2.id,
        permalink: "page-2",
        title: "Page 2",
      })

      // Act
      const result = await getBatchAncestryWithSelfQuery({
        siteId: site.id,
        resourceIds: [page1.id, page2.id],
      })

      // Assert
      expect(result).toEqual([
        [
          {
            id: folder1.id,
            title: folder1.title,
            permalink: folder1.permalink,
            type: folder1.type,
            parentId: folder1.parentId,
          },
          {
            id: page1.id,
            title: page1.title,
            permalink: page1.permalink,
            type: page1.type,
            parentId: page1.parentId,
          },
        ],
        [
          {
            id: folder2.id,
            title: folder2.title,
            permalink: folder2.permalink,
            type: folder2.type,
            parentId: folder2.parentId,
          },
          {
            id: page2.id,
            title: page2.title,
            permalink: page2.permalink,
            type: page2.type,
            parentId: page2.parentId,
          },
        ],
      ])
    })

    it("should return resources only from specified site", async () => {
      // Arrange
      const { site: site1 } = await setupSite()
      const { site: site2 } = await setupSite()

      const { page: page1 } = await setupPageResource({
        resourceType: ResourceType.Page,
        siteId: site1.id,
      })
      await setupPageResource({
        resourceType: ResourceType.Page,
        siteId: site2.id,
      })

      // Act
      const result = await getBatchAncestryWithSelfQuery({
        siteId: site1.id,
        resourceIds: [page1.id],
      })

      // Assert
      expect(result).toEqual([
        [
          {
            id: page1.id,
            title: page1.title,
            permalink: page1.permalink,
            type: page1.type,
            parentId: page1.parentId,
          },
        ],
      ])
    })
  })

  describe("getSiteResourceById", () => {
    let actualPage: Resource
    let actualSiteId: number

    beforeAll(async () => {
      const { site, page: _pageToId } = await setupPageResource({
        resourceType: "Page",
      })
      actualPage = _pageToId
      actualSiteId = site.id
      const { page: _anotherPage, site: anotherSite } = await setupPageResource(
        {
          resourceType: "Page",
        },
      )

      expect(anotherSite.id).not.toEqual(site.id)
    })

    it("should return the resource with the given `id`", async () => {
      // Act
      const result = await getSiteResourceById({
        siteId: actualSiteId,
        resourceId: actualPage.id,
      })

      // Assert
      expect(result).toMatchObject(actualPage)
    })

    it("should return the resource with the given `id` and `type`", async () => {
      // Act
      const result = await getSiteResourceById({
        siteId: actualSiteId,
        resourceId: actualPage.id,
        type: "Page",
      })

      // Assert
      expect(result).toMatchObject(actualPage)
    })

    it("should return undefined if no resource with the given id exists", async () => {
      // Act
      const result = await getSiteResourceById({
        siteId: actualSiteId,
        resourceId: "999999",
      })

      // Assert
      expect(result).toBeUndefined()
    })

    it("should return undefined if the resource with the given `id` does not match given `type`", async () => {
      // Arrange
      expect(actualPage.type).not.toEqual("Folder")

      // Act
      const result = await getSiteResourceById({
        siteId: actualSiteId,
        resourceId: actualPage.id,
        type: "Folder",
      })

      // Assert
      expect(result).toBeUndefined()
    })

    it("should return undefined if the resource with the given `id` does not belong to the given `siteId`", async () => {
      // Arrange
      expect(actualPage.siteId).not.toEqual(99999)

      // Act
      const result = await getSiteResourceById({
        siteId: 99999,
        resourceId: actualPage.id,
      })

      // Assert
      expect(result).toBeUndefined()
    })
  })

  describe("getFullPageById", () => {
    it("should return resource with draft blob if it exists", async () => {
      // Arrange
      const {
        site,
        page: actualPage,
        blob: actualBlob,
      } = await setupPageResource({
        resourceType: "Page",
        state: "Draft",
      })

      // Act
      const result = await getFullPageById(db, {
        siteId: site.id,
        resourceId: Number(actualPage.id),
      })

      // Assert
      const expected = {
        ...actualPage,
        ...pick(actualBlob, ["content", "updatedAt"]),
      }
      expect(result?.draftBlobId).toBeDefined()
      expect(result?.publishedVersionId).toBeNull()
      expect(result).toMatchObject(expected)
    })

    it("should return resource with published blob if draft blob does not exist", async () => {
      // Arrange
      const testUser = await setupUser({})
      const {
        site,
        page: actualPage,
        blob: actualBlob,
      } = await setupPageResource({
        resourceType: "Page",
        state: ResourceState.Published,
        userId: testUser.id,
      })

      // Act
      const result = await getFullPageById(db, {
        siteId: site.id,
        resourceId: Number(actualPage.id),
      })

      // Assert
      const expected = {
        ...actualPage,
        ...pick(actualBlob, ["content", "updatedAt"]),
      }
      expect(result?.draftBlobId).toBeNull()
      expect(result?.publishedVersionId).toBeDefined()
      expect(result).toMatchObject(expected)
    })

    it("should return undefined if resource with given `resourceId` does not exist", async () => {
      // Arrange
      const { site, page } = await setupPageResource({
        resourceType: "Page",
      })
      expect(page.id).not.toEqual(99999)

      // Act
      const result = await getFullPageById(db, {
        siteId: site.id,
        resourceId: 99999,
      })

      // Assert
      expect(result).toBeUndefined()
    })

    it("should return undefined if resource with given `resourceId` does not belong to the given `siteId`", async () => {
      // Arrange
      const { page } = await setupPageResource({
        resourceType: "Page",
      })
      expect(page.siteId).not.toEqual(99999)

      // Act
      const result = await getFullPageById(db, {
        siteId: 99999,
        resourceId: Number(page.id),
      })

      // Assert
      expect(result).toBeUndefined()
    })
  })

  describe("getPageById", () => {
    it("should return the 'Page' resource with the given `id`", async () => {
      // Arrange
      const { site, page } = await setupPageResource({
        resourceType: "Page",
      })

      // Act
      const result = await getPageById(db, {
        siteId: site.id,
        resourceId: Number(page.id),
      })

      // Assert
      expect(result).toMatchObject(page)
    })

    it("should return the 'RootPage' resource with the given `id`", async () => {
      // Arrange
      const { site, page: rootPage } = await setupPageResource({
        resourceType: "RootPage",
      })

      // Act
      const result = await getPageById(db, {
        siteId: site.id,
        resourceId: Number(rootPage.id),
      })

      // Assert
      expect(result).toMatchObject(rootPage)
    })

    it("should return the 'CollectionPage' resource with the given `id`", async () => {
      // Arrange
      const { site, page: collectionPage } = await setupPageResource({
        resourceType: "CollectionPage",
      })

      // Act
      const result = await getPageById(db, {
        siteId: site.id,
        resourceId: Number(collectionPage.id),
      })

      // Assert
      expect(result).toMatchObject(collectionPage)
    })

    it("should return undefined if resource type is not a supported type", async () => {
      // Arrange
      const { site, page } = await setupPageResource({
        resourceType: "Folder",
      })

      // Act
      const result = await getPageById(db, {
        siteId: site.id,
        resourceId: Number(page.id),
      })

      // Assert
      expect(result).toBeUndefined()
    })

    it("should return undefined if no resource with the given `id` exists", async () => {
      // Arrange
      const { site } = await setupPageResource({
        resourceType: "Page",
      })

      // Act
      const result = await getPageById(db, {
        siteId: site.id,
        resourceId: 99999,
      })

      // Assert
      expect(result).toBeUndefined()
    })

    it("should return undefined if the resource with the given `id` does not belong to the given `siteId`", async () => {
      // Arrange
      const { page } = await setupPageResource({
        resourceType: "Page",
      })

      // Act
      const result = await getPageById(db, {
        siteId: 99999,
        resourceId: Number(page.id),
      })

      // Assert
      expect(result).toBeUndefined()
    })
  })

  describe("updatePageById", () => {
    it("should not update any rows if no matching `id` can be found", async () => {
      // Arrange
      const { site } = await setupPageResource({
        resourceType: "Page",
      })

      // Act
      const result = await updatePageById(
        {
          siteId: site.id,
          id: 99999,
          title: "Updated Title",
        },
        db,
      )

      // Assert
      expect(result.numUpdatedRows).toBe(BigInt(0))
    })

    it("should update the page successfully", async () => {
      // Arrange
      const { site, page } = await setupPageResource({
        resourceType: "Page",
      })

      // Act
      const result = await updatePageById(
        {
          siteId: site.id,
          id: Number(page.id),
          title: "Updated Title",
        },
        db,
      )

      // Assert
      const actualPage = await getPageById(db, {
        resourceId: Number(page.id),
        siteId: site.id,
      })
      expect(actualPage?.title).toBe("Updated Title")
      expect(result.numUpdatedRows).toBe(BigInt(1))
    })

    it("should do nothing when the page does not exist", async () => {
      // Arrange
      const { site } = await setupSite()

      // Act
      const result = await updatePageById(
        {
          siteId: site.id,
          id: 2,
        },
        db,
      )

      // Assert
      expect(result.numUpdatedRows).toBe(BigInt(0))
    })

    it("should fail when the parent does not exist", async () => {
      // Arrange
      const { site, page } = await setupPageResource({
        resourceType: "Page",
      })

      // Act
      const result = updatePageById(
        {
          siteId: site.id,
          id: Number(page.id),
          parentId: -1,
        },
        db,
      )

      // Assert
      await expect(result).rejects.toThrowError()
    })
  })
  describe("updateBlobById", () => {
    let site: Awaited<ReturnType<typeof setupPageResource>>["site"]

    beforeEach(async () => {
      const { site: _site } = await setupSite()
      site = _site
    })

    afterEach(async () => {
      await db.deleteFrom("Resource").execute()
    })

    it("should throw an error if no matching `id` can be found for the page", async () => {
      // Act
      const result = db.transaction().execute((tx) => {
        return updateBlobById(tx, {
          siteId: site.id,
          pageId: 99999,
          content: PAGE_BLOB,
        })
      })

      // Assert
      await expect(result).rejects.toThrowError()
    })

    it("should create a draft blob if the page is already published", async () => {
      // Arrange
      const user = await setupUser({})
      const { page } = await setupPageResource({
        state: ResourceState.Published,
        resourceType: ResourceType.Page,
        userId: user.id,
        siteId: site.id,
        permalink: "another_permalink",
      })
      expect(page.draftBlobId).toBeNull()
      const publishedBlob = await setupBlob()
      await linkPublishedBlobToPage({
        blobId: publishedBlob.id,
        pageId: page.id,
      })

      // Act
      await db.transaction().execute((tx) => {
        return updateBlobById(tx, {
          siteId: site.id,
          pageId: Number(page.id),
          content: PAGE_BLOB,
        })
      })

      // Assert
      const result = await getFullPageById(db, {
        resourceId: Number(page.id),
        siteId: site.id,
      })
      const actualPublishedBlob = await db
        .selectFrom("Version")
        .innerJoin("Blob", "Version.blobId", "Blob.id")
        .where("Version.id", "=", result!.publishedVersionId)
        .select("content")
        .executeTakeFirstOrThrow()
      expect(result?.content).toStrictEqual(PAGE_BLOB)
      expect(actualPublishedBlob.content).toStrictEqual(publishedBlob.content)
      expect(page.draftBlobId).toBeDefined()
    })

    it("should update the existing draft blob if one exists", async () => {
      // Arrange
      const blob = await setupBlob()
      const { page } = await setupPageResource({
        siteId: site.id,
        resourceType: ResourceType.Page,
      })
      await linkDraftBlobToPage({ blobId: blob.id, pageId: page.id })

      // Act
      await db.transaction().execute((tx) => {
        return updateBlobById(tx, {
          siteId: site.id,
          pageId: Number(page.id),
          content: PAGE_BLOB,
        })
      })

      // Assert
      const result = await getFullPageById(db, {
        resourceId: Number(page.id),
        siteId: site.id,
      })
      expect(result?.content).toStrictEqual(PAGE_BLOB)
      expect(result?.publishedVersionId).toBeNull()
    })

    it("should not update when no matching `siteId` can be found", async () => {
      const { page } = await setupPageResource({
        siteId: site.id,
        resourceType: ResourceType.Page,
      })
      // Act
      const result = db.transaction().execute((tx) => {
        return updateBlobById(tx, {
          siteId: 99999,
          pageId: Number(page.id),
          content: PAGE_BLOB,
        })
      })

      // Assert
      await expect(result).rejects.toThrowError()
    })
  })

  describe("getNavBar", () => {
    it("should return the nav bar for the given site", async () => {
      // Arrange
      const { site } = await setupSite()
      // Act
      const result = await getNavBar(site.id)
      // Assert
      expect(result).toBeDefined()
      expect(result.siteId).toBe(site.id)
    })

    it("should throw an error if the `siteId` is not found", async () => {
      // Act
      const result = getNavBar(99999)
      // Assert
      await expect(result).rejects.toThrowError()
    })
  })

  describe("getFooter", () => {
    it("should return the footer for the given site", async () => {
      // Arrange
      const { site } = await setupSite()
      // Act
      const result = await getNavBar(site.id)
      // Assert
      expect(result).toBeDefined()
      expect(result.siteId).toBe(site.id)
    })

    it("should throw an error if the `siteId` is not found", async () => {
      // Act
      const result = getNavBar(99999)
      // Assert
      await expect(result).rejects.toThrowError()
    })
  })

  describe("getLocalisedSitemap", () => {
    it("should throw an error if `siteId` is not found", async () => {
      // Arrange
      const { page } = await setupPageResource({ resourceType: "Page" })

      // Act
      const result = getLocalisedSitemap(9999, Number(page.id))

      // Assert
      await expect(result).rejects.toThrowError()
    })

    it("should throw an error if the `resourceId` doesn't exist", async () => {
      // Arrange
      const { site } = await setupSite()
      // Act
      const result = getLocalisedSitemap(site.id, 99999)
      // Assert
      await expect(result).rejects.toThrowError()
    })

    it("should return the path from ancestor to the page (DRAFT), together with its siblings", async () => {
      // Arrange
      const { site, folder: parentFolder } = await setupFolder({})
      const { page: rootPage } = await setupPageResource({
        resourceType: "RootPage",
        siteId: site.id,
      })
      const { page: childPage } = await setupPageResource({
        resourceType: "Page",
        parentId: parentFolder.id,
        state: ResourceState.Draft, // explicitly set to draft
        siteId: site.id,
      })
      // Act
      const result = await getLocalisedSitemap(site.id, Number(childPage.id))

      // Assert
      expect(result).toBeDefined()
      expect(result.id).toBe(rootPage.id)
      const actualParent = result.children?.at(0)
      expect(actualParent?.id).toBe(parentFolder.id)
      const actualChildPage = actualParent?.children?.at(0)
      expect(actualChildPage?.id).toBe(childPage.id)
    })

    it("should return the path from ancestor to the page (PUBLISHED), together with its siblings", async () => {
      // Arrange
      const { site, folder: parentFolder } = await setupFolder({})
      const { page: rootPage } = await setupPageResource({
        resourceType: "RootPage",
        siteId: site.id,
      })
      const { page: childPage } = await setupPageResource({
        resourceType: "Page",
        parentId: parentFolder.id,
        state: ResourceState.Published,
        userId: (await setupUser({})).id,
        siteId: site.id,
      })
      // Act
      const result = await getLocalisedSitemap(site.id, Number(childPage.id))

      // Assert
      expect(result).toBeDefined()
      expect(result.id).toBe(rootPage.id)
      const actualParent = result.children?.at(0)
      expect(actualParent?.id).toBe(parentFolder.id)
      const actualChildPage = actualParent?.children?.at(0)
      expect(actualChildPage?.id).toBe(childPage.id)
    })

    it("should not include any meta items that are not used for publishing in the sitemap", async () => {
      // Arrange
      const { rootCollection, rootFolder, site, childPage } =
        await setupFullSite()
      const { folderMeta } = await setupFolderMeta({
        siteId: site.id,
        folderId: rootFolder.id,
      })
      const { collectionMeta } = await setupCollectionMeta({
        siteId: site.id,
        collectionId: rootCollection.id,
      })

      // Act
      const actualFolderSitemap = await getLocalisedSitemap(
        site.id,
        Number(childPage.id),
      )
      const actualCollectionSitemap = await getLocalisedSitemap(
        site.id,
        Number(rootCollection.id),
      )

      // Assert
      actualFolderSitemap.children
        ?.at(0)
        ?.children?.forEach(({ permalink }) => {
          expect(permalink).toBeDefined()
          expect(permalink).not.toMatch(folderMeta.permalink)
        })
      actualCollectionSitemap.children
        ?.at(0)
        ?.children?.forEach(({ permalink }) => {
          expect(permalink).toBeDefined()
          expect(permalink).not.toMatch(collectionMeta.permalink)
        })
    })

    it("should return a valid sitemap when resourceId is a RootPage", async () => {
      // Arrange
      const { site } = await setupSite()
      const { page: rootPage } = await setupPageResource({
        siteId: site.id,
        resourceType: ResourceType.RootPage,
      })

      // Act
      const result = await getLocalisedSitemap(site.id, Number(rootPage.id))

      // Assert
      expect(result).toBeDefined()
      expect(result.id).toBe(rootPage.id)
      expect(result.permalink).toBe("/")
    })

    it("should not return indexpage's title when resourceId is a IndexPage (DRAFT)", async () => {
      // Arrange
      const { site } = await setupSite()
      await setupPageResource({
        resourceType: ResourceType.RootPage, // Pre-requisite
        siteId: site.id,
      })
      const { folder } = await setupFolder({
        title: "HelloWorld",
        siteId: site.id,
      })
      const { page: indexPage, blob } = await setupPageResource({
        title: "HelloWorld",
        resourceType: ResourceType.IndexPage,
        siteId: site.id,
        parentId: folder.id,
        state: ResourceState.Draft,
      })
      await db
        .updateTable("Blob")
        .where("id", "=", blob.id)
        .set({
          content: {
            ...blob.content,
            page: {
              contentPageHeader: {
                summary: "Hello im the index page",
              },
            },
          },
        })
        .execute()

      // Act
      const result = await getLocalisedSitemap(site.id, Number(indexPage.id))

      // Assert
      const child = result.children?.at(0)
      expect(child?.id).toBe(folder.id)
      expect(child?.permalink).toBe(`/${folder.permalink}`)
      expect(child?.title).toBe(folder.title) // should be from the folder
      expect(child?.summary).toBe(`Pages in ${folder.title}`) // should not be from the index page
    })

    it("should return indexpage's title when resourceId is a IndexPage (PUBLISHED)", async () => {
      // Arrange
      const { site } = await setupSite()
      await setupPageResource({
        resourceType: ResourceType.RootPage, // Pre-requisite
        siteId: site.id,
      })
      const { folder } = await setupFolder({
        siteId: site.id,
      })
      const { page: indexPage, blob } = await setupPageResource({
        resourceType: ResourceType.IndexPage,
        siteId: site.id,
        parentId: folder.id,
        state: ResourceState.Published,
        userId: (await setupUser({})).id,
      })
      await db
        .updateTable("Blob")
        .where("id", "=", blob.id)
        .set({
          content: {
            ...blob.content,
            page: {
              contentPageHeader: {
                summary: "Hello im the index page",
              },
            },
          },
        })
        .execute()

      // Act
      const result = await getLocalisedSitemap(site.id, Number(indexPage.id))

      // Assert
      const child = result.children?.at(0)
      expect(child?.id).toBe(folder.id)
      expect(child?.permalink).toBe(`/${folder.permalink}`)
      expect(child?.title).toBe(indexPage.title) // should be from the index page
      expect(child?.summary).toBe("Hello im the index page") // should be from the index page
    })

    it("should include children resources when resourceId is a IndexPage (PUBLISHED)", async () => {
      // Arrange
      const { site } = await setupSite()
      await setupPageResource({
        resourceType: ResourceType.RootPage, // Pre-requisite
        siteId: site.id,
      })

      const { folder: parentFolder } = await setupFolder({
        permalink: "parent-folder",
        siteId: site.id,
        title: "Parent Folder",
      })

      const { page: indexPage } = await setupPageResource({
        title: "Parent Folder",
        resourceType: ResourceType.IndexPage,
        siteId: site.id,
        parentId: parentFolder.id,
        state: ResourceState.Published,
        userId: (await setupUser({})).id,
      })

      const { folder } = await setupFolder({
        permalink: "folder-a",
        siteId: site.id,
        parentId: parentFolder.id,
        state: ResourceState.Published,
      })

      const { page } = await setupPageResource({
        permalink: "page-a",
        resourceType: ResourceType.Page,
        siteId: site.id,
        parentId: parentFolder.id,
        state: ResourceState.Published,
        userId: (await setupUser({})).id,
      })

      // Act
      const result = await getLocalisedSitemap(site.id, Number(indexPage.id))

      // Assert
      const children = result.children?.at(0)?.children
      expect(children?.length).toBe(2)

      // Assert: Find Folder in the sitemap
      const folderNode = result.children
        ?.at(0)
        ?.children?.find((child) => child.id === folder.id)
      expect(folderNode?.title).toBe(folder.title)

      // Assert: Find Page in the sitemap
      const pageNode = result.children
        ?.at(0)
        ?.children?.find((child) => child.id === page.id)
      expect(pageNode?.title).toBe(page.title)
    })
  })
  describe.skip("getResourcePermalinkTree", () => {})
  describe.skip("getResourceFullPermalink", () => {})
  describe.skip("publishResource", () => {})
  describe.skip("getWithFulPermalink", () => {})
  describe.skip("getSearchResults", () => {})
  describe.skip("getSearchRecentlyEdited", () => {})
  describe.skip("getSearchWithResourceIds", () => {})
})

const linkDraftBlobToPage = ({
  blobId,
  pageId,
}: {
  blobId: string
  pageId: string
}) => {
  return db
    .updateTable("Resource")
    .where("id", "=", pageId)
    .set({
      draftBlobId: blobId,
    })
    .executeTakeFirstOrThrow()
}

const linkPublishedBlobToPage = async ({
  blobId,
  pageId,
}: {
  blobId: string
  pageId: string
}) => {
  const { publishedVersionId } = await db
    .selectFrom("Resource")
    .where("id", "=", pageId)
    .select("publishedVersionId")
    .executeTakeFirstOrThrow()

  return db
    .updateTable("Version")
    .where("Version.id", "=", publishedVersionId)
    .set({
      blobId,
    })
    .executeTakeFirstOrThrow()
}
