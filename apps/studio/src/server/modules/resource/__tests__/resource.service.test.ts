/* oxlint-disable typescript/no-unsafe-type-assertion, unicorn/no-await-expression-member, eslint/complexity -- server lint cleanup */
import { pick } from "lodash-es"
import { resetTables } from "tests/integration/helpers/db"
import {
  setupBlob,
  setupCollection,
  setupCollectionMeta,
  setupCollectionPage,
  setupFolder,
  setupFolderMeta,
  setupFullSite,
  setupPageResource,
  setupSite,
  setupUser,
} from "tests/integration/helpers/seed"
import { ResourceType } from "~prisma/generated/prisma/client"

import type { Resource } from "../../database/types"
import { db } from "../../database/database"
import { ResourceState } from "../../database/types"
import {
  getBatchAncestryWithSelfQuery,
  getFooter,
  getFullPageById,
  getLocalisedSitemap,
  getNavBar,
  getPageById,
  getSearchResults,
  getSiteResourceById,
  getWithFullPermalink,
  updateBlobById,
  updatePageById,
} from "../resource.service"
import { PAGE_BLOB } from "./constants"

describe("resource.service", () => {
  // Deferred: Implement tests when publish works
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
        resourceIds: ["99999"],
        // non-existent id
        siteId: site.id,
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
        resourceIds: [page.id],
        siteId: site.id,
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
        resourceIds: [page.id],
        siteId: site.id,
      })

      // Assert
      expect(result).toEqual([
        [
          {
            id: page.id,
            parentId: page.parentId,
            permalink: page.permalink,
            title: page.title,
            type: page.type,
          },
        ],
      ])
    })

    it("should return ancestry path for nested resources", async () => {
      // Arrange
      const { site } = await setupSite()
      const { folder: parentFolder } = await setupFolder({
        parentId: null,
        permalink: "parent-folder",
        siteId: site.id,
        title: "Parent folder",
      })
      const { folder: childFolder } = await setupFolder({
        parentId: parentFolder.id,
        permalink: "child-folder",
        siteId: site.id,
        title: "Child folder",
      })
      const { page: grandChildPage } = await setupPageResource({
        parentId: childFolder.id,
        permalink: "grand-child-page",
        resourceType: ResourceType.Page,
        siteId: site.id,
        title: "Grand child page",
      })

      // Act
      const result = await getBatchAncestryWithSelfQuery({
        resourceIds: [grandChildPage.id],
        siteId: site.id,
      })

      // Assert
      expect(result).toEqual([
        [
          {
            id: parentFolder.id,
            parentId: parentFolder.parentId,
            permalink: parentFolder.permalink,
            title: parentFolder.title,
            type: parentFolder.type,
          },
          {
            id: childFolder.id,
            parentId: childFolder.parentId,
            permalink: childFolder.permalink,
            title: childFolder.title,
            type: childFolder.type,
          },
          {
            id: grandChildPage.id,
            parentId: grandChildPage.parentId,
            permalink: grandChildPage.permalink,
            title: grandChildPage.title,
            type: grandChildPage.type,
          },
        ],
      ])
    })

    it("should return multiple ancestry paths for multiple resources", async () => {
      // Arrange
      const { site } = await setupSite()

      // First path
      const { folder: folder1 } = await setupFolder({
        parentId: null,
        permalink: "folder-1",
        siteId: site.id,
        title: "Folder 1",
      })
      const { page: page1 } = await setupPageResource({
        parentId: folder1.id,
        permalink: "page-1",
        resourceType: ResourceType.Page,
        siteId: site.id,
        title: "Page 1",
      })

      // Second path
      const { folder: folder2 } = await setupFolder({
        parentId: null,
        permalink: "folder-2",
        siteId: site.id,
        title: "Folder 2",
      })
      const { page: page2 } = await setupPageResource({
        parentId: folder2.id,
        permalink: "page-2",
        resourceType: ResourceType.Page,
        siteId: site.id,
        title: "Page 2",
      })

      // Act
      const result = await getBatchAncestryWithSelfQuery({
        resourceIds: [page1.id, page2.id],
        siteId: site.id,
      })

      // Assert
      expect(result).toEqual([
        [
          {
            id: folder1.id,
            parentId: folder1.parentId,
            permalink: folder1.permalink,
            title: folder1.title,
            type: folder1.type,
          },
          {
            id: page1.id,
            parentId: page1.parentId,
            permalink: page1.permalink,
            title: page1.title,
            type: page1.type,
          },
        ],
        [
          {
            id: folder2.id,
            parentId: folder2.parentId,
            permalink: folder2.permalink,
            title: folder2.title,
            type: folder2.type,
          },
          {
            id: page2.id,
            parentId: page2.parentId,
            permalink: page2.permalink,
            title: page2.title,
            type: page2.type,
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
        resourceIds: [page1.id],
        siteId: site1.id,
      })

      // Assert
      expect(result).toEqual([
        [
          {
            id: page1.id,
            parentId: page1.parentId,
            permalink: page1.permalink,
            title: page1.title,
            type: page1.type,
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
        resourceId: actualPage.id,
        siteId: actualSiteId,
      })

      // Assert
      expect(result).toMatchObject(actualPage)
    })

    it("should return the resource with the given `id` and `type`", async () => {
      // Act
      const result = await getSiteResourceById({
        resourceId: actualPage.id,
        siteId: actualSiteId,
        type: "Page",
      })

      // Assert
      expect(result).toMatchObject(actualPage)
    })

    it("should return undefined if no resource with the given id exists", async () => {
      // Act
      const result = await getSiteResourceById({
        resourceId: "999999",
        siteId: actualSiteId,
      })

      // Assert
      expect(result).toBeUndefined()
    })

    it("should return undefined if the resource with the given `id` does not match given `type`", async () => {
      // Arrange
      expect(actualPage.type).not.toEqual("Folder")

      // Act
      const result = await getSiteResourceById({
        resourceId: actualPage.id,
        siteId: actualSiteId,
        type: "Folder",
      })

      // Assert
      expect(result).toBeUndefined()
    })

    it("should return undefined if the resource with the given `id` does not belong to the given `siteId`", async () => {
      // Arrange
      expect(actualPage.siteId).not.toEqual(99_999)

      // Act
      const result = await getSiteResourceById({
        resourceId: actualPage.id,
        siteId: 99_999,
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
        resourceId: Number(actualPage.id),
        siteId: site.id,
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
        resourceId: Number(actualPage.id),
        siteId: site.id,
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
      expect(page.id).not.toEqual(99_999)

      // Act
      const result = await getFullPageById(db, {
        resourceId: 99_999,
        siteId: site.id,
      })

      // Assert
      expect(result).toBeUndefined()
    })

    it("should return undefined if resource with given `resourceId` does not belong to the given `siteId`", async () => {
      // Arrange
      const { page } = await setupPageResource({
        resourceType: "Page",
      })
      expect(page.siteId).not.toEqual(99_999)

      // Act
      const result = await getFullPageById(db, {
        resourceId: Number(page.id),
        siteId: 99_999,
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
        resourceId: Number(page.id),
        siteId: site.id,
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
        resourceId: Number(rootPage.id),
        siteId: site.id,
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
        resourceId: Number(collectionPage.id),
        siteId: site.id,
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
        resourceId: Number(page.id),
        siteId: site.id,
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
        resourceId: 99_999,
        siteId: site.id,
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
        resourceId: Number(page.id),
        siteId: 99_999,
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
          id: 99_999,
          siteId: site.id,
          title: "Updated Title",
        },
        db,
      )

      // Assert
      expect(result).not.toBeDefined()
    })

    it("should update the page successfully", async () => {
      // Arrange
      const { site, page } = await setupPageResource({
        resourceType: "Page",
      })

      // Act
      const result = await updatePageById(
        {
          id: Number(page.id),
          siteId: site.id,
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
      expect(result).toBeDefined()
    })

    it("should do nothing when the page does not exist", async () => {
      // Arrange
      const { site } = await setupSite()

      // Act
      const result = await updatePageById(
        {
          id: 2,
          siteId: site.id,
        },
        db,
      )

      // Assert
      expect(result).not.toBeDefined()
    })

    it("should fail when the parent does not exist", async () => {
      // Arrange
      const { site, page } = await setupPageResource({
        resourceType: "Page",
      })

      // Act
      const result = updatePageById(
        {
          id: Number(page.id),
          parentId: -1,
          siteId: site.id,
        },
        db,
      )

      // Assert
      await expect(result).rejects.toThrow()
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
      const result = db.transaction().execute(
        async (tx) =>
          await updateBlobById(tx, {
            siteId: site.id,
            pageId: 99_999,
            content: PAGE_BLOB,
          }),
      )

      // Assert
      await expect(result).rejects.toThrow()
    })

    it("should create a draft blob if the page is already published", async () => {
      // Arrange
      const user = await setupUser({})
      const { page } = await setupPageResource({
        permalink: "another_permalink",
        resourceType: ResourceType.Page,
        siteId: site.id,
        state: ResourceState.Published,
        userId: user.id,
      })
      expect(page.draftBlobId).toBeNull()
      const publishedBlob = await setupBlob()
      await linkPublishedBlobToPage({
        blobId: publishedBlob.id,
        pageId: page.id,
      })

      // Act
      await db.transaction().execute(
        async (tx) =>
          await updateBlobById(tx, {
            siteId: site.id,
            pageId: Number(page.id),
            content: PAGE_BLOB,
          }),
      )

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
        resourceType: ResourceType.Page,
        siteId: site.id,
      })
      await linkDraftBlobToPage({ blobId: blob.id, pageId: page.id })

      // Act
      await db.transaction().execute(
        async (tx) =>
          await updateBlobById(tx, {
            siteId: site.id,
            pageId: Number(page.id),
            content: PAGE_BLOB,
          }),
      )

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
        resourceType: ResourceType.Page,
        siteId: site.id,
      })
      // Act
      const result = db.transaction().execute(
        async (tx) =>
          await updateBlobById(tx, {
            siteId: 99_999,
            pageId: Number(page.id),
            content: PAGE_BLOB,
          }),
      )

      // Assert
      await expect(result).rejects.toThrow()
    })
  })

  describe("getNavBar", () => {
    it("should return the nav bar for the given site", async () => {
      // Arrange
      const { site } = await setupSite()
      // Act
      const result = await getNavBar(db, site.id)
      // Assert
      expect(result).toBeDefined()
      expect(result.siteId).toBe(site.id)
    })

    it("should throw an error if the `siteId` is not found", async () => {
      // Act
      const result = getNavBar(db, 99_999)
      // Assert
      await expect(result).rejects.toThrow()
    })
  })

  describe("getFooter", () => {
    it("should return the footer for the given site", async () => {
      // Arrange
      const { site } = await setupSite()
      // Act
      const result = await getFooter(db, site.id)
      // Assert
      expect(result).toBeDefined()
      expect(result.siteId).toBe(site.id)
    })

    it("should throw an error if the `siteId` is not found", async () => {
      // Act
      const result = getFooter(db, 99_999)
      // Assert
      await expect(result).rejects.toThrow()
    })
  })

  describe("getLocalisedSitemap", () => {
    beforeEach(async () => {
      await resetTables("Site", "Resource", "Blob", "Version", "User")
    })

    it("should throw an error if `siteId` is not found", async () => {
      // Arrange
      const { page } = await setupPageResource({ resourceType: "Page" })

      // Act
      const result = getLocalisedSitemap(9999, Number(page.id))

      // Assert
      await expect(result).rejects.toThrow()
    })

    it("should throw an error if the `resourceId` doesn't exist", async () => {
      // Arrange
      const { site } = await setupSite()
      // Act
      const result = getLocalisedSitemap(site.id, 99_999)
      // Assert
      await expect(result).rejects.toThrow()
    })

    it("should return the path from ancestor to the page (DRAFT), together with its siblings", async () => {
      // Arrange
      const { site, folder: parentFolder } = await setupFolder({})
      const { page: rootPage } = await setupPageResource({
        resourceType: "RootPage",
        siteId: site.id,
      })
      const { page: childPage } = await setupPageResource({
        parentId: parentFolder.id,
        resourceType: "Page",
        siteId: site.id,
        state: ResourceState.Draft,
        // explicitly set to draft,
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
        parentId: parentFolder.id,
        resourceType: "Page",
        siteId: site.id,
        state: ResourceState.Published,
        userId: (await setupUser({})).id,
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
        folderId: rootFolder.id,
        siteId: site.id,
      })
      const { collectionMeta } = await setupCollectionMeta({
        collectionId: rootCollection.id,
        siteId: site.id,
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
        resourceType: ResourceType.RootPage,
        siteId: site.id,
      })

      // Act
      const result = await getLocalisedSitemap(site.id, Number(rootPage.id))

      // Assert
      expect(result).toBeDefined()
      expect(result.id).toBe(rootPage.id)
      expect(result.permalink).toBe("/")
    })

    it("should not return folder indexpage's title when resourceId is a IndexPage (DRAFT)", async () => {
      // Arrange
      const { site } = await setupSite()
      await setupPageResource({
        resourceType: ResourceType.RootPage,
        // Pre-requisite
        siteId: site.id,
      })
      const { folder } = await setupFolder({
        siteId: site.id,
        title: "HelloWorld",
      })
      const { page: indexPage, blob } = await setupPageResource({
        parentId: folder.id,
        resourceType: ResourceType.IndexPage,
        siteId: site.id,
        state: ResourceState.Draft,
        title: "HelloWorld",
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
      expect(child?.title).toBe(folder.title)
      // should be from the folder
      expect(child?.summary).toBe(`Pages in ${folder.title}`)
      // should not be from the index page
    })

    it("should return folder indexpage's title when resourceId is a IndexPage (PUBLISHED)", async () => {
      // Arrange
      const { site } = await setupSite()
      await setupPageResource({
        resourceType: ResourceType.RootPage,
        // Pre-requisite
        siteId: site.id,
      })
      const { folder } = await setupFolder({
        siteId: site.id,
      })
      const { page: indexPage, blob } = await setupPageResource({
        parentId: folder.id,
        resourceType: ResourceType.IndexPage,
        siteId: site.id,
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
      expect(child?.title).toBe(indexPage.title)
      // should be from the index page
      expect(child?.summary).toBe("Hello im the index page")
      // should be from the index page
    })

    it("should not return collection indexpage's title when resourceId is a IndexPage (DRAFT)", async () => {
      // Arrange
      const { site } = await setupSite()
      await setupPageResource({
        resourceType: ResourceType.RootPage,
        // Pre-requisite
        siteId: site.id,
      })
      const { collection } = await setupCollection({
        siteId: site.id,
        title: "HelloWorld",
      })
      const { page: indexPage, blob } = await setupPageResource({
        parentId: collection.id,
        resourceType: ResourceType.IndexPage,
        siteId: site.id,
        state: ResourceState.Draft,
        title: "HelloWorld",
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
      expect(child?.id).toBe(collection.id)
      // should be from the collection regardless
      expect(child?.permalink).toBe(`/${collection.permalink}`)
      expect(child?.title).toBe(collection.title)
      // should be from the collection
      expect(child?.summary).toBe(`Pages in ${collection.title}`)
      // should not be from the index page
    })

    it("should return collection indexpage's title when resourceId is a IndexPage (PUBLISHED)", async () => {
      // Arrange
      const { site } = await setupSite()
      await setupPageResource({
        resourceType: ResourceType.RootPage,
        // Pre-requisite
        siteId: site.id,
      })
      const { collection } = await setupCollection({
        siteId: site.id,
      })
      const { page: indexPage, blob } = await setupPageResource({
        parentId: collection.id,
        resourceType: ResourceType.IndexPage,
        siteId: site.id,
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
      expect(child?.id).toBe(collection.id)
      // should be from the collection regardless
      expect(child?.permalink).toBe(`/${collection.permalink}`)
      expect(child?.title).toBe(indexPage.title)
      // should be from the index page
      expect(child?.summary).toBe("Hello im the index page")
      // should be from the index page
    })

    it("should include children resources when resourceId is a IndexPage (PUBLISHED)", async () => {
      // Arrange
      const { site } = await setupSite()
      await setupPageResource({
        resourceType: ResourceType.RootPage,
        // Pre-requisite
        siteId: site.id,
      })

      const { folder: parentFolder } = await setupFolder({
        permalink: "parent-folder",
        siteId: site.id,
        title: "Parent Folder",
      })

      const { page: indexPage } = await setupPageResource({
        parentId: parentFolder.id,
        resourceType: ResourceType.IndexPage,
        siteId: site.id,
        state: ResourceState.Published,
        title: "Parent Folder",
        userId: (await setupUser({})).id,
      })

      const { page, blob: pageBlob } = await setupPageResource({
        parentId: parentFolder.id,
        permalink: "page-a",
        resourceType: ResourceType.Page,
        siteId: site.id,
        state: ResourceState.Published,
        userId: (await setupUser({})).id,
      })
      await db
        .updateTable("Blob")
        .where("id", "=", pageBlob.id)
        .set({
          content: {
            ...pageBlob.content,
            page: {
              image: {
                alt: "im a page blob image alt text",
                src: "https://pageblob.com",
              },
            },
          },
        })
        .execute()

      const { folder } = await setupFolder({
        parentId: parentFolder.id,
        permalink: "folder-a",
        siteId: site.id,
        state: ResourceState.Published,
        title: "Folder A",
      })

      const { blob: folderAIndexPageBlob } = await setupPageResource({
        parentId: folder.id,
        resourceType: ResourceType.IndexPage,
        siteId: site.id,
        state: ResourceState.Published,
        title: "Folder A",
        userId: (await setupUser({})).id,
      })
      await db
        .updateTable("Blob")
        .where("id", "=", folderAIndexPageBlob.id)
        .set({
          content: {
            ...folderAIndexPageBlob.content,
            page: {
              contentPageHeader: {
                summary: "Hello im the index page",
              },
              image: {
                alt: "im a index page blob image alt text",
                src: "https://indexpageblob.com",
              },
            },
          },
        })
        .execute()

      const { collection } = await setupCollection({
        parentId: parentFolder.id,
        permalink: "collection-a",
        siteId: site.id,
        state: ResourceState.Published,
        title: "Collection A",
      })

      // Act
      const result = await getLocalisedSitemap(site.id, Number(indexPage.id))

      // Assert
      const children = result.children?.at(0)?.children
      expect(children?.length).toBe(3)

      // Assert: Find Page in the sitemap
      const pageNode = result.children
        ?.at(0)
        ?.children?.find((child) => child.id === page.id)
      expect(pageNode?.title).toBe(page.title)
      expect(pageNode?.image?.src).toBe("https://pageblob.com")

      // Assert: Find Folder in the sitemap
      const folderNode = result.children
        ?.at(0)
        ?.children?.find((child) => child.id === folder.id)
      expect(folderNode?.title).toBe(folder.title)
      expect(folderNode?.summary).toBe("Hello im the index page")
      expect(folderNode?.image?.src).toBe("https://indexpageblob.com")

      // Assert: Find Collection in the sitemap
      const collectionNode = result.children
        ?.at(0)
        ?.children?.find((child) => child.id === collection.id)
      expect(collectionNode?.title).toBe(collection.title)
      expect(collectionNode?.summary).toBe(`Pages in ${collection.title}`)
      expect(collectionNode?.image?.src).toBeUndefined()
    })

    it("should include any nested collections if resourceId is a RootPage", async () => {
      // Arrange
      const { site } = await setupSite()

      const { page: rootPage } = await setupPageResource({
        resourceType: ResourceType.RootPage,
        // Pre-requisite
        siteId: site.id,
      })

      const { folder: parentFolder } = await setupFolder({
        permalink: "parent-folder",
        siteId: site.id,
        state: ResourceState.Published,
      })

      const { folder: childFolder } = await setupFolder({
        parentId: parentFolder.id,
        permalink: "child-folder",
        siteId: site.id,
        state: ResourceState.Published,
      })

      // Arrange: Create Child Collection without index page
      const { collection: collection1 } = await setupCollection({
        parentId: childFolder.id,
        permalink: "collection",
        siteId: site.id,
        state: ResourceState.Published,
        title: "Without Index Page",
      })

      // Arrange: Create Child Collection with index page
      const { collection: collection2 } = await setupCollection({
        parentId: childFolder.id,
        permalink: "collection-with-index-page",
        siteId: site.id,
        state: ResourceState.Published,
        title: "With Index Page",
      })
      const { blob: collection2IndexPageBlob } = await setupPageResource({
        parentId: collection2.id,
        resourceType: ResourceType.IndexPage,
        siteId: site.id,
        state: ResourceState.Published,
        title: "Collection 2 Index Page",
        userId: (await setupUser({})).id,
      })
      await db
        .updateTable("Blob")
        .where("id", "=", collection2IndexPageBlob.id)
        .set({
          content: {
            ...collection2IndexPageBlob.content,
            page: {
              contentPageHeader: {
                summary: "Hello im the index page",
              },
            },
          },
        })
        .execute()

      // Act
      const result = await getLocalisedSitemap(site.id, Number(rootPage.id))

      // Assert
      const parentFolderNode = result.children?.at(0)
      const childFolderChildren = parentFolderNode?.children?.at(0)?.children
      expect(childFolderChildren?.length).toBe(2)

      // Assert: Find Child Collection (Without Index Page) in the sitemap
      const collection1Node = childFolderChildren?.find(
        (child) => child.id === collection1.id,
      )
      expect(collection1Node?.title).toBe(collection1.title)
      expect(collection1Node?.summary).toBe(`Pages in ${collection1.title}`)

      // Assert: Find Child Collection (With Index Page) in the sitemap
      const collection2Node = childFolderChildren?.find(
        (child) => child.id === collection2.id,
      )
      expect(collection2Node?.title).toBe("Collection 2 Index Page")
      expect(collection2Node?.summary).toBe("Hello im the index page")
    })

    describe("childrenPagesOrdering", () => {
      it("should order children according to childrenPagesOrdering when viewing a Page resource", async () => {
        // Arrange
        const { site } = await setupSite()
        const user = await setupUser({})

        await setupPageResource({
          resourceType: ResourceType.RootPage,
          siteId: site.id,
        })

        const { folder: parentFolder } = await setupFolder({
          permalink: "parent-folder",
          siteId: site.id,
          state: ResourceState.Published,
        })

        // Create child pages with titles that would sort differently alphabetically
        const { page: pageA } = await setupPageResource({
          parentId: parentFolder.id,
          permalink: "zebra-page",
          resourceType: ResourceType.Page,
          siteId: site.id,
          state: ResourceState.Published,
          title: "Zebra Page",
          userId: user.id,
        })

        const { page: pageB } = await setupPageResource({
          parentId: parentFolder.id,
          permalink: "apple-page",
          resourceType: ResourceType.Page,
          siteId: site.id,
          state: ResourceState.Published,
          title: "Apple Page",
          userId: user.id,
        })

        const { page: pageC } = await setupPageResource({
          parentId: parentFolder.id,
          permalink: "mango-page",
          resourceType: ResourceType.Page,
          siteId: site.id,
          state: ResourceState.Published,
          title: "Mango Page",
          userId: user.id,
        })

        // Create index page with childrenPagesOrdering that puts Zebra first, then Mango
        const { blob: indexPageBlob } = await setupPageResource({
          parentId: parentFolder.id,
          resourceType: ResourceType.IndexPage,
          siteId: site.id,
          state: ResourceState.Published,
          title: "Parent Folder Index",
          userId: user.id,
        })

        // Set childrenPagesOrdering: Zebra, Mango (Apple not in ordering)
        await db
          .updateTable("Blob")
          .where("id", "=", indexPageBlob.id)
          .set({
            content: {
              ...indexPageBlob.content,
              content: [
                {
                  childrenPagesOrdering: [pageA.id, pageC.id],
                  showSummary: false,
                  showThumbnail: false,
                  type: "childrenpages",
                  variant: "boxes",
                },
              ],
            },
          })
          .execute()

        // Act: Get sitemap for one of the child pages
        const result = await getLocalisedSitemap(site.id, Number(pageB.id))

        // Assert: Children should be ordered as [Zebra, Mango, Apple]
        const parentNode = result.children?.find(
          (child) => child.id === parentFolder.id,
        )
        expect(parentNode).toBeDefined()
        const childIds = parentNode?.children?.map((child) => child.id)

        // Zebra (pageA) should be first, Mango (pageC) second, Apple (pageB) last
        expect(childIds).toEqual([pageA.id, pageC.id, pageB.id])
      })

      it("should fall back to alphabetical title sort for children not in ordering", async () => {
        // Arrange
        const { site } = await setupSite()
        const user = await setupUser({})

        await setupPageResource({
          resourceType: ResourceType.RootPage,
          siteId: site.id,
        })

        const { folder: parentFolder } = await setupFolder({
          permalink: "parent-folder",
          siteId: site.id,
          state: ResourceState.Published,
        })

        // Create pages - none will be in the ordering
        const { page: pageAlpha } = await setupPageResource({
          parentId: parentFolder.id,
          permalink: "alpha",
          resourceType: ResourceType.Page,
          siteId: site.id,
          state: ResourceState.Published,
          title: "Alpha",
          userId: user.id,
        })

        const { page: pageGamma } = await setupPageResource({
          parentId: parentFolder.id,
          permalink: "gamma",
          resourceType: ResourceType.Page,
          siteId: site.id,
          state: ResourceState.Published,
          title: "Gamma",
          userId: user.id,
        })

        const { page: pageBeta } = await setupPageResource({
          parentId: parentFolder.id,
          permalink: "beta",
          resourceType: ResourceType.Page,
          siteId: site.id,
          state: ResourceState.Published,
          title: "Beta",
          userId: user.id,
        })

        // Create index page with empty childrenPagesOrdering
        const { blob: indexPageBlob } = await setupPageResource({
          parentId: parentFolder.id,
          resourceType: ResourceType.IndexPage,
          siteId: site.id,
          state: ResourceState.Published,
          title: "Parent Folder Index",
          userId: user.id,
        })

        await db
          .updateTable("Blob")
          .where("id", "=", indexPageBlob.id)
          .set({
            content: {
              ...indexPageBlob.content,
              content: [
                {
                  childrenPagesOrdering: [],
                  showSummary: false,
                  showThumbnail: false,
                  type: "childrenpages",
                  variant: "boxes",
                },
              ],
            },
          })
          .execute()

        // Act
        const result = await getLocalisedSitemap(site.id, Number(pageAlpha.id))

        // Assert: Children should be alphabetically sorted by title
        const parentNode = result.children?.find(
          (child) => child.id === parentFolder.id,
        )
        const childIds = parentNode?.children?.map((child) => child.id)

        // Should be Alpha, Beta, Gamma (alphabetical)
        expect(childIds).toEqual([pageAlpha.id, pageBeta.id, pageGamma.id])
      })

      it("should only apply ordering at the correct parent node", async () => {
        // Arrange
        const { site } = await setupSite()
        const user = await setupUser({})

        await setupPageResource({
          resourceType: ResourceType.RootPage,
          siteId: site.id,
        })

        // Create parent folder
        const { folder: parentFolder } = await setupFolder({
          permalink: "parent-folder",
          siteId: site.id,
          state: ResourceState.Published,
          title: "Parent Folder",
        })

        // Create nested folder inside parent
        const { folder: nestedFolder } = await setupFolder({
          parentId: parentFolder.id,
          permalink: "nested-folder",
          siteId: site.id,
          state: ResourceState.Published,
          title: "Nested Folder",
        })

        // Create pages in nested folder
        const { page: nestedPageZ } = await setupPageResource({
          parentId: nestedFolder.id,
          permalink: "zebra",
          resourceType: ResourceType.Page,
          siteId: site.id,
          state: ResourceState.Published,
          title: "Zebra",
          userId: user.id,
        })

        const { page: nestedPageA } = await setupPageResource({
          parentId: nestedFolder.id,
          permalink: "apple",
          resourceType: ResourceType.Page,
          siteId: site.id,
          state: ResourceState.Published,
          title: "Apple",
          userId: user.id,
        })

        // Create index page for nested folder with specific ordering (Zebra first)
        const { blob: nestedIndexBlob } = await setupPageResource({
          parentId: nestedFolder.id,
          resourceType: ResourceType.IndexPage,
          siteId: site.id,
          state: ResourceState.Published,
          title: "Nested Folder Index",
          userId: user.id,
        })

        await db
          .updateTable("Blob")
          .where("id", "=", nestedIndexBlob.id)
          .set({
            content: {
              ...nestedIndexBlob.content,
              content: [
                {
                  childrenPagesOrdering: [nestedPageZ.id, nestedPageA.id],
                  showSummary: false,
                  showThumbnail: false,
                  type: "childrenpages",
                  variant: "boxes",
                },
              ],
            },
          })
          .execute()

        // Act: Get sitemap for a page in nested folder
        const result = await getLocalisedSitemap(
          site.id,
          Number(nestedPageZ.id),
        )

        // Assert: nested folder should have custom ordering (Zebra, Apple)
        const parentNode = result.children?.find(
          (child) => child.id === parentFolder.id,
        )
        const nestedNode = parentNode?.children?.find(
          (child) => child.id === nestedFolder.id,
        )
        const nestedChildIds = nestedNode?.children?.map((child) => child.id)
        expect(nestedChildIds).toEqual([nestedPageZ.id, nestedPageA.id])

        // Assert: The ordering is applied at the correct level (nestedFolder, not parentFolder)
        // parentFolder's direct children should not be affected by nestedFolder's ordering
      })

      it("should not apply ordering when viewing non-Page resources", async () => {
        // Arrange
        const { site } = await setupSite()
        const user = await setupUser({})

        const { page: rootPage } = await setupPageResource({
          resourceType: ResourceType.RootPage,
          siteId: site.id,
        })

        const { folder: parentFolder } = await setupFolder({
          permalink: "parent-folder",
          siteId: site.id,
          state: ResourceState.Published,
        })

        // Create index page with ordering
        const { blob: indexPageBlob } = await setupPageResource({
          parentId: parentFolder.id,
          resourceType: ResourceType.IndexPage,
          siteId: site.id,
          state: ResourceState.Published,
          title: "Parent Folder Index",
          userId: user.id,
        })

        await db
          .updateTable("Blob")
          .where("id", "=", indexPageBlob.id)
          .set({
            content: {
              ...indexPageBlob.content,
              content: [
                {
                  childrenPagesOrdering: ["some-id"],
                  showSummary: false,
                  showThumbnail: false,
                  type: "childrenpages",
                  variant: "boxes",
                },
              ],
            },
          })
          .execute()

        // Act: Get sitemap for RootPage (not a Page type)
        const result = await getLocalisedSitemap(site.id, Number(rootPage.id))

        // Assert: Should not throw and should return valid sitemap
        // The ordering logic only applies to Page resources with parentId
        expect(result).toBeDefined()
        expect(result.id).toBe(rootPage.id)
      })
    })

    describe("firstImage", () => {
      type SitemapNode = Awaited<ReturnType<typeof getLocalisedSitemap>>
      type PageBody = Awaited<
        ReturnType<typeof setupBlob>
      >["content"]["content"]

      const findNode = (
        node: SitemapNode,
        id: string,
      ): SitemapNode | undefined => {
        if (node.id === id) {
          return node
        }
        for (const child of node.children ?? []) {
          const found = findNode(child, id)
          if (found) {
            return found
          }
        }
        return undefined
      }

      // Publishes a collection item whose body is `content`, then returns it.
      // The collection's index page is previewed so that the items show up as
      // immediate siblings without going through the tag-mapping path.
      const setupCollectionWithItemBody = async (content: PageBody) => {
        const user = await setupUser({ isDeleted: false })
        const { site } = await setupSite()
        await setupPageResource({
          resourceType: ResourceType.RootPage,
          siteId: site.id,
        })
        const { collection } = await setupCollection({
          permalink: "test-collection",
          siteId: site.id,
          state: ResourceState.Published,
        })
        const { page: indexPage } = await setupPageResource({
          parentId: collection.id,
          resourceType: ResourceType.IndexPage,
          siteId: site.id,
          state: ResourceState.Published,
          userId: user.id,
        })
        const { page: item, blob } = await setupCollectionPage({
          parentId: collection.id,
          permalink: "an-article",
          siteId: site.id,
          state: ResourceState.Published,
          title: "An article",
          userId: user.id,
        })

        await db
          .updateTable("Blob")
          .where("id", "=", blob.id)
          .set({ content: { ...blob.content, content } })
          .execute()

        const sitemap = await getLocalisedSitemap(site.id, Number(indexPage.id))
        return findNode(sitemap, item.id)
      }

      it("should use the image that comes first in document order", async () => {
        // Arrange + Act: images are interleaved with prose so that picking any
        // image other than the earliest one yields a different src
        const node = await setupCollectionWithItemBody([
          { content: [], type: "prose" },
          { alt: "First image", src: "/first.jpg", type: "image" },
          { content: [], type: "prose" },
          { alt: "Second image", src: "/second.jpg", type: "image" },
          { alt: "Third image", src: "/third.jpg", type: "image" },
        ])

        // Assert
        expect(node?.firstImage).toEqual({
          alt: "First image",
          src: "/first.jpg",
        })
      })

      it("should not set firstImage when the body has no image block", async () => {
        // Arrange + Act
        const node = await setupCollectionWithItemBody([
          { content: [], type: "prose" },
        ])

        // Assert
        expect(node).toBeDefined()
        expect(node?.firstImage).toBeUndefined()
      })

      it("should fall back to an empty alt when the image block has none", async () => {
        // Arrange + Act
        // `alt` is required by the schema but nothing enforces it on the stored
        // JSON, so the cast reproduces a blob that omits it
        const node = await setupCollectionWithItemBody([
          // SAFETY: reproduces a stored blob that omits required image alt text.
          { src: "/no-alt.jpg", type: "image" } as PageBody[number],
        ])

        // Assert
        expect(node?.firstImage).toEqual({ alt: "", src: "/no-alt.jpg" })
      })

      it("should not set firstImage for non-article layouts", async () => {
        // Arrange: a regular content page whose body happens to contain an image
        const user = await setupUser({ isDeleted: false })
        const { site } = await setupSite()
        await setupPageResource({
          resourceType: ResourceType.RootPage,
          siteId: site.id,
        })
        const { folder } = await setupFolder({
          permalink: "a-folder",
          siteId: site.id,
          state: ResourceState.Published,
        })
        const { page: sibling } = await setupPageResource({
          parentId: folder.id,
          permalink: "sibling",
          resourceType: ResourceType.Page,
          siteId: site.id,
          state: ResourceState.Published,
          title: "Sibling",
          userId: user.id,
        })
        const { page: contentPage, blob } = await setupPageResource({
          parentId: folder.id,
          permalink: "with-image",
          resourceType: ResourceType.Page,
          siteId: site.id,
          state: ResourceState.Published,
          title: "With image",
          userId: user.id,
        })
        await db
          .updateTable("Blob")
          .where("id", "=", blob.id)
          .set({
            content: {
              ...blob.content,
              content: [{ alt: "Ignored", src: "/ignored.jpg", type: "image" }],
            },
          })
          .execute()

        // Act
        const sitemap = await getLocalisedSitemap(site.id, Number(sibling.id))

        // Assert
        const node = findNode(sitemap, contentPage.id)
        expect(node).toBeDefined()
        expect(node?.firstImage).toBeUndefined()
      })
    })
  })
  describe.skip("getResourcePermalinkTree", () => {})
  describe.skip("getResourceFullPermalink", () => {})
  describe.skip("publishResource", () => {})

  describe("getWithFullPermalink", () => {
    it("returns an empty array when given no resourceIds", async () => {
      const { site } = await setupSite()

      const result = await getWithFullPermalink({
        resourceIds: [],
        siteId: site.id,
      })

      expect(result).toEqual([])
    })

    it("returns the full permalink for a nested resource in the requested site", async () => {
      const { folder: parent, site } = await setupFolder({
        permalink: "parent-folder",
        title: "Parent folder",
      })
      const { folder: nested } = await setupFolder({
        parentId: parent.id,
        permalink: "nested-folder",
        siteId: site.id,
        title: "Nested folder",
      })
      const { page } = await setupPageResource({
        parentId: nested.id,
        resourceType: ResourceType.Page,
        siteId: site.id,
      })

      const result = await getWithFullPermalink({
        resourceIds: [page.id],
        siteId: site.id,
      })

      expect(result).toHaveLength(1)
      expect(result[0]).toMatchObject({
        fullPermalink: `${parent.permalink}/${nested.permalink}/${page.permalink}`,
        id: page.id,
        title: page.title,
      })
    })

    it("does not return resources from another site (site scoping)", async () => {
      // Two distinct sites, each with a page
      const { site: siteA, page: pageA } = await setupPageResource({
        resourceType: ResourceType.Page,
      })
      const { site: siteB, page: pageB } = await setupPageResource({
        resourceType: ResourceType.Page,
      })
      expect(siteA.id).not.toBe(siteB.id)

      // Asking for pageB but scoping by siteA must return nothing — the CTE
      // must not traverse other sites' trees.
      const crossSite = await getWithFullPermalink({
        resourceIds: [pageB.id],
        siteId: siteA.id,
      })
      expect(crossSite).toEqual([])

      // Sanity: the same call with the correct siteId still works.
      const sameSite = await getWithFullPermalink({
        resourceIds: [pageA.id],
        siteId: siteA.id,
      })
      expect(sameSite).toHaveLength(1)
      expect(sameSite[0]?.id).toBe(pageA.id)
    })
  })

  describe("getSearchResults", () => {
    it("returns an empty array when given no resourceTypes", async () => {
      //Arrange
      const { site } = await setupPageResource({
        resourceType: ResourceType.Page,
      })

      //Search with no resourceTypes
      const result = await getSearchResults({
        limit: 10,
        offset: 0,
        query: "test",
        resourceTypes: [],
        siteId: site.id,
      })

      //Should return empty array, with totalCount 0
      expect(result.resources).toEqual([])
      expect(result.totalCount).toEqual(0)
    })
  })

  describe.skip("getSearchRecentlyEdited", () => {})
  describe.skip("getSearchWithResourceIds", () => {})
})

const linkDraftBlobToPage = async ({
  blobId,
  pageId,
}: {
  blobId: string
  pageId: string
}) =>
  await db
    .updateTable("Resource")
    .where("id", "=", pageId)
    .set({
      draftBlobId: blobId,
    })
    .executeTakeFirstOrThrow()

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

  return await db
    .updateTable("Version")
    .where("Version.id", "=", publishedVersionId)
    .set({
      blobId,
    })
    .executeTakeFirstOrThrow()
}
