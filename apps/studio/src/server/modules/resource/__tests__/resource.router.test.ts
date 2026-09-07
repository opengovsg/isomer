import { TRPCError } from "@trpc/server"
import { omit, pick } from "lodash-es"
import { auth } from "tests/integration/helpers/auth"
import { resetTables } from "tests/integration/helpers/db"
import {
  applyAuthedSession,
  applySession,
  createMockRequest,
} from "tests/integration/helpers/iron-session"
import {
  setupAdminPermissions,
  setupBlob,
  setupCollection,
  setupCollectionLink,
  setupCollectionMeta,
  setupCollectionPage,
  setupEditorPermissions,
  setupFolder,
  setupFolderMeta,
  setupPageResource,
  setupSite,
  setupUser,
  setUpWhitelist,
} from "tests/integration/helpers/seed"
import { USER_VIEWABLE_RESOURCE_TYPES } from "~/constants/resources"
import { MAX_BATCH_RESOURCE_IDS } from "~/schemas/resource"
import * as auditService from "~/server/modules/audit/audit.service"
import { createCallerFactory } from "~/server/trpc"
import { ResourceState, ResourceType } from "~prisma/generated/generatedEnums"

import { db } from "../../database/database"
import { resourceRouter } from "../resource.router"
import { getFullPageById } from "../resource.service"

const createCaller = createCallerFactory(resourceRouter)

const makeResourceIds = (count: number): string[] =>
  Array.from({ length: count }, (_, index) => `${index + 1}`)

describe("resource.router", async () => {
  let caller: ReturnType<typeof createCaller>
  const session = await applyAuthedSession()

  const TEST_VALID_EMAIL = "test@open.gov.sg"

  beforeAll(async () => {
    caller = createCaller(createMockRequest(session))
    await setUpWhitelist({ email: TEST_VALID_EMAIL })
  })

  beforeEach(async () => {
    await resetTables(
      "Blob",
      "AuditLog",
      "Resource",
      "Site",
      "Version",
      "User",
      "ResourcePermission",
    )
    const user = await setupUser({
      email: "test@mock.com",
      isDeleted: false,
      userId: session.userId,
    })
    await auth(user)
  })

  describe("getMetadataById", () => {
    it("should throw 401 if not logged in", async () => {
      // Arrange
      const unauthedSession = applySession()
      const unauthedCaller = createCaller(createMockRequest(unauthedSession))

      // Act
      const result = unauthedCaller.getMetadataById({
        resourceId: "1",
        siteId: 1,
      })

      // Assert
      await expect(result).rejects.toThrow(
        new TRPCError({ code: "UNAUTHORIZED" }),
      )
    })

    it("should return 404 if resource does not exist", async () => {
      // Arrange
      const { site } = await setupSite()
      await setupAdminPermissions({
        siteId: site.id,
        userId: session.userId,
      })

      // Act
      const result = caller.getMetadataById({
        resourceId: "1",
        siteId: site.id,
      })

      // Assert
      await expect(result).rejects.toThrow(
        new TRPCError({
          code: "NOT_FOUND",
          message: "Resource not found",
        }),
      )
    })

    it("should return metadata if page resource exists", async () => {
      // Arrange
      const { site, page } = await setupPageResource({
        resourceType: "Page",
      })
      await setupEditorPermissions({
        siteId: site.id,
        userId: session.userId,
      })

      // Act
      const result = caller.getMetadataById({
        resourceId: page.id,
        siteId: site.id,
      })

      // Assert
      const expected = {
        id: page.id,
        parentId: page.parentId,
        permalink: page.permalink,
        title: page.title,
        type: "Page",
      }
      await expect(result).resolves.toMatchObject(expected)
    })

    it("should throw 403 if user does not have read access to site", async () => {
      // Arrange
      const { site, page } = await setupPageResource({
        resourceType: "Page",
      })

      // Act
      const result = caller.getMetadataById({
        resourceId: page.id,
        siteId: site.id,
      })

      // Assert
      await expect(result).rejects.toThrow(
        new TRPCError({
          code: "FORBIDDEN",
          message:
            "You do not have sufficient permissions to perform this action",
        }),
      )
    })

    it.skip("should throw 403 if user does not have read access to resource", async () => {})
  })

  describe("getFolderChildrenOf", () => {
    it("should throw 401 if not logged in", async () => {
      // Arrange
      const unauthedSession = applySession()
      const unauthedCaller = createCaller(createMockRequest(unauthedSession))

      // Act
      const result = unauthedCaller.getFolderChildrenOf({
        limit: 25,
        resourceId: "1",
        siteId: "1",
      })

      // Assert
      await expect(result).rejects.toThrow(
        new TRPCError({ code: "UNAUTHORIZED" }),
      )
    })

    it("should return 404 if resource does not exist", async () => {
      // Arrange
      const { site } = await setupSite()
      await setupEditorPermissions({
        siteId: site.id,
        userId: session.userId,
      })

      // Act
      const result = caller.getFolderChildrenOf({
        limit: 25,
        resourceId: "1",
        siteId: String(site.id),
      })

      // Assert
      await expect(result).rejects.toThrow(
        new TRPCError({
          code: "NOT_FOUND",
          message: "Resource not found",
        }),
      )
    })

    it("should return 404 if resource is not a folder", async () => {
      // Arrange
      const { site, page } = await setupPageResource({
        resourceType: "Page",
      })
      await setupEditorPermissions({
        siteId: site.id,
        userId: session.userId,
      })

      // Act
      const result = caller.getFolderChildrenOf({
        resourceId: page.id,
        siteId: String(site.id),
      })

      // Assert
      await expect(result).rejects.toThrow(new TRPCError({ code: "NOT_FOUND" }))
    })

    it("should return empty items array if `cursor` is invalid", async () => {
      // Arrange
      const { site } = await setupSite()
      const { folder } = await setupFolder({
        parentId: null,
        permalink: "parent-folder",
        siteId: site.id,
        title: "Parent folder",
      })
      await setupEditorPermissions({
        siteId: site.id,
        userId: session.userId,
      })

      // Act
      const result = await caller.getFolderChildrenOf({
        cursor: 600, // does not exist
        resourceId: folder.id,
        siteId: String(site.id),
      })

      // Assert
      const expected = {
        items: [],
        nextOffset: null,
      }
      expect(result).toMatchObject(expected)
    })

    it("should return first-level folders if resourceId is null", async () => {
      // Arrange
      const { site } = await setupSite()
      const rootLevelFolders = await Promise.all(
        Array.from({ length: 30 }, (_, i) => i).map(async (i) => {
          const { folder } = await setupFolder({
            parentId: null,
            permalink: `folder-${i}`,
            siteId: site.id,
            title: `Test folder ${i}`,
          })
          return pick(folder, ["title", "permalink", "type", "id"])
        }),
      )
      // Extra resources to assert that they are not returned
      await setupPageResource({
        resourceType: "Page",
        siteId: site.id,
      })
      await setupPageResource({
        parentId: rootLevelFolders[3]!.id,
        resourceType: "Page",
        siteId: site.id,
      })
      await setupEditorPermissions({
        siteId: site.id,
        userId: session.userId,
      })

      // Act
      const result = caller.getFolderChildrenOf({
        resourceId: null,
        siteId: String(site.id),
      })

      // Assert
      const expected = {
        items: rootLevelFolders
          .sort((a, b) => a.title.localeCompare(b.title)) // should be sorted by title
          .slice(0, 10), // should only have 10 items
        nextOffset: 10, // default limit is 10
      }
      await expect(result).resolves.toMatchObject(expected)
    })

    it("should return folder children if resourceId is given", async () => {
      // Arrange
      const { site } = await setupSite()
      const { folder: parentFolder } = await setupFolder({
        parentId: null,
        permalink: "parent-folder",
        siteId: site.id,
        title: "Parent folder",
      })
      const childFolders = await Promise.all(
        Array.from({ length: 30 }, (_, i) => i).map(async (i) => {
          const { folder } = await setupFolder({
            parentId: parentFolder.id,
            permalink: `child-folder-${i}`,
            siteId: site.id,
            title: `Child folder ${i}`,
          })
          return pick(folder, ["title", "permalink", "type", "id"])
        }),
      )
      await setupEditorPermissions({
        siteId: site.id,
        userId: session.userId,
      })

      // Act
      const result = caller.getFolderChildrenOf({
        resourceId: parentFolder.id,
        siteId: String(site.id),
      })

      // Assert
      const expected = {
        items: childFolders
          .sort((a, b) => a.title.localeCompare(b.title)) // should be sorted by title
          .slice(0, 10), // should only have 10 items
        nextOffset: 10, // default limit is 10
      }
      await expect(result).resolves.toMatchObject(expected)
    })

    it("should return limit number of folders according to the the `limit` parameter", async () => {
      // Arrange
      const setLimit = 5
      const { site } = await setupSite()
      const { folder: parentFolder } = await setupFolder({
        parentId: null,
        permalink: "parent-folder",
        siteId: site.id,
        title: "Parent folder",
      })
      const childFolders = await Promise.all(
        Array.from({ length: 30 }, (_, i) => i).map(async (i) => {
          const { folder } = await setupFolder({
            parentId: parentFolder.id,
            permalink: `child-folder-${i}`,
            siteId: site.id,
            title: `Child folder ${i}`,
          })
          return pick(folder, ["title", "permalink", "type", "id"])
        }),
      )
      await setupEditorPermissions({
        siteId: site.id,
        userId: session.userId,
      })

      // Act
      const result = caller.getFolderChildrenOf({
        limit: setLimit,
        resourceId: parentFolder.id,
        siteId: String(site.id),
      })

      // Assert
      const expected = {
        items: childFolders
          .sort((a, b) => a.title.localeCompare(b.title)) // should be sorted by title
          .slice(0, setLimit), // should only have 5 items
        nextOffset: setLimit, // limit is 5
      }
      await expect(result).resolves.toMatchObject(expected)
    })

    it("should return the next set of folders if valid `cursor` is provided", async () => {
      // Arrange
      const cursor = 5
      const nextLimit = 10
      const { site } = await setupSite()
      const { folder: parentFolder } = await setupFolder({
        parentId: null,
        permalink: "parent-folder",
        siteId: site.id,
        title: "Parent folder",
      })
      const childFolders = await Promise.all(
        Array.from({ length: 30 }, (_, i) => i).map(async (i) => {
          const { folder } = await setupFolder({
            parentId: parentFolder.id,
            permalink: `child-folder-${i}`,
            siteId: site.id,
            title: `Child folder ${i}`,
          })
          return pick(folder, ["title", "permalink", "type", "id"])
        }),
      )
      await setupEditorPermissions({
        siteId: site.id,
        userId: session.userId,
      })

      // Act
      const result = await caller.getFolderChildrenOf({
        cursor,
        limit: nextLimit,
        resourceId: parentFolder.id,
        siteId: String(site.id),
      })

      // Assert
      const expected = {
        items: childFolders
          .sort((a, b) => a.title.localeCompare(b.title)) // should be sorted by title
          .slice(cursor, cursor + nextLimit), // should only have 5 items
        nextOffset: cursor + nextLimit, // limit is 5
      }
      expect(result).toMatchObject(expected)
    })

    it("should return all items if limit is greater than the number of items", async () => {
      // Arrange
      const setLimit = 5
      const numberOfItems = 3
      const { site } = await setupSite()
      const { folder: parentFolder } = await setupFolder({
        parentId: null,
        permalink: "parent-folder",
        siteId: site.id,
        title: "Parent folder",
      })
      const childFolders = await Promise.all(
        Array.from({ length: numberOfItems }, (_, i) => i).map(async (i) => {
          const { folder } = await setupFolder({
            parentId: parentFolder.id,
            permalink: `child-folder-${i}`,
            siteId: site.id,
            title: `Child folder ${i}`,
          })
          return pick(folder, ["title", "permalink", "type", "id"])
        }),
      )
      await setupEditorPermissions({
        siteId: site.id,
        userId: session.userId,
      })

      // Act
      const result = await caller.getFolderChildrenOf({
        limit: setLimit,
        resourceId: parentFolder.id,
        siteId: String(site.id),
      })

      // Assert
      const expected = {
        items: childFolders.sort((a, b) => a.title.localeCompare(b.title)), // should be sorted by title
        nextOffset: null,
      }
      expect(result).toMatchObject(expected)
    })

    it("should throw 403 if user does not have read access to site", async () => {
      // Arrange
      const { site } = await setupSite()

      // Act
      const result = caller.getFolderChildrenOf({
        resourceId: null,
        siteId: String(site.id),
      })

      // Assert
      await expect(result).rejects.toThrow(
        new TRPCError({
          code: "FORBIDDEN",
          message:
            "You do not have sufficient permissions to perform this action",
        }),
      )
    })

    it.skip("should throw 403 if user does not have read access to resource", async () => {})
  })

  describe("getChildrenOf", () => {
    it("should throw 401 if not logged in", async () => {
      // Arrange
      const unauthedSession = applySession()
      const unauthedCaller = createCaller(createMockRequest(unauthedSession))

      // Act
      const result = unauthedCaller.getChildrenOf({
        limit: 25,
        resourceId: "1",
        siteId: "1",
      })

      // Assert
      await expect(result).rejects.toThrow(
        new TRPCError({ code: "UNAUTHORIZED" }),
      )
    })

    it("should return 404 if resource does not exist", async () => {
      // Arrange
      const { site } = await setupSite()
      await setupEditorPermissions({
        siteId: site.id,
        userId: session.userId,
      })

      // Act
      const result = caller.getChildrenOf({
        limit: 25,
        resourceId: "1",
        siteId: String(site.id),
      })

      // Assert
      await expect(result).rejects.toThrow(
        new TRPCError({
          code: "NOT_FOUND",
          message: "Resource not found",
        }),
      )
    })

    it("should return 404 if resource is not a folder", async () => {
      // Arrange
      const { site, page } = await setupPageResource({
        resourceType: "Page",
      })
      await setupEditorPermissions({
        siteId: site.id,
        userId: session.userId,
      })

      // Act
      const result = caller.getChildrenOf({
        resourceId: page.id,
        siteId: String(site.id),
      })

      // Assert
      await expect(result).rejects.toThrow(new TRPCError({ code: "NOT_FOUND" }))
    })

    it("should not return RootPage as its own children", async () => {
      // Arrange
      const { site } = await setupSite()
      // Create a root page
      await setupPageResource({
        resourceType: "RootPage",
        siteId: site.id,
        title: "___Root page, should not be returned",
      })
      // Create first-level pages
      const childPages = await Promise.all(
        Array.from({ length: 3 }, (_, i) => i).map(async (i) => {
          const { page } = await setupPageResource({
            permalink: `child-page-${i}`,
            resourceType: "Page",
            siteId: site.id,
            title: `Child page ${i}`,
          })
          return pick(page, ["title", "permalink", "type", "id"])
        }),
      )
      await setupEditorPermissions({
        siteId: site.id,
        userId: session.userId,
      })

      // Act
      const result = await caller.getChildrenOf({
        resourceId: null,
        siteId: String(site.id),
      })

      // Assert
      const expected = {
        // should not have rootPage returned
        items: childPages.sort((a, b) => a.title.localeCompare(b.title)),
        nextOffset: null,
      }
      expect(result).toMatchObject(expected)
    })

    it("should only hide the default Search page when requested", async () => {
      // Arrange
      const { site } = await setupSite()
      await setupPageResource({
        permalink: "search",
        resourceType: "Page",
        siteId: site.id,
        title: "Search",
      })
      await setupPageResource({
        permalink: "about",
        resourceType: "Page",
        siteId: site.id,
        title: "About",
      })
      await setupEditorPermissions({
        siteId: site.id,
        userId: session.userId,
      })

      // Act
      const linkPickerResult = await caller.getChildrenOf({
        resourceId: null,
        siteId: String(site.id),
      })
      const directorySidebarResult = await caller.getChildrenOf({
        includeSearchPage: false,
        resourceId: null,
        siteId: String(site.id),
      })

      // Assert
      expect(linkPickerResult.items.map(({ permalink }) => permalink)).toEqual([
        "about",
        "search",
      ])
      expect(
        directorySidebarResult.items.map(({ permalink }) => permalink),
      ).toEqual(["about"])
    })

    it("should not return FolderMeta, CollectionMeta, and CollectionLink as children", async () => {
      // Arrange
      const { site } = await setupSite()
      // Create a folder
      const { folder } = await setupFolder({
        parentId: null,
        permalink: "parent-folder",
        siteId: site.id,
        title: "Parent folder",
      })
      const { collection } = await setupCollection({
        siteId: site.id,
      })
      // Create FolderMeta, CollectionMeta, and CollectionLink
      await setupFolderMeta({
        folderId: folder.id,
        siteId: site.id,
      })
      await setupCollectionMeta({
        collectionId: collection.id,
        siteId: site.id,
      })
      await setupCollectionLink({
        collectionId: collection.id,
        siteId: site.id,
        title: "Collection Link",
      })
      // Create children pages of folder
      const childPages = await Promise.all(
        Array.from({ length: 3 }, (_, i) => i).map(async (i) => {
          const { page } = await setupPageResource({
            parentId: folder.id,
            permalink: `child-page-${i}`,
            resourceType: "Page",
            siteId: site.id,
            title: `Child page ${i}`,
          })
          return pick(page, ["title", "permalink", "type", "id"])
        }),
      )
      // Create children pages of collection
      const childCollectionPages = await Promise.all(
        Array.from({ length: 3 }, (_, i) => i).map(async (i) => {
          const { page } = await setupPageResource({
            parentId: collection.id,
            permalink: `collection-child-page-${i}`,
            resourceType: "Page",
            siteId: site.id,
            title: `Collection Child page ${i}`,
          })
          return pick(page, ["title", "permalink", "type", "id"])
        }),
      )
      await setupEditorPermissions({
        siteId: site.id,
        userId: session.userId,
      })

      // Act
      const resultFolder = await caller.getChildrenOf({
        resourceId: folder.id,
        siteId: String(site.id),
      })
      const resultCollection = await caller.getChildrenOf({
        resourceId: collection.id,
        siteId: String(site.id),
      })

      // Assert
      const expectedFolder = {
        items: childPages.sort((a, b) => a.title.localeCompare(b.title)),
        nextOffset: null,
      }
      const expectedCollection = {
        items: childCollectionPages.sort((a, b) =>
          a.title.localeCompare(b.title),
        ),
        nextOffset: null,
      }
      expect(resultFolder).toMatchObject(expectedFolder)
      expect(resultCollection).toMatchObject(expectedCollection)
    })

    it("should return empty items array if `cursor` is invalid", async () => {
      // Arrange
      const { site } = await setupSite()
      const { folder } = await setupFolder({
        parentId: null,
        permalink: "parent-folder",
        siteId: site.id,
        title: "Parent folder",
      })
      await setupEditorPermissions({
        siteId: site.id,
        userId: session.userId,
      })

      // Act
      const result = await caller.getChildrenOf({
        cursor: 600, // does not exist
        resourceId: folder.id,
        siteId: String(site.id),
      })

      // Assert
      const expected = {
        items: [],
        nextOffset: null,
      }
      expect(result).toMatchObject(expected)
    })

    it("should return first-level children if resourceId is null", async () => {
      // Arrange
      const { site } = await setupSite()
      const rootLevelFolders = await Promise.all(
        Array.from({ length: 15 }, (_, i) => i).map(async (i) => {
          const { folder } = await setupFolder({
            parentId: null,
            permalink: `folder-${i}`,
            siteId: site.id,
            title: `Test folder ${i}`,
          })
          return pick(folder, ["title", "permalink", "type", "id"])
        }),
      )
      // Extra root-level resources to assert that they are also returned
      const { page: rootLevelPage } = await setupPageResource({
        resourceType: "Page",
        siteId: site.id,
        title: "__this should be returned",
      })

      // Extra nested resources to assert these are not returned
      await setupPageResource({
        parentId: rootLevelFolders[3]!.id,
        resourceType: "Page",
        siteId: site.id,
        title: "__this should not return",
      })
      await setupEditorPermissions({
        siteId: site.id,
        userId: session.userId,
      })

      // Act
      const result = await caller.getChildrenOf({
        resourceId: null,
        siteId: String(site.id),
      })

      // Assert
      const expected = {
        items: [
          ...rootLevelFolders,
          pick(rootLevelPage, ["title", "permalink", "type", "id"]),
        ]
          // case sensitive sort to follow db order
          .sort((a, b) => a.title.localeCompare(b.title))
          .slice(0, 10), // should only have 10 items
        nextOffset: 10, // default limit is 10
      }
      expect(result).toMatchObject(expected)
    })

    it("should return nested children if resourceId is given", async () => {
      // Arrange
      const { site } = await setupSite()
      const { folder: parentFolder } = await setupFolder({
        parentId: null,
        permalink: "parent-folder",
        siteId: site.id,
        title: "Parent folder",
      })
      const childFolders = await Promise.all(
        Array.from({ length: 30 }, (_, i) => i).map(async (i) => {
          const { folder } = await setupFolder({
            parentId: parentFolder.id,
            permalink: `child-folder-${i}`,
            siteId: site.id,
            title: `Child folder ${i}`,
          })
          return pick(folder, ["title", "permalink", "type", "id"])
        }),
      )
      const childPages = await Promise.all(
        Array.from({ length: 2 }, (_, i) => i).map(async (i) => {
          const { page } = await setupPageResource({
            parentId: parentFolder.id,
            permalink: `child-page-${i}`,
            resourceType: "Page",
            siteId: site.id,
            title: `__should be returned Child page ${i}`,
          })
          return pick(page, ["title", "permalink", "type", "id"])
        }),
      )
      // Extra folders to assert that they are not returned
      await Promise.all(
        Array.from({ length: 3 }, (_, i) => i).map(async (i) => {
          const { folder } = await setupFolder({
            parentId: null,
            permalink: `root-folder-${i}`,
            siteId: site.id,
            title: `____Root folder, should not be returned ${i}`,
          })
          return pick(folder, ["title", "permalink", "type", "id"])
        }),
      )
      await setupEditorPermissions({
        siteId: site.id,
        userId: session.userId,
      })

      // Act
      const result = caller.getChildrenOf({
        resourceId: parentFolder.id,
        siteId: String(site.id),
      })

      // Assert
      const expected = {
        items: [...childFolders, ...childPages]
          .sort((a, b) => a.title.localeCompare(b.title)) // should be sorted by title
          .slice(0, 10), // should only have 10 items
        nextOffset: 10, // default limit is 10
      }
      await expect(result).resolves.toMatchObject(expected)
    })

    it("should return limit number of children according to the the `limit` parameter", async () => {
      // Arrange
      const setLimit = 5
      const { site } = await setupSite()
      const { folder: parentFolder } = await setupFolder({
        parentId: null,
        permalink: "parent-folder",
        siteId: site.id,
        title: "Parent folder",
      })
      const childFolders = await Promise.all(
        Array.from({ length: 30 }, (_, i) => i).map(async (i) => {
          const { folder } = await setupFolder({
            parentId: parentFolder.id,
            permalink: `child-folder-${i}`,
            siteId: site.id,
            title: `Child folder ${i}`,
          })
          return pick(folder, ["title", "permalink", "type", "id"])
        }),
      )
      const childPages = await Promise.all(
        Array.from({ length: 5 }, (_, i) => i).map(async (i) => {
          const { page } = await setupPageResource({
            parentId: parentFolder.id,
            permalink: `child-page-${i}`,
            resourceType: "Page",
            siteId: site.id,
            title: `__underscore to return first and should be returned page ${i}`,
          })
          return pick(page, ["title", "permalink", "type", "id"])
        }),
      )
      await setupEditorPermissions({
        siteId: site.id,
        userId: session.userId,
      })

      // Act
      const result = caller.getChildrenOf({
        limit: setLimit,
        resourceId: parentFolder.id,
        siteId: String(site.id),
      })

      // Assert
      const expected = {
        items: [...childFolders, ...childPages]
          .sort((a, b) => a.title.localeCompare(b.title)) // should be sorted by title
          .slice(0, setLimit), // should only have 5 items
        nextOffset: setLimit, // limit is 5
      }
      await expect(result).resolves.toMatchObject(expected)
    })

    it("should return the next set of children if valid `cursor` is provided", async () => {
      // Arrange
      const cursor = 5
      const nextLimit = 10
      const { site } = await setupSite()
      const { folder: parentFolder } = await setupFolder({
        parentId: null,
        permalink: "parent-folder",
        siteId: site.id,
        title: "Parent folder",
      })
      const childFolders = await Promise.all(
        Array.from({ length: 30 }, (_, i) => i).map(async (i) => {
          const { folder } = await setupFolder({
            parentId: parentFolder.id,
            permalink: `child-folder-${i}`,
            siteId: site.id,
            title: `Child folder ${i}`,
          })
          return pick(folder, ["title", "permalink", "type", "id"])
        }),
      )
      const childPages = await Promise.all(
        Array.from({ length: 5 }, (_, i) => i).map(async (i) => {
          const { page } = await setupPageResource({
            parentId: parentFolder.id,
            permalink: `child-page-${i}`,
            resourceType: "Page",
            siteId: site.id,
            title: `__underscore to return first and should be returned page ${i}`,
          })
          return pick(page, ["title", "permalink", "type", "id"])
        }),
      )
      await setupEditorPermissions({
        siteId: site.id,
        userId: session.userId,
      })

      // Act
      const result = await caller.getChildrenOf({
        cursor,
        limit: nextLimit,
        resourceId: parentFolder.id,
        siteId: String(site.id),
      })

      // Assert
      const expected = {
        items: [...childFolders, ...childPages]
          .sort((a, b) => a.title.localeCompare(b.title)) // should be sorted by title
          .slice(cursor, cursor + nextLimit), // should only have 5 items
        nextOffset: cursor + nextLimit, // limit is 5
      }
      expect(result).toMatchObject(expected)
    })

    it("should return all items if limit is greater than the number of items", async () => {
      // Arrange
      const setLimit = 10
      const numberOfFolders = 3
      const numberOfPages = 2
      expect(numberOfFolders + numberOfPages).toBeLessThan(setLimit)

      const { site } = await setupSite()
      const { folder: parentFolder } = await setupFolder({
        parentId: null,
        permalink: "parent-folder",
        siteId: site.id,
        title: "Parent folder",
      })
      const childFolders = await Promise.all(
        Array.from({ length: numberOfFolders }, (_, i) => i).map(async (i) => {
          const { folder } = await setupFolder({
            parentId: parentFolder.id,
            permalink: `child-folder-${i}`,
            siteId: site.id,
            title: `Child folder ${i}`,
          })
          return pick(folder, ["title", "permalink", "type", "id"])
        }),
      )
      const childPages = await Promise.all(
        Array.from({ length: numberOfPages }, (_, i) => i).map(async (i) => {
          const { page } = await setupPageResource({
            parentId: parentFolder.id,
            permalink: `child-page-${i}`,
            resourceType: "Page",
            siteId: site.id,
            title: `__underscore to return first and should be returned page ${i}`,
          })
          return pick(page, ["title", "permalink", "type", "id"])
        }),
      )
      await setupEditorPermissions({
        siteId: site.id,
        userId: session.userId,
      })

      // Act
      const result = await caller.getChildrenOf({
        limit: setLimit,
        resourceId: parentFolder.id,
        siteId: String(site.id),
      })

      // Assert
      const expected = {
        items: [...childFolders, ...childPages].sort((a, b) =>
          a.title.localeCompare(b.title),
        ), // should be sorted by title
        nextOffset: null,
      }
      expect(result).toMatchObject(expected)
    })

    it("should throw 403 if user does not have read access to site", async () => {
      // Arrange
      const { site } = await setupSite()

      // Act
      const result = caller.getChildrenOf({
        resourceId: null,
        siteId: String(site.id),
      })

      // Assert
      await expect(result).rejects.toThrow(
        new TRPCError({
          code: "FORBIDDEN",
          message:
            "You do not have sufficient permissions to perform this action",
        }),
      )
    })

    it.skip("should throw 403 if user does not have read access to resource", async () => {})
  })

  describe("getNestedFolderChildrenOf", () => {
    const RESOURCE_FIELDS_TO_PICK = [
      "title",
      "permalink",
      "type",
      "id",
      "parentId",
    ] as const

    it("should throw 401 if not logged in", async () => {
      // Arrange
      const unauthedSession = applySession()
      const unauthedCaller = createCaller(createMockRequest(unauthedSession))

      // Act
      const result = unauthedCaller.getNestedFolderChildrenOf({
        resourceId: "1",
        siteId: "1",
      })

      // Assert
      await expect(result).rejects.toThrow(
        new TRPCError({ code: "UNAUTHORIZED" }),
      )
    })

    it("should return 404 if resource does not exist", async () => {
      // Arrange
      const { site } = await setupSite()
      await setupEditorPermissions({
        siteId: site.id,
        userId: session.userId,
      })

      // Act
      const result = caller.getNestedFolderChildrenOf({
        resourceId: "1",
        siteId: String(site.id),
      })

      // Assert
      await expect(result).rejects.toThrow(
        new TRPCError({
          code: "NOT_FOUND",
          message: "Resource not found",
        }),
      )
    })

    it("should return 404 if resource is not a folder", async () => {
      // Arrange
      const { site } = await setupSite()
      await setupEditorPermissions({
        siteId: site.id,
        userId: session.userId,
      })
      const { page } = await setupPageResource({
        resourceType: "Page",
        siteId: site.id,
      })

      // Act
      const result = caller.getNestedFolderChildrenOf({
        resourceId: page.id,
        siteId: String(site.id),
      })

      // Assert
      await expect(result).rejects.toThrow(new TRPCError({ code: "NOT_FOUND" }))
    })

    it("should throw 403 if user does not have read access to site", async () => {
      // Arrange
      const { site, folder } = await setupFolder()

      // Act
      const result = caller.getNestedFolderChildrenOf({
        resourceId: folder.id,
        siteId: String(site.id),
      })

      // Assert
      await expect(result).rejects.toThrow(
        new TRPCError({
          code: "FORBIDDEN",
          message:
            "You do not have sufficient permissions to perform this action",
        }),
      )
    })

    it.skip("should throw 403 if user does not have read access to resource", async () => {})

    it("should return nested folder children (e.g. folders within folders)", async () => {
      // Arrange
      const { site } = await setupSite()
      await setupEditorPermissions({
        siteId: site.id,
        userId: session.userId,
      })
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
      const { folder: grandChildFolder } = await setupFolder({
        parentId: childFolder.id,
        permalink: "grand-child-folder",
        siteId: site.id,
        title: "Grand child folder",
      })
      const { folder: grandChildFolder2 } = await setupFolder({
        parentId: childFolder.id,
        permalink: "grand-child-folder-2",
        siteId: site.id,
        title: "Grand child folder 2",
      })

      // Act
      const result = await caller.getNestedFolderChildrenOf({
        resourceId: parentFolder.id,
        siteId: String(site.id),
      })

      // Assert
      const expected = {
        items: [childFolder, grandChildFolder, grandChildFolder2].map(
          (resource) => pick(resource, RESOURCE_FIELDS_TO_PICK),
        ),
      }
      expect(result).toEqual(expected)
    })

    it("should terminate and return unique descendants when legacy cyclic data exists", async () => {
      // Arrange
      const { site } = await setupSite()
      await setupEditorPermissions({
        siteId: site.id,
        userId: session.userId,
      })
      const { folder: folderA } = await setupFolder({
        parentId: null,
        permalink: "cyclic-a",
        siteId: site.id,
      })
      const { folder: folderB } = await setupFolder({
        parentId: folderA.id,
        permalink: "cyclic-b",
        siteId: site.id,
      })
      const { folder: folderC } = await setupFolder({
        parentId: folderB.id,
        permalink: "cyclic-c",
        siteId: site.id,
      })

      // Seed legacy corruption: A <-> B cycle.
      await db
        .updateTable("Resource")
        .where("id", "=", folderA.id)
        .set({ parentId: folderB.id })
        .execute()

      // Act
      const result = await caller.getNestedFolderChildrenOf({
        resourceId: folderA.id,
        siteId: String(site.id),
      })

      // Assert
      expect(result).toEqual({
        items: [folderB, folderC].map((resource) =>
          pick(resource, RESOURCE_FIELDS_TO_PICK),
        ),
      })
    })
  })

  describe("move", () => {
    beforeEach(() => {
      vi.spyOn(auditService, "logResourceEvent").mockClear()
    })

    it("should throw 401 if not logged in", async () => {
      // Arrange
      const unauthedSession = applySession()
      const auditSpy = vitest.spyOn(auditService, "logResourceEvent")
      const unauthedCaller = createCaller(createMockRequest(unauthedSession))
      const { site } = await setupSite()

      // Act
      const result = unauthedCaller.move({
        destinationResourceId: "1",
        movedResourceId: "1",
        siteId: site.id,
      })

      // Assert
      await expect(result).rejects.toThrow(
        new TRPCError({ code: "UNAUTHORIZED" }),
      )
      expect(auditSpy).not.toHaveBeenCalled()
    })

    it("should return 400 if moved resource does not exist", async () => {
      // Arrange
      const { site } = await setupSite()
      const { folder } = await setupFolder()
      await setupAdminPermissions({
        siteId: site.id,
        userId: session.userId,
      })
      const auditSpy = vitest.spyOn(auditService, "logResourceEvent")

      // Act
      const result = caller.move({
        destinationResourceId: folder.id,
        movedResourceId: "99999", // should not exist
        siteId: site.id,
      })

      // Assert
      await expect(result).rejects.toThrow(
        new TRPCError({ code: "BAD_REQUEST" }),
      )
      expect(auditSpy).not.toHaveBeenCalled()
    })

    it("should return 400 if destination resource does not exist", async () => {
      // Arrange
      const { folder } = await setupFolder()
      const { site } = await setupSite()
      await setupAdminPermissions({
        siteId: site.id,
        userId: session.userId,
      })
      const auditSpy = vitest.spyOn(auditService, "logResourceEvent")

      // Act
      const result = caller.move({
        destinationResourceId: "99999", // should not exist
        movedResourceId: folder.id,
        siteId: site.id,
      })

      // Assert
      expect(auditSpy).not.toHaveBeenCalled()
      await expect(result).rejects.toThrow(
        new TRPCError({
          code: "BAD_REQUEST",
          message:
            "Please ensure that you are trying to move your resource into a valid destination",
        }),
      )
    })

    it("should return 400 if destination is not a folder", async () => {
      // Arrange
      const { page: pageToMove, site } = await setupPageResource({
        resourceType: "Page",
      })
      const { page: anotherPage } = await setupPageResource({
        permalink: "another-page",
        resourceType: "Page",
        siteId: site.id,
      })
      await setupAdminPermissions({
        siteId: site.id,
        userId: session.userId,
      })
      const auditSpy = vitest.spyOn(auditService, "logResourceEvent")

      // Act
      const result = caller.move({
        destinationResourceId: anotherPage.id,
        movedResourceId: pageToMove.id,
        siteId: site.id,
      })

      // Assert
      expect(auditSpy).not.toHaveBeenCalled()
      await expect(result).rejects.toThrow(
        new TRPCError({
          code: "BAD_REQUEST",
          message:
            "Please ensure that you are trying to move your resource into a valid destination",
        }),
      )
    })

    it("should return 400 if destination is the same as the origin", async () => {
      // Arrange
      const { folder: originFolder, site } = await setupFolder({
        permalink: "origin-folder",
      })
      const { page: pageToMove } = await setupPageResource({
        parentId: originFolder.id,
        resourceType: "Page",
        siteId: site.id,
      })
      const auditSpy = vitest.spyOn(auditService, "logResourceEvent")
      await setupAdminPermissions({
        siteId: pageToMove.siteId,
        userId: session.userId,
      })

      // Act
      const result = caller.move({
        destinationResourceId: pageToMove.parentId,
        movedResourceId: pageToMove.id,
        siteId: pageToMove.siteId,
      })

      // Assert
      expect(auditSpy).not.toHaveBeenCalled()
      await expect(result).rejects.toThrow(
        new TRPCError({
          code: "BAD_REQUEST",
          message: "You cannot move a resource to the same folder",
        }),
      )
    })

    it("should return 403 if destination is a root page but user is not an admin", async () => {
      // Arrange
      const { folder: originFolder, site } = await setupFolder({
        permalink: "origin-folder",
      })
      const auditSpy = vitest.spyOn(auditService, "logResourceEvent")
      await setupPageResource({
        resourceType: "RootPage",
        siteId: site.id,
      })
      const { page: pageToMove } = await setupPageResource({
        parentId: originFolder.id,
        resourceType: "Page",
        siteId: site.id,
      })
      await setupEditorPermissions({
        siteId: site.id,
        userId: session.userId,
      })

      // Act
      const result = caller.move({
        destinationResourceId: null,
        movedResourceId: pageToMove.id,
        siteId: site.id,
      })

      // Assert
      expect(auditSpy).not.toHaveBeenCalled()
      await expect(result).rejects.toThrow(
        new TRPCError({
          code: "FORBIDDEN",
          message:
            "Please ensure that you have the required permissions to perform a move!",
        }),
      )
    })

    it("should return 400 if resource to move is the search page (permalink /search, no parent)", async () => {
      // Arrange
      const { page: searchPage, site } = await setupPageResource({
        parentId: null,
        permalink: "search",
        resourceType: "Page",
      })
      const { folder: destinationFolder } = await setupFolder({
        permalink: "destination-folder",
        siteId: site.id,
      })
      const auditSpy = vitest.spyOn(auditService, "logResourceEvent")
      await setupAdminPermissions({
        siteId: site.id,
        userId: session.userId,
      })

      // Act
      const result = caller.move({
        destinationResourceId: destinationFolder.id,
        movedResourceId: searchPage.id,
        siteId: site.id,
      })

      // Assert
      expect(auditSpy).not.toHaveBeenCalled()
      await expect(result).rejects.toThrowError(
        new TRPCError({
          code: "BAD_REQUEST",
          message: "The search page cannot be moved",
        }),
      )
    })

    it("should return 400 if source and destination resources belong to different sites", async () => {
      // Arrange
      const auditSpy = vitest.spyOn(auditService, "logResourceEvent")
      const { page: originPage, site: originSite } = await setupPageResource({
        resourceType: "Page",
      })
      const { folder: destinationFolder, site: destinationSite } =
        await setupFolder()
      expect(originSite.id).not.toEqual(destinationSite.id)
      await setupAdminPermissions({
        siteId: originSite.id,
        userId: session.userId,
      })

      // Act
      const result = caller.move({
        destinationResourceId: destinationFolder.id,
        movedResourceId: originPage.id,
        siteId: originSite.id,
      })

      // Assert
      expect(auditSpy).not.toHaveBeenCalled()
      await expect(result).rejects.toThrow(
        new TRPCError({
          code: "BAD_REQUEST",
          message: "You cannot move a resource to a different site",
        }),
      )
    })

    it("admin should be able to move resource to root page", async () => {
      // Arrange
      const { folder: originFolder, site } = await setupFolder({
        permalink: "origin-folder",
      })
      await setupPageResource({
        resourceType: "RootPage",
        siteId: site.id,
      })
      const auditSpy = vitest.spyOn(auditService, "logResourceEvent")
      const { page: pageToMove } = await setupPageResource({
        parentId: originFolder.id,
        resourceType: "Page",
        siteId: site.id,
      })
      await setupAdminPermissions({
        siteId: site.id,
        userId: session.userId,
      })

      // Act
      const result = await caller.move({
        destinationResourceId: null,
        movedResourceId: pageToMove.id,
        siteId: site.id,
      })

      // Assert
      const expected = {
        ...pick(pageToMove, ["id", "type", "permalink", "title"]),
        parentId: null,
      }
      expect(result).toMatchObject(expected)
      const auditEntry = await db
        .selectFrom("AuditLog")
        .where("eventType", "=", "ResourceUpdate")
        .selectAll()
        .executeTakeFirstOrThrow()
      expect(auditSpy).toHaveBeenCalled()
      expect(auditEntry.delta.after!).toMatchObject(
        omit(result, ["createdAt", "updatedAt"]),
      )
      expect(auditEntry.userId).toBe(session.userId)
    })

    it("should move nested resource to destination folder", async () => {
      // Arrange
      const auditSpy = vitest.spyOn(auditService, "logResourceEvent")
      const { folder: originFolder, site } = await setupFolder({
        permalink: "origin-folder",
      })
      const { page: pageToMove } = await setupPageResource({
        parentId: originFolder.id,
        resourceType: "Page",
        siteId: site.id,
      })
      const { folder: destinationFolder } = await setupFolder({
        permalink: "destination-folder",
        siteId: site.id,
      })
      await setupAdminPermissions({
        siteId: site.id,
        userId: session.userId,
      })

      // Act
      const result = await caller.move({
        destinationResourceId: destinationFolder.id,
        movedResourceId: pageToMove.id,
        siteId: site.id,
      })

      // Assert
      const expected = {
        ...pick(pageToMove, ["id", "type", "permalink", "title"]),
        parentId: destinationFolder.id,
      }
      const actual = await db
        .selectFrom("Resource")
        .where("id", "=", pageToMove.id)
        .select(["parentId"])
        .executeTakeFirstOrThrow()
      expect(actual.parentId).toEqual(destinationFolder.id)
      expect(result).toMatchObject(expected)
      const auditEntry = await db
        .selectFrom("AuditLog")
        .where("eventType", "=", "ResourceUpdate")
        .selectAll()
        .executeTakeFirstOrThrow()
      expect(auditSpy).toHaveBeenCalled()
      expect(auditEntry.delta.after!).toMatchObject(
        omit(result, ["createdAt", "updatedAt"]),
      )
      expect(auditEntry.userId).toBe(session.userId)
    })

    it("should move root-level resource to destination folder", async () => {
      // Arrange
      const auditSpy = vitest.spyOn(auditService, "logResourceEvent")
      const { page: pageToMove, site } = await setupPageResource({
        parentId: null,
        resourceType: "Page",
      })
      const { folder: destinationFolder } = await setupFolder({
        permalink: "destination-folder",
        siteId: site.id,
      })
      await setupAdminPermissions({
        siteId: site.id,
        userId: session.userId,
      })

      // Act
      const result = await caller.move({
        destinationResourceId: destinationFolder.id,
        movedResourceId: pageToMove.id,
        siteId: site.id,
      })

      // Assert
      const expected = {
        ...pick(pageToMove, ["id", "type", "permalink", "title"]),
        parentId: destinationFolder.id,
      }
      expect(result).toMatchObject(expected)
      const auditEntry = await db
        .selectFrom("AuditLog")
        .where("eventType", "=", "ResourceUpdate")
        .selectAll()
        .executeTakeFirstOrThrow()
      expect(auditSpy).toHaveBeenCalled()
      expect(auditEntry.delta.after!).toMatchObject(
        omit(result, ["createdAt", "updatedAt"]),
      )
      expect(auditEntry.userId).toBe(session.userId)
    })

    it("should return 400 if moving a folder into its direct child (prevents circular reference)", async () => {
      // Arrange
      const auditSpy = vitest.spyOn(auditService, "logResourceEvent")
      const { folder: parentFolder, site } = await setupFolder({
        permalink: "parent-folder",
      })
      const { folder: childFolder } = await setupFolder({
        parentId: parentFolder.id,
        permalink: "child-folder",
        siteId: site.id,
      })
      await setupAdminPermissions({
        siteId: site.id,
        userId: session.userId,
      })

      // Act - try to move parent folder into its child (would create A -> B -> A cycle)
      const result = caller.move({
        destinationResourceId: childFolder.id,
        movedResourceId: parentFolder.id,
        siteId: site.id,
      })

      // Assert
      expect(auditSpy).not.toHaveBeenCalled()
      await expect(result).rejects.toThrow(
        new TRPCError({
          code: "BAD_REQUEST",
          message: "Cannot move a folder into one of its descendants",
        }),
      )
    })

    it("should return 400 if moving a folder into a deeply nested descendant (prevents circular reference)", async () => {
      // Arrange
      const auditSpy = vitest.spyOn(auditService, "logResourceEvent")
      const { folder: grandparentFolder, site } = await setupFolder({
        permalink: "grandparent-folder",
      })
      const { folder: parentFolder } = await setupFolder({
        parentId: grandparentFolder.id,
        permalink: "parent-folder",
        siteId: site.id,
      })
      const { folder: childFolder } = await setupFolder({
        parentId: parentFolder.id,
        permalink: "child-folder",
        siteId: site.id,
      })
      const { folder: grandchildFolder } = await setupFolder({
        parentId: childFolder.id,
        permalink: "grandchild-folder",
        siteId: site.id,
      })
      await setupAdminPermissions({
        siteId: site.id,
        userId: session.userId,
      })

      // Act - try to move grandparent folder into its grandchild (would create cycle)
      const result = caller.move({
        destinationResourceId: grandchildFolder.id,
        movedResourceId: grandparentFolder.id,
        siteId: site.id,
      })

      // Assert
      expect(auditSpy).not.toHaveBeenCalled()
      await expect(result).rejects.toThrow(
        new TRPCError({
          code: "BAD_REQUEST",
          message: "Cannot move a folder into one of its descendants",
        }),
      )
    })

    it("should reject descendant moves even when legacy cyclic data exists", async () => {
      // Arrange
      const auditSpy = vitest.spyOn(auditService, "logResourceEvent")
      const { folder: folderA, site } = await setupFolder({
        permalink: "cyclic-folder-a",
      })
      const { folder: folderB } = await setupFolder({
        parentId: folderA.id,
        permalink: "cyclic-folder-b",
        siteId: site.id,
      })
      const { folder: folderC } = await setupFolder({
        parentId: folderB.id,
        permalink: "cyclic-folder-c",
        siteId: site.id,
      })
      await setupAdminPermissions({
        siteId: site.id,
        userId: session.userId,
      })

      // Seed legacy corruption: A -> B and B -> A cycle.
      await db
        .updateTable("Resource")
        .where("id", "=", folderA.id)
        .set({ parentId: folderB.id })
        .execute()

      // Act
      const result = caller.move({
        destinationResourceId: folderC.id,
        movedResourceId: folderA.id,
        siteId: site.id,
      })

      // Assert
      expect(auditSpy).not.toHaveBeenCalled()
      await expect(result).rejects.toThrow(
        new TRPCError({
          code: "BAD_REQUEST",
          message: "Cannot move a folder into one of its descendants",
        }),
      )
    })

    it("should allow moving a folder to a sibling folder (not a descendant)", async () => {
      // Arrange
      const auditSpy = vitest.spyOn(auditService, "logResourceEvent")
      const { folder: folderA, site } = await setupFolder({
        permalink: "folder-a",
      })
      const { folder: folderB } = await setupFolder({
        permalink: "folder-b",
        siteId: site.id,
      })
      await setupAdminPermissions({
        siteId: site.id,
        userId: session.userId,
      })

      // Act - move folder A into folder B (siblings, not descendants)
      const result = await caller.move({
        destinationResourceId: folderB.id,
        movedResourceId: folderA.id,
        siteId: site.id,
      })

      // Assert
      expect(result.parentId).toEqual(folderB.id)
      expect(auditSpy).toHaveBeenCalled()
    })

    it("should return 400 if moving a RootPage into its descendant (prevents circular reference)", async () => {
      // Arrange
      const auditSpy = vitest.spyOn(auditService, "logResourceEvent")
      const { page: rootPage, site } = await setupPageResource({
        resourceType: "RootPage",
      })
      const { folder } = await setupFolder({
        parentId: rootPage.id,
        permalink: "child-folder",
        siteId: site.id,
      })
      await setupAdminPermissions({
        siteId: site.id,
        userId: session.userId,
      })

      // Act - try to move RootPage into its child folder (would create cycle)
      const result = caller.move({
        destinationResourceId: folder.id,
        movedResourceId: rootPage.id,
        siteId: site.id,
      })

      // Assert
      expect(auditSpy).not.toHaveBeenCalled()
      await expect(result).rejects.toThrow(
        new TRPCError({
          code: "BAD_REQUEST",
          message: "Cannot move a folder into one of its descendants",
        }),
      )
    })

    it("should move a collection into a folder", async () => {
      // Arrange
      const auditSpy = vitest.spyOn(auditService, "logResourceEvent")
      const { collection, site } = await setupCollection({
        permalink: "my-collection",
      })
      const { folder: destinationFolder } = await setupFolder({
        permalink: "destination-folder",
        siteId: site.id,
      })
      await setupAdminPermissions({
        siteId: site.id,
        userId: session.userId,
      })

      // Act
      const result = await caller.move({
        destinationResourceId: destinationFolder.id,
        movedResourceId: collection.id,
        siteId: site.id,
      })

      // Assert
      const expected = {
        ...pick(collection, ["id", "type", "permalink", "title"]),
        parentId: destinationFolder.id,
      }
      expect(result).toMatchObject(expected)
      const actual = await db
        .selectFrom("Resource")
        .where("id", "=", collection.id)
        .select(["parentId"])
        .executeTakeFirstOrThrow()
      expect(actual.parentId).toEqual(destinationFolder.id)
      const auditEntry = await db
        .selectFrom("AuditLog")
        .where("eventType", "=", "ResourceUpdate")
        .selectAll()
        .executeTakeFirstOrThrow()
      expect(auditSpy).toHaveBeenCalled()
      expect(auditEntry.delta.after!).toMatchObject(
        omit(result, ["createdAt", "updatedAt"]),
      )
      expect(auditEntry.userId).toBe(session.userId)
    })

    it("should return 400 if moving a collection into another collection", async () => {
      // Arrange
      const auditSpy = vitest.spyOn(auditService, "logResourceEvent")
      const { collection: collectionToMove, site } = await setupCollection({
        permalink: "collection-to-move",
      })
      const { collection: destinationCollection } = await setupCollection({
        permalink: "destination-collection",
        siteId: site.id,
      })
      await setupAdminPermissions({
        siteId: site.id,
        userId: session.userId,
      })

      // Act
      const result = caller.move({
        destinationResourceId: destinationCollection.id,
        movedResourceId: collectionToMove.id,
        siteId: site.id,
      })

      // Assert
      expect(auditSpy).not.toHaveBeenCalled()
      await expect(result).rejects.toThrowError(
        new TRPCError({
          code: "BAD_REQUEST",
          message: "Folder items can only be moved to another folder",
        }),
      )
    })

    it.skip("should throw 403 if user does not have write access to destination resource", async () => {})

    it.skip("should throw 403 if user does not have write access to origin resource", async () => {})

    describe("redirect on move", () => {
      const setup = async () => {
        const { page: rootPage, site } = await setupPageResource({
          parentId: null,
          resourceType: ResourceType.RootPage,
        })
        const { folder } = await setupFolder({
          permalink: "dest",
          siteId: site.id,
        })
        await setupAdminPermissions({ siteId: site.id, userId: session.userId })
        return { folder, rootPage, site }
      }

      const liveRedirects =  async (siteId: number) =>
        db
          .selectFrom("Redirect")
          .selectAll()
          .where("siteId", "=", siteId)
          .where("deletedAt", "is", null)
          .execute()

      it("creates a redirect from the old URL for a published page", async () => {
        const { site, rootPage, folder } = await setup()
        const { page } = await setupPageResource({
          parentId: rootPage.id,
          permalink: "old-page",
          resourceType: ResourceType.Page,
          siteId: site.id,
          state: ResourceState.Published,
          userId: session.userId,
        })

        await caller.move({
          destinationResourceId: folder.id,
          movedResourceId: page.id,
          shouldCreateRedirect: true,
          siteId: site.id,
        })

        const redirects = await liveRedirects(site.id)
        expect(redirects).toHaveLength(1)
        expect(redirects[0]!.source).toBe("/old-page")
        expect(redirects[0]!.destination).toBe(
          `[resource:${site.id}:${page.id}]`,
        )
      })

      it("does not create a redirect when shouldCreateRedirect is false", async () => {
        const { site, rootPage, folder } = await setup()
        const { page } = await setupPageResource({
          parentId: rootPage.id,
          permalink: "old-page",
          resourceType: ResourceType.Page,
          siteId: site.id,
          state: ResourceState.Published,
          userId: session.userId,
        })

        await caller.move({
          destinationResourceId: folder.id,
          movedResourceId: page.id,
          shouldCreateRedirect: false,
          siteId: site.id,
        })

        expect(await liveRedirects(site.id)).toHaveLength(0)
      })

      it("does not create a redirect for an unpublished page", async () => {
        const { site, rootPage, folder } = await setup()
        const { page } = await setupPageResource({
          parentId: rootPage.id,
          permalink: "old-page",
          resourceType: ResourceType.Page,
          siteId: site.id,
          state: ResourceState.Draft,
        })

        await caller.move({
          destinationResourceId: folder.id,
          movedResourceId: page.id,
          shouldCreateRedirect: true,
          siteId: site.id,
        })

        expect(await liveRedirects(site.id)).toHaveLength(0)
      })

      it("soft-deletes a redirect pointing back at the page when it reclaims that URL", async () => {
        const { site, rootPage, folder } = await setup()
        const { page } = await setupPageResource({
          parentId: rootPage.id,
          permalink: "old-page",
          resourceType: ResourceType.Page,
          siteId: site.id,
          state: ResourceState.Published,
          userId: session.userId,
        })
        // A redirect at the path the page is about to occupy, pointing at it.
        await db
          .insertInto("Redirect")
          .values({
            destination: `[resource:${site.id}:${page.id}]`,
            siteId: site.id,
            source: "/dest/old-page",
          })
          .execute()

        await caller.move({
          destinationResourceId: folder.id,
          movedResourceId: page.id,
          shouldCreateRedirect: false,
          siteId: site.id,
        })

        const reclaimed = await db
          .selectFrom("Redirect")
          .selectAll()
          .where("siteId", "=", site.id)
          .where("source", "=", "/dest/old-page")
          .executeTakeFirstOrThrow()
        expect(reclaimed.deletedAt).not.toBeNull()
      })

      it("blocks moving a published page onto a path a live redirect points elsewhere from", async () => {
        const { site, rootPage, folder } = await setup()
        const { page } = await setupPageResource({
          parentId: rootPage.id,
          permalink: "old-page",
          resourceType: ResourceType.Page,
          siteId: site.id,
          state: ResourceState.Published,
          userId: session.userId,
        })
        // A live redirect already occupies the destination URL, pointing
        // elsewhere — moving the page there would shadow it.
        await db
          .insertInto("Redirect")
          .values({
            destination: "https://example.gov.sg/elsewhere",
            siteId: site.id,
            source: "/dest/old-page",
          })
          .execute()

        const result = caller.move({
          destinationResourceId: folder.id,
          movedResourceId: page.id,
          shouldCreateRedirect: false,
          siteId: site.id,
        })

        // Assert — blocked, and the whole move is rolled back (page stays put).
        await expect(result).rejects.toMatchObject({ code: "CONFLICT" })
        const stillThere = await db
          .selectFrom("Resource")
          .select("parentId")
          .where("id", "=", page.id)
          .executeTakeFirstOrThrow()
        expect(String(stillThere.parentId)).toBe(String(rootPage.id))
      })

      it("allows moving an unpublished page onto a path with a live redirect", async () => {
        const { site, rootPage, folder } = await setup()
        const { page } = await setupPageResource({
          parentId: rootPage.id,
          permalink: "old-page",
          resourceType: ResourceType.Page,
          siteId: site.id,
          state: ResourceState.Draft,
        })
        await db
          .insertInto("Redirect")
          .values({
            destination: "https://example.gov.sg/elsewhere",
            siteId: site.id,
            source: "/dest/old-page",
          })
          .execute()

        // No live shadow yet (the page isn't published); the eventual publish is
        // guarded separately, so the move is allowed.
        await expect(
          caller.move({
            destinationResourceId: folder.id,
            movedResourceId: page.id,
            shouldCreateRedirect: true,
            siteId: site.id,
          }),
        ).resolves.toMatchObject({ id: page.id })
      })

      it("creates a redirect from the old URL for a published CollectionPage", async () => {
        // Locks in the CollectionPage branch of the redirect orchestration.
        const { site, collection: srcCollection } = await setupCollection({
          permalink: "src-collection",
        })
        await setupAdminPermissions({ siteId: site.id, userId: session.userId })
        const { collection: destCollection } = await setupCollection({
          permalink: "dest-collection",
          siteId: site.id,
        })
        const { page } = await setupCollectionPage({
          parentId: srcCollection.id,
          permalink: "old-article",
          siteId: site.id,
          state: ResourceState.Published,
          userId: session.userId,
        })

        await caller.move({
          destinationResourceId: destCollection.id,
          movedResourceId: page.id,
          shouldCreateRedirect: true,
          siteId: site.id,
        })

        const redirects = await liveRedirects(site.id)
        expect(redirects).toHaveLength(1)
        expect(redirects[0]!.source).toBe("/src-collection/old-article")
        expect(redirects[0]!.destination).toBe(
          `[resource:${site.id}:${page.id}]`,
        )
      })

      describe("folder/collection", () => {
        // A folder ("/dest/src-folder") with one published child page,
        // alongside a sibling destination folder ("/dest") to move it into.
        const setupMoveWithPublishedChild = async () => {
          const { site, rootPage, folder: destinationFolder } = await setup()
          const { folder: sourceFolder } = await setupFolder({
            parentId: rootPage.id,
            permalink: "src-folder",
            siteId: site.id,
          })
          await setupPageResource({
            parentId: sourceFolder.id,
            permalink: "child",
            resourceType: ResourceType.Page,
            siteId: site.id,
            state: ResourceState.Published,
            userId: session.userId,
          })
          return { destinationFolder, rootPage, site, sourceFolder }
        }

        it("creates a wildcard redirect from the old path for a published folder", async () => {
          const { site, sourceFolder, destinationFolder } =
            await setupMoveWithPublishedChild()

          await caller.move({
            destinationResourceId: destinationFolder.id,
            movedResourceId: sourceFolder.id,
            shouldCreateRedirect: true,
            siteId: site.id,
          })

          const redirects = await liveRedirects(site.id)
          expect(redirects).toHaveLength(1)
          expect(redirects[0]!.source).toBe("/src-folder/*")
          expect(redirects[0]!.destination).toBe(
            `[resource:${site.id}:${sourceFolder.id}]`,
          )
        })

        it("still blocks the move when a descendant would be shadowed, even when shouldCreateRedirect is false", async () => {
          const { site, rootPage, sourceFolder, destinationFolder } =
            await setupMoveWithPublishedChild()
          await db
            .insertInto("Redirect")
            .values({
              destination: "https://example.gov.sg/elsewhere",
              siteId: site.id,
              source: "/dest/src-folder/child",
            })
            .execute()

          const result = caller.move({
            destinationResourceId: destinationFolder.id,
            movedResourceId: sourceFolder.id,
            shouldCreateRedirect: false,
            siteId: site.id,
          })

          await expect(result).rejects.toMatchObject({ code: "CONFLICT" })
          const stillThere = await db
            .selectFrom("Resource")
            .select("parentId")
            .where("id", "=", sourceFolder.id)
            .executeTakeFirstOrThrow()
          expect(String(stillThere.parentId)).toBe(String(rootPage.id))
        })
      })
    })
  })

  describe("countWithoutRoot", () => {
    it("should throw 401 if not logged in", async () => {
      // Arrange
      const unauthedSession = applySession()
      const unauthedCaller = createCaller(createMockRequest(unauthedSession))

      // Act
      const result = unauthedCaller.countWithoutRoot({
        resourceId: 1,
        siteId: 1,
      })

      // Assert
      await expect(result).rejects.toThrow(
        new TRPCError({ code: "UNAUTHORIZED" }),
      )
    })

    it("should return 404 if resource does not exist", async () => {
      // Arrange
      const { site } = await setupSite()
      await setupEditorPermissions({
        siteId: site.id,
        userId: session.userId,
      })

      // Act
      const result = caller.countWithoutRoot({
        resourceId: 99_999, // should not exist
        siteId: site.id,
      })

      // Assert
      await expect(result).rejects.toThrow(
        new TRPCError({
          code: "NOT_FOUND",
          message: "Resource not found",
        }),
      )
    })

    it("should return 404 if site does not exist", async () => {
      // Act
      const result = caller.countWithoutRoot({
        resourceId: 99_999, // should not exist
        siteId: 99_999, // should not exist also
      })

      // Assert
      await expect(result).rejects.toThrow(
        new TRPCError({
          code: "NOT_FOUND",
          message: "Resource not found",
        }),
      )
    })

    it("should return 0 if resource is a page", async () => {
      // Arrange
      const { page, site } = await setupPageResource({
        resourceType: "Page",
      })
      await setupEditorPermissions({
        siteId: site.id,
        userId: session.userId,
      })

      // Act
      const result = await caller.countWithoutRoot({
        resourceId: Number(page.id),
        siteId: site.id,
      })

      // Assert
      expect(result).toEqual(0)
    })

    it("should return 0 if resource is a folder with no children", async () => {
      // Arrange
      const { folder, site } = await setupFolder()
      await setupEditorPermissions({
        siteId: site.id,
        userId: session.userId,
      })

      // Act
      const result = await caller.countWithoutRoot({
        resourceId: Number(folder.id),
        siteId: site.id,
      })

      // Assert
      expect(result).toEqual(0)
    })

    it("should return count of resources excluding root page if resourceId is not provided", async () => {
      // Arrange
      const { site } = await setupSite()
      // Create root page, should not be returned in the count
      await setupPageResource({
        resourceType: "RootPage",
        siteId: site.id,
      })
      const numberOfPages = 3
      const numberOfFolders = 2
      await Promise.all(
        Array.from({ length: numberOfPages }, (_, i) => i).map(async (i) => {
          await setupPageResource({
            permalink: `page-${i}`,
            resourceType: "Page",
            siteId: site.id,
            title: `Test page ${i}`,
          })
        }),
      )
      const folders = await Promise.all(
        Array.from({ length: numberOfFolders }, (_, i) => i).map(async (i) => {
          const { folder } = await setupFolder({
            permalink: `folder-${i}`,
            siteId: site.id,
            title: `Test folder ${i}`,
          })
          return folder.id
        }),
      )
      // Add more extra nested pages in folder, should not be returned in the count
      await Promise.all(
        Array.from({ length: 10 }, (_, i) => i).map(async (i) => {
          await setupPageResource({
            parentId: folders[1],
            permalink: `nested-page-${i}`,
            resourceType: "Page",
            siteId: site.id,
            title: `Nested page ${i}`,
          })
        }),
      )
      await setupEditorPermissions({
        siteId: site.id,
        userId: session.userId,
      })

      // Act
      const result = await caller.countWithoutRoot({
        siteId: site.id,
      })

      // Assert
      expect(result).toEqual(numberOfPages + numberOfFolders)
    })

    it("should exclude the default Search page from the root count", async () => {
      // Arrange
      const { site } = await setupSite()
      await setupPageResource({
        permalink: "search",
        resourceType: "Page",
        siteId: site.id,
        title: "Search",
      })
      await setupPageResource({
        permalink: "about",
        resourceType: "Page",
        siteId: site.id,
        title: "About",
      })
      await setupEditorPermissions({
        siteId: site.id,
        userId: session.userId,
      })

      // Act
      const result = await caller.countWithoutRoot({ siteId: site.id })

      // Assert
      expect(result).toBe(1)
    })

    it("should return count of resources nested inside the resourceId", async () => {
      // Arrange
      const { folder: folderToUse, site } = await setupFolder({
        permalink: "parent-folder",
        title: "Parent folder",
      })
      const numberOfPages = 3
      const numberOfFolders = 2
      // Pages inside the folder
      await Promise.all(
        Array.from({ length: numberOfPages }, (_, i) => i).map(async (i) => {
          await setupPageResource({
            parentId: folderToUse.id,
            permalink: `page-${i}`,
            resourceType: "Page",
            siteId: site.id,
            title: `Test page ${i}`,
          })
        }),
      )
      // Folders inside the folder
      const nestedFolders = await Promise.all(
        Array.from({ length: numberOfFolders }, (_, i) => i).map(async (i) => {
          const { folder } = await setupFolder({
            parentId: folderToUse.id,
            permalink: `folder-${i}`,
            siteId: site.id,
            title: `Test folder ${i}`,
          })
          return folder.id
        }),
      )
      // Add more extra nested pages in one of the nested folders, should not be returned in the count
      await Promise.all(
        Array.from({ length: 10 }, (_, i) => i).map(async (i) => {
          await setupPageResource({
            parentId: nestedFolders[1],
            permalink: `nested-page-${i}`,
            resourceType: "Page",
            siteId: site.id,
            title: `Nested page ${i}`,
          })
        }),
      )
      await setupEditorPermissions({
        siteId: site.id,
        userId: session.userId,
      })

      // Act
      const result = await caller.countWithoutRoot({
        resourceId: Number(folderToUse.id),
        siteId: site.id,
      })

      // Assert
      expect(result).toEqual(numberOfPages + numberOfFolders)
    })

    it("should throw 403 if user does not have read access to site", async () => {
      // Arrange
      const { site } = await setupSite()

      // Act
      const result = caller.countWithoutRoot({
        siteId: site.id,
      })

      // Assert
      await expect(result).rejects.toThrow(
        new TRPCError({
          code: "FORBIDDEN",
          message:
            "You do not have sufficient permissions to perform this action",
        }),
      )
    })

    it.skip("should throw 403 if user does not have read access to resource", async () => {})
  })

  describe("listWithoutRoot", () => {
    const RESOURCE_FIELDS_TO_PICK = [
      "id",
      "permalink",
      "title",
      "publishedVersionId",
      "draftBlobId",
      "type",
      "parentId",
      "updatedAt",
      "scheduledAt",
    ] as const

    const testListComparable = (
      a: { updatedAt: Date; id: string },
      b: { updatedAt: Date; id: string },
    ) => {
      if (b.updatedAt.valueOf() === a.updatedAt.valueOf()) {
        // Tie-broken by id, matching applyResourceOrderBy - title isn't
        // unique, so it can't guarantee deterministic pagination.
        return Number(a.id) - Number(b.id)
      }
      return b.updatedAt.valueOf() - a.updatedAt.valueOf()
    }

    it("should throw 401 if not logged in", async () => {
      // Arrange
      const unauthedSession = applySession()
      const unauthedCaller = createCaller(createMockRequest(unauthedSession))

      // Act
      const result = unauthedCaller.listWithoutRoot({
        limit: 25,
        siteId: 1,
      })

      // Assert
      await expect(result).rejects.toThrow(
        new TRPCError({ code: "UNAUTHORIZED" }),
      )
    })

    it("should return 403 if site does not exist", async () => {
      // Act
      const result = caller.listWithoutRoot({
        limit: 25,
        siteId: 99999, // should not exist,
      })

      // Assert
      await expect(result).rejects.toThrow(
        new TRPCError({
          code: "FORBIDDEN",
          message:
            "You do not have sufficient permissions to perform this action",
        }),
      )
    })

    it("should return empty array if site has no resources", async () => {
      // Arrange
      const { site } = await setupSite()
      await setupEditorPermissions({
        siteId: site.id,
        userId: session.userId,
      })

      // Act
      const result = await caller.listWithoutRoot({
        limit: 25,
        siteId: site.id,
      })

      // Assert
      expect(result).toEqual([])
    })

    it("should return empty array if site has only root page", async () => {
      // Arrange
      const { site } = await setupPageResource({
        resourceType: "RootPage",
      })
      await setupEditorPermissions({
        siteId: site.id,
        userId: session.userId,
      })

      // Act
      const result = await caller.listWithoutRoot({
        limit: 25,
        siteId: site.id,
      })

      // Assert
      expect(result).toEqual([])
    })

    it("should return 404 if resource does not exist", async () => {
      // Arrange
      const { site } = await setupSite()
      await setupEditorPermissions({
        siteId: site.id,
        userId: session.userId,
      })

      // Act
      const result = caller.listWithoutRoot({
        limit: 25,
        resourceId: 99999, // should not exist
        siteId: site.id,
      })

      // Assert
      await expect(result).rejects.toThrow(
        new TRPCError({ code: "NOT_FOUND", message: "Resource not found" }),
      )
    })

    it("should return empty array if resource is not a folder", async () => {
      // Arrange
      const { site, page } = await setupPageResource({
        resourceType: "Page",
      })
      await setupEditorPermissions({
        siteId: site.id,
        userId: session.userId,
      })

      // Act
      const result = await caller.listWithoutRoot({
        limit: 25,
        resourceId: Number(page.id),
        siteId: site.id,
      })

      // Assert
      expect(result).toEqual([])
    })

    it("should return empty array if resource is a folder with no children", async () => {
      // Arrange
      const { folder, site } = await setupFolder()
      await setupEditorPermissions({
        siteId: site.id,
        userId: session.userId,
      })

      // Act
      const result = await caller.listWithoutRoot({
        limit: 25,
        resourceId: Number(folder.id),
        siteId: site.id,
      })

      // Assert
      expect(result).toEqual([])
    })

    it("should return resources (respecting the limit) excluding root page if resourceId is not provided", async () => {
      // Arrange
      const { site } = await setupSite()
      // Create root page, should not be returned in the count
      await setupPageResource({
        resourceType: "RootPage",
        siteId: site.id,
      })
      const numberOfPages = 30
      const numberOfFolders = 2
      const pages = await Promise.all(
        Array.from({ length: numberOfPages }, (_, i) => i).map(async (i) => {
          const { page } = await setupPageResource({
            permalink: `page-${i}`,
            resourceType: "Page",
            siteId: site.id,
            title: `Test page ${i}`,
          })
          return pick(page, RESOURCE_FIELDS_TO_PICK)
        }),
      )
      const folders = await Promise.all(
        Array.from({ length: numberOfFolders }, (_, i) => i).map(async (i) => {
          const { folder } = await setupFolder({
            permalink: `folder-${i}`,
            siteId: site.id,
            title: `Test folder ${i}`,
          })
          return pick(folder, RESOURCE_FIELDS_TO_PICK)
        }),
      )
      await setupEditorPermissions({
        siteId: site.id,
        userId: session.userId,
      })

      // Act
      const result = await caller.listWithoutRoot({
        siteId: site.id,
      })

      // Assert
      const expected = [...pages, ...folders]
        .sort(testListComparable)
        .slice(0, 10)
      expect(expected).toMatchObject(result)
    })

    it("should exclude the default Search page from the root resource list", async () => {
      // Arrange
      const { site } = await setupSite()
      await setupPageResource({
        permalink: "search",
        resourceType: "Page",
        siteId: site.id,
        title: "Search",
      })
      await setupPageResource({
        permalink: "about",
        resourceType: "Page",
        siteId: site.id,
        title: "About",
      })
      await setupEditorPermissions({
        siteId: site.id,
        userId: session.userId,
      })

      // Act
      const result = await caller.listWithoutRoot({ siteId: site.id })

      // Assert
      expect(result.map(({ permalink }) => permalink)).toEqual(["about"])
    })

    it("should return resources (respecting the limit) nested inside the resourceId", async () => {
      // Arrange
      const { folder: folderToUse, site } = await setupFolder({
        permalink: "parent-folder",
        title: "Parent folder",
      })
      const numberOfPages = 15
      const numberOfFolders = 2
      // Pages inside the folder
      const pages = await Promise.all(
        Array.from({ length: numberOfPages }, (_, i) => i).map(async (i) => {
          const { page } = await setupPageResource({
            parentId: folderToUse.id,
            permalink: `page-${i}`,
            resourceType: "Page",
            siteId: site.id,
            title: `Test page ${i}`,
          })
          return pick(page, RESOURCE_FIELDS_TO_PICK)
        }),
      )
      // Folders inside the folder
      const folders = await Promise.all(
        Array.from({ length: numberOfFolders }, (_, i) => i).map(async (i) => {
          const { folder } = await setupFolder({
            parentId: folderToUse.id,
            permalink: `folder-${i}`,
            siteId: site.id,
            title: `Test folder ${i}`,
          })
          return pick(folder, RESOURCE_FIELDS_TO_PICK)
        }),
      )
      await setupEditorPermissions({
        siteId: site.id,
        userId: session.userId,
      })

      // Act
      const result = await caller.listWithoutRoot({
        resourceId: Number(folderToUse.id),
        siteId: site.id,
      })

      // Assert
      const expected = [...pages, ...folders]
        .sort(testListComparable)
        .slice(0, 10)
      expect(expected).toMatchObject(result)
    })

    it("should return deterministic paginated results when items share the same updatedAt and title", async () => {
      // Arrange: Create 4 pages with identical title and updatedAt to trigger
      // non-deterministic ordering without a tie-breaker. Regression test for
      // the same pagination bug fixed for collection.list (see #1824).
      const { site } = await setupSite()
      await setupEditorPermissions({
        siteId: site.id,
        userId: session.userId,
      })

      const sharedTitle = "Identical title"
      const permalinks = ["page-1", "page-2", "page-3", "page-4"]
      const pages = await Promise.all(
        permalinks.map( async (permalink) =>
          setupPageResource({
            permalink,
            resourceType: "Page",
            siteId: site.id,
            title: sharedTitle,
          }),
        ),
      )

      const sharedUpdatedAt = new Date("2024-01-01T00:00:00.000Z")
      await db
        .updateTable("Resource")
        .set({ updatedAt: sharedUpdatedAt })
        .where(
          "id",
          "in",
          pages.map(({ page }) => page.id),
        )
        .execute()

      // Act
      const page1First = await caller.listWithoutRoot({
        limit: 2,
        offset: 0,
        siteId: site.id,
      })
      const page1Second = await caller.listWithoutRoot({
        limit: 2,
        offset: 0,
        siteId: site.id,
      })
      const page2Result = await caller.listWithoutRoot({
        limit: 2,
        offset: 2,
        siteId: site.id,
      })

      // Assert: repeated calls to the same page return identical results
      expect(page1First.map((r) => r.id)).toEqual(page1Second.map((r) => r.id))

      // Assert: no duplicate IDs across pages
      const page1Ids = new Set(page1First.map((r) => r.id))
      const page2Ids = new Set(page2Result.map((r) => r.id))
      const overlap = [...page1Ids].filter((id) => page2Ids.has(id))
      expect(overlap).toHaveLength(0)

      // Assert: all 4 items are returned across pages (none skipped)
      const allIds = new Set([...page1Ids, ...page2Ids])
      const expectedIds = new Set(pages.map(({ page }) => page.id))
      expect(allIds).toEqual(expectedIds)
    })

    it("should sort case-insensitively when orderBy is title-asc", async () => {
      // Arrange: titles chosen so a case-sensitive (byte-order) sort would
      // put "Banana" before "apple" - a naive `title asc` would return
      // ["Banana", "apple", "cherry"], which isn't what a user means by
      // "Alphabetical".
      const { site } = await setupSite()
      await setupEditorPermissions({
        siteId: site.id,
        userId: session.userId,
      })

      await setupPageResource({
        permalink: "cherry",
        resourceType: "Page",
        siteId: site.id,
        title: "cherry",
      })
      await setupPageResource({
        permalink: "apple",
        resourceType: "Page",
        siteId: site.id,
        title: "apple",
      })
      await setupPageResource({
        permalink: "banana",
        resourceType: "Page",
        siteId: site.id,
        title: "Banana",
      })

      // Act
      const result = await caller.listWithoutRoot({
        orderBy: "title-asc",
        siteId: site.id,
      })

      // Assert
      expect(result.map((r) => r.title)).toEqual(["apple", "Banana", "cherry"])
    })

    it("should sort by permalink ascending when orderBy is permalink-asc", async () => {
      // Arrange
      const { site } = await setupSite()
      await setupEditorPermissions({
        siteId: site.id,
        userId: session.userId,
      })

      await setupPageResource({
        permalink: "charlie",
        resourceType: "Page",
        siteId: site.id,
        title: "Zulu",
      })
      await setupPageResource({
        permalink: "alpha",
        resourceType: "Page",
        siteId: site.id,
        title: "Alpha",
      })
      await setupPageResource({
        permalink: "bravo",
        resourceType: "Page",
        siteId: site.id,
        title: "Mike",
      })

      // Act
      const result = await caller.listWithoutRoot({
        orderBy: "permalink-asc",
        siteId: site.id,
      })

      // Assert
      expect(result.map((r) => r.permalink)).toEqual([
        "alpha",
        "bravo",
        "charlie",
      ])
    })

    it("should sort folder children by permalink ascending when orderBy is permalink-asc", async () => {
      // Arrange
      const { folder, site } = await setupFolder({
        permalink: "parent-folder",
        title: "Parent folder",
      })
      await setupEditorPermissions({
        siteId: site.id,
        userId: session.userId,
      })

      await setupPageResource({
        parentId: folder.id,
        permalink: "charlie",
        resourceType: "Page",
        siteId: site.id,
        title: "Zulu",
      })
      await setupPageResource({
        parentId: folder.id,
        permalink: "alpha",
        resourceType: "Page",
        siteId: site.id,
        title: "Alpha",
      })
      await setupPageResource({
        parentId: folder.id,
        permalink: "bravo",
        resourceType: "Page",
        siteId: site.id,
        title: "Mike",
      })

      // Act
      const result = await caller.listWithoutRoot({
        orderBy: "permalink-asc",
        resourceId: Number(folder.id),
        siteId: site.id,
      })

      // Assert
      expect(result.map((r) => r.permalink)).toEqual([
        "alpha",
        "bravo",
        "charlie",
      ])
    })

    it("should throw 403 if user does not have read access to site", async () => {
      // Arrange
      const { site } = await setupSite()

      // Act
      const result = caller.listWithoutRoot({
        siteId: site.id,
      })

      // Assert
      await expect(result).rejects.toThrow(
        new TRPCError({
          code: "FORBIDDEN",
          message:
            "You do not have sufficient permissions to perform this action",
        }),
      )
    })

    it.skip("should throw 403 if user does not have read access to the resource", async () => {})
  })

  describe("delete", () => {
    beforeEach(() => {
      vi.spyOn(auditService, "logResourceEvent").mockClear()
    })

    it("should throw 401 if not logged in", async () => {
      // Arrange
      const unauthedSession = applySession()
      const unauthedCaller = createCaller(createMockRequest(unauthedSession))
      const auditSpy = vitest.spyOn(auditService, "logResourceEvent")

      // Act
      const result = unauthedCaller.delete({
        resourceId: "1",
        siteId: 1,
      })

      expect(auditSpy).not.toHaveBeenCalled()
      await expect(result).rejects.toThrow(
        new TRPCError({ code: "UNAUTHORIZED" }),
      )
    })

    it("should return NOT_FOUND if resource to delete does not exist", async () => {
      // Arrange
      const { site } = await setupSite()
      await setupAdminPermissions({
        siteId: site.id,
        userId: session.userId,
      })
      const auditSpy = vitest.spyOn(auditService, "logResourceEvent")

      // Act
      const result = caller.delete({
        resourceId: "99999", // should not exist
        siteId: site.id,
      })

      // Assert
      await expect(result).rejects.toThrow(
        new TRPCError({ code: "NOT_FOUND", message: "Resource not found" }),
      )
      expect(auditSpy).not.toHaveBeenCalled()
    })

    it("should delete a page resource successfully", async () => {
      // Arrange
      const { page, site } = await setupPageResource({
        resourceType: "Page",
      })
      const auditSpy = vitest.spyOn(auditService, "logResourceEvent")
      await setupAdminPermissions({
        siteId: site.id,
        userId: session.userId,
      })
      const fullPage = getFullPageById(db, {
        resourceId: Number(page.id),
        siteId: site.id,
      })

      // Act
      const result = await caller.delete({
        resourceId: page.id,
        siteId: site.id,
      })

      // Assert
      const auditEntry = await db
        .selectFrom("AuditLog")
        .where("eventType", "=", "ResourceDelete")
        .selectAll()
        .executeTakeFirstOrThrow()
      expect(auditSpy).toHaveBeenCalled()
      expect(auditEntry.delta.before!).toMatchObject(
        omit(fullPage, ["createdAt", "updatedAt"]),
      )
      expect(auditEntry.userId).toBe(session.userId)
      const actual = await db
        .selectFrom("Resource")
        .where("id", "=", page.id)
        .executeTakeFirst()
      expect(actual).toBeUndefined()
      expect(result).toEqual(page)
    })

    it("should soft-delete redirects pointing to the deleted page", async () => {
      // Arrange — a live redirect whose destination references the page
      const { page, site } = await setupPageResource({ resourceType: "Page" })
      await setupAdminPermissions({ siteId: site.id, userId: session.userId })
      const redirect = await db
        .insertInto("Redirect")
        .values({
          destination: `[resource:${site.id}:${page.id}]`,
          siteId: site.id,
          source: "/old",
        })
        .returningAll()
        .executeTakeFirstOrThrow()

      // Act
      await caller.delete({ resourceId: page.id, siteId: site.id })

      // Assert — the redirect is soft-deleted in the same transaction and audited
      const after = await db
        .selectFrom("Redirect")
        .selectAll()
        .where("id", "=", redirect.id)
        .executeTakeFirstOrThrow()
      expect(after.deletedAt).not.toBeNull()
      const auditEntry = await db
        .selectFrom("AuditLog")
        .selectAll()
        .where("siteId", "=", site.id)
        .where("eventType", "=", "RedirectDelete")
        .executeTakeFirstOrThrow()
      expect(auditEntry.userId).toBe(session.userId)
    })

    it("should soft-delete redirects pointing to descendant pages of a deleted folder", async () => {
      // Arrange — a redirect to a page nested inside the folder being deleted
      const { folder, site } = await setupFolder()
      await setupAdminPermissions({ siteId: site.id, userId: session.userId })
      const { page } = await setupPageResource({
        parentId: folder.id,
        permalink: "leaf",
        resourceType: "Page",
        siteId: site.id,
      })
      const redirect = await db
        .insertInto("Redirect")
        .values({
          destination: `[resource:${site.id}:${page.id}]`,
          siteId: site.id,
          source: "/old",
        })
        .returningAll()
        .executeTakeFirstOrThrow()

      // Act
      await caller.delete({ resourceId: folder.id, siteId: site.id })

      // Assert
      const after = await db
        .selectFrom("Redirect")
        .selectAll()
        .where("id", "=", redirect.id)
        .executeTakeFirstOrThrow()
      expect(after.deletedAt).not.toBeNull()
    })

    it("should leave redirects pointing elsewhere untouched when deleting a page", async () => {
      // Arrange — a redirect to a different page must survive
      const { page, site } = await setupPageResource({ resourceType: "Page" })
      await setupAdminPermissions({ siteId: site.id, userId: session.userId })
      const { page: other } = await setupPageResource({
        permalink: "other",
        resourceType: "Page",
        siteId: site.id,
      })
      const redirect = await db
        .insertInto("Redirect")
        .values({
          destination: `[resource:${site.id}:${other.id}]`,
          siteId: site.id,
          source: "/old",
        })
        .returningAll()
        .executeTakeFirstOrThrow()

      // Act
      await caller.delete({ resourceId: page.id, siteId: site.id })

      // Assert — untouched
      const after = await db
        .selectFrom("Redirect")
        .selectAll()
        .where("id", "=", redirect.id)
        .executeTakeFirstOrThrow()
      expect(after.deletedAt).toBeNull()
    })

    it("should delete a folder and all its children (recursively) successfully", async () => {
      // Arrange
      const { folder: folderToUse, site } = await setupFolder()
      const auditSpy = vitest.spyOn(auditService, "logResourceEvent")
      await setupAdminPermissions({
        siteId: site.id,
        userId: session.userId,
      })
      const nestedPages = await Promise.all(
        Array.from({ length: 3 }, (_, i) => i).map(async (i) => {
          const { page } = await setupPageResource({
            parentId: folderToUse.id,
            permalink: `page-${i}`,
            resourceType: "Page",
            siteId: site.id,
            title: `Test page ${i}`,
          })
          return page.id
        }),
      )
      const nestedFolders = await Promise.all(
        Array.from({ length: 2 }, (_, i) => i).map(async (i) => {
          const { folder } = await setupFolder({
            parentId: folderToUse.id,
            permalink: `folder-${i}`,
            siteId: site.id,
            title: `Test folder ${i}`,
          })
          return folder.id
        }),
      )
      // Nested in nested
      const nestedInNested = await Promise.all(
        Array.from({ length: 3 }, (_, i) => i).map(async (i) => {
          const { page } = await setupPageResource({
            parentId: nestedFolders[1],
            permalink: `nested-page-${i}`,
            resourceType: "Page",
            siteId: site.id,
            title: `Nested page ${i}`,
          })
          return page.id
        }),
      )

      // Act
      const result = await caller.delete({
        resourceId: folderToUse.id,
        siteId: site.id,
      })

      // Assert
      const actual = await db
        .selectFrom("Resource")
        .where("id", "in", [
          ...nestedPages,
          ...nestedFolders,
          ...nestedInNested,
          folderToUse.id,
        ])
        .execute()
      expect(actual).toHaveLength(0)
      expect(result).toEqual(folderToUse)
      expect(auditSpy).toHaveBeenCalledTimes(1)
      const auditEntry = await db
        .selectFrom("AuditLog")
        .where("eventType", "=", "ResourceDelete")
        .selectAll()
        .executeTakeFirstOrThrow()
      expect(auditSpy).toHaveBeenCalled()
      expect(auditEntry.delta.before!).toMatchObject(
        omit(folderToUse, ["createdAt", "updatedAt"]),
      )
      expect(auditEntry.userId).toBe(session.userId)
    })

    it("should return 400 if resource to delete is a root page", async () => {
      // Arrange
      const { page, site } = await setupPageResource({
        resourceType: "RootPage",
      })
      const auditSpy = vitest.spyOn(auditService, "logResourceEvent")
      await setupAdminPermissions({
        siteId: site.id,
        userId: session.userId,
      })

      // Act
      const result = caller.delete({
        resourceId: page.id,
        siteId: site.id,
      })

      // Assert
      expect(auditSpy).not.toHaveBeenCalled()
      await expect(result).rejects.toThrow(
        new TRPCError({ code: "BAD_REQUEST" }),
      )
    })

    it("should return 400 if resource to delete is the search page (permalink /search, no parent)", async () => {
      // Arrange
      const { page, site } = await setupPageResource({
        parentId: null,
        permalink: "search",
        resourceType: "Page",
      })
      const auditSpy = vitest.spyOn(auditService, "logResourceEvent")
      await setupAdminPermissions({
        siteId: site.id,
        userId: session.userId,
      })

      // Act
      const result = caller.delete({
        resourceId: page.id,
        siteId: site.id,
      })

      // Assert
      expect(auditSpy).not.toHaveBeenCalled()
      await expect(result).rejects.toThrow(
        new TRPCError({
          code: "BAD_REQUEST",
          message: "The search page cannot be deleted",
        }),
      )
    })

    it("should throw 403 if user does not have delete access to the resource", async () => {
      // Arrange
      const { site, page } = await setupPageResource({
        resourceType: "Page",
      })
      // Editor has no delete permissions
      await setupEditorPermissions({
        siteId: site.id,
        userId: session.userId,
      })

      // Act
      const result = caller.delete({
        resourceId: page.id,
        siteId: site.id,
      })

      // Assert
      await expect(result).rejects.toThrow(
        new TRPCError({
          code: "FORBIDDEN",
          message:
            "You do not have sufficient permissions to perform this action",
        }),
      )
    })
  })

  describe("getParentOf", () => {
    it("should throw 401 if not logged in", async () => {
      // Arrange
      const unauthedSession = applySession()
      const unauthedCaller = createCaller(createMockRequest(unauthedSession))

      // Act
      const result = unauthedCaller.getParentOf({
        resourceId: "1",
        siteId: 1,
      })

      // Assert
      await expect(result).rejects.toThrow(
        new TRPCError({ code: "UNAUTHORIZED" }),
      )
    })

    it("should return 404 if resource does not exist", async () => {
      // Arrange
      const { site } = await setupSite()
      await setupEditorPermissions({
        siteId: site.id,
        userId: session.userId,
      })

      // Act
      const result = caller.getParentOf({
        resourceId: "99999", // should not exist
        siteId: site.id,
      })

      // Assert
      await expect(result).rejects.toThrow(
        new TRPCError({ code: "NOT_FOUND", message: "Resource not found" }),
      )
    })

    it("should return null parent if resource is a root page", async () => {
      // Arrange
      const { page, site } = await setupPageResource({
        resourceType: "RootPage",
      })
      await setupEditorPermissions({
        siteId: site.id,
        userId: session.userId,
      })

      // Act
      const result = await caller.getParentOf({
        resourceId: page.id,
        siteId: site.id,
      })

      // Assert
      const expected = {
        id: page.id,
        parent: null,
        title: page.title,
        type: "RootPage",
      }
      expect(result).toEqual(expected)
    })

    it("should return parent details for a nested resource", async () => {
      // Arrange
      const { folder: parentFolder, site } = await setupFolder({
        permalink: "parent-folder",
        title: "Parent folder",
      })
      const { page: nestedPage } = await setupPageResource({
        parentId: parentFolder.id,
        resourceType: "Page",
        siteId: site.id,
      })
      await setupEditorPermissions({
        siteId: site.id,
        userId: session.userId,
      })

      // Act
      const result = await caller.getParentOf({
        resourceId: nestedPage.id,
        siteId: site.id,
      })

      // Assert
      const expected = {
        ...pick(nestedPage, ["id", "type", "title"]),
        parent: {
          id: Number(parentFolder.id),
          ...pick(parentFolder, ["parentId", "type", "title"]),
        },
      }
      expect(result).toMatchObject(expected)
    })

    it("should return null parent if resource is a root-level resource", async () => {
      // Arrange
      const { page, site } = await setupPageResource({
        resourceType: "Page",
      })
      await setupEditorPermissions({
        siteId: site.id,
        userId: session.userId,
      })

      // Act
      const result = await caller.getParentOf({
        resourceId: page.id,
        siteId: site.id,
      })

      // Assert
      const expected = {
        id: page.id,
        parent: null,
        title: page.title,
        type: "Page",
      }
      expect(result).toEqual(expected)
    })

    it("should throw 403 if user does not have read access to the resource", async () => {
      // Arrange
      const { site, page } = await setupPageResource({
        resourceType: "Page",
      })

      // Act
      const result = caller.getParentOf({
        resourceId: page.id,
        siteId: site.id,
      })

      // Assert
      await expect(result).rejects.toThrow(
        new TRPCError({
          code: "FORBIDDEN",
          message:
            "You do not have sufficient permissions to perform this action",
        }),
      )
    })

    it.skip("should throw 403 if user does not have read access to the resource", async () => {})
  })

  describe("getWithFullPermalink", () => {
    it("should throw 401 if not logged in", async () => {
      // Arrange
      const unauthedSession = applySession()
      const unauthedCaller = createCaller(createMockRequest(unauthedSession))

      // Act
      const result = unauthedCaller.getWithFullPermalink({
        resourceId: "1",
        siteId: 1,
      })

      // Assert
      await expect(result).rejects.toThrow(
        new TRPCError({ code: "UNAUTHORIZED" }),
      )
    })

    it("should return 404 if resource does not exist", async () => {
      // Act
      const result = caller.getWithFullPermalink({
        resourceId: "99999",
        siteId: 1,
      })

      // Assert
      await expect(result).rejects.toThrow(
        new TRPCError({ code: "NOT_FOUND", message: "Resource not found" }),
      )
    })

    it("should return the details with full permalink of a first-level resource", async () => {
      // Arrange
      const { site, page } = await setupPageResource({
        resourceType: "Page",
      })
      await setupEditorPermissions({
        siteId: site.id,
        userId: session.userId,
      })

      // Act
      const result = await caller.getWithFullPermalink({
        resourceId: page.id,
        siteId: site.id,
      })

      // Assert
      const expected = {
        ...pick(page, ["id", "title"]),
        fullPermalink: page.permalink,
      }
      expect(result).toMatchObject(expected)
    })

    it("should return the details with full permalink of a nested-level resource", async () => {
      // Arrange
      const { folder: parentFolder, site } = await setupFolder({
        permalink: "parent-folder",
        title: "Parent folder",
      })
      const { folder: nestedFolder } = await setupFolder({
        parentId: parentFolder.id,
        permalink: "nested-folder",
        siteId: site.id,
        title: "Nested folder",
      })
      const { page: nestedPage } = await setupPageResource({
        parentId: nestedFolder.id,
        resourceType: "Page",
        siteId: site.id,
      })
      await setupEditorPermissions({
        siteId: site.id,
        userId: session.userId,
      })

      // Act
      const result = await caller.getWithFullPermalink({
        resourceId: nestedPage.id,
        siteId: site.id,
      })

      // Assert
      expect(result).toMatchObject({
        fullPermalink: `${parentFolder.permalink}/${nestedFolder.permalink}/${nestedPage.permalink}`,
        id: nestedPage.id,
        title: nestedPage.title,
      })
    })

    it("should throw 403 if user does not have read access to the site", async () => {
      // Arrange
      const { site, page } = await setupPageResource({
        resourceType: "Page",
      })

      // Act
      const result = caller.getWithFullPermalink({
        resourceId: page.id,
        siteId: site.id,
      })

      // Assert
      await expect(result).rejects.toThrow(
        new TRPCError({
          code: "FORBIDDEN",
          message:
            "You do not have sufficient permissions to perform this action",
        }),
      )
    })

    it.skip("should throw 403 if user does not have read access to the resource", async () => {})
  })

  describe("getAncestryStack", () => {
    const RESOURCE_FIELDS_TO_PICK = [
      "id",
      "title",
      "parentId",
      "permalink",
      "type",
    ] as const

    it("should throw 401 if not logged in", async () => {
      // Arrange
      const unauthedSession = applySession()
      const unauthedCaller = createCaller(createMockRequest(unauthedSession))

      // Act
      const result = unauthedCaller.getAncestryStack({
        resourceId: "1",
        siteId: "1",
      })

      // Assert
      await expect(result).rejects.toThrow(
        new TRPCError({ code: "UNAUTHORIZED" }),
      )
    })

    it("should throw 404 if resource does not exist", async () => {
      // Arrange
      const { site } = await setupSite()
      await setupEditorPermissions({
        siteId: site.id,
        userId: session.userId,
      })

      // Act
      const result = caller.getAncestryStack({
        resourceId: "99999",
        siteId: String(site.id),
      })

      // Assert
      await expect(result).rejects.toThrow(
        new TRPCError({ code: "NOT_FOUND", message: "Resource not found" }),
      )
    })

    it("should return empty array if resource is a root page", async () => {
      // Arrange
      const { page, site } = await setupPageResource({
        resourceType: "RootPage",
      })
      await setupEditorPermissions({
        siteId: site.id,
        userId: session.userId,
      })

      // Act
      const result = await caller.getAncestryStack({
        resourceId: page.id,
        siteId: String(site.id),
      })

      // Assert
      expect(result).toEqual([])
    })

    it("should return empty array if `resourceId` is not provided", async () => {
      // Arrange
      const { site } = await setupSite()
      await setupEditorPermissions({
        siteId: site.id,
        userId: session.userId,
      })

      // Act
      const result = await caller.getAncestryStack({
        siteId: String(site.id),
      })

      // Assert
      expect(result).toEqual([])
    })

    it("should return the ancestry (including self and excluding root page) of a nested resource", async () => {
      // Arrange
      const { site } = await setupPageResource({
        resourceType: "RootPage",
      })
      const { folder: parentFolder } = await setupFolder({
        permalink: "parent-folder",
        siteId: site.id,
        title: "Parent folder",
      })
      const { folder: nestedFolder } = await setupFolder({
        parentId: parentFolder.id,
        permalink: "nested-folder",
        siteId: site.id,
        title: "Nested folder",
      })
      const { page: nestedPage } = await setupPageResource({
        parentId: nestedFolder.id,
        resourceType: "Page",
        siteId: site.id,
      })
      await setupEditorPermissions({
        siteId: site.id,
        userId: session.userId,
      })

      // Act
      const result = await caller.getAncestryStack({
        includeSelf: true,
        resourceId: nestedPage.id,
        siteId: String(site.id),
      })

      // Assert
      const expected = [
        pick(parentFolder, RESOURCE_FIELDS_TO_PICK),
        pick(nestedFolder, RESOURCE_FIELDS_TO_PICK),
        pick(nestedPage, RESOURCE_FIELDS_TO_PICK),
      ]
      expect(result).toEqual(expected)
    })

    it("should return empty resource if resource is a root-level resource", async () => {
      // Arrange
      const { page, site } = await setupPageResource({
        resourceType: "Page",
      })
      await setupEditorPermissions({
        siteId: site.id,
        userId: session.userId,
      })

      // Act
      const result = await caller.getAncestryStack({
        includeSelf: true,
        resourceId: page.id,
        siteId: String(site.id),
      })

      // Assert
      expect(result).toEqual([pick(page, RESOURCE_FIELDS_TO_PICK)])
    })

    it("should return the ancestry (excluding self) of a nested resource", async () => {
      // Arrange
      const { site } = await setupPageResource({
        resourceType: "RootPage",
      })
      const { folder: parentFolder } = await setupFolder({
        permalink: "parent-folder",
        title: "Parent folder",
      })
      const { folder: nestedFolder } = await setupFolder({
        parentId: parentFolder.id,
        permalink: "nested-folder",
        siteId: site.id,
        title: "Nested folder",
      })
      const { page: nestedPage } = await setupPageResource({
        parentId: nestedFolder.id,
        resourceType: "Page",
        siteId: site.id,
      })
      await setupEditorPermissions({
        siteId: site.id,
        userId: session.userId,
      })

      // Act
      const result = await caller.getAncestryStack({
        includeSelf: false,
        resourceId: nestedPage.id,
        siteId: String(site.id),
      })

      // Assert
      expect(result).toEqual([
        pick(parentFolder, RESOURCE_FIELDS_TO_PICK),
        pick(nestedFolder, RESOURCE_FIELDS_TO_PICK),
      ])
    })

    it("should throw 403 if user does not have read access to the site", async () => {
      // Arrange
      const { site, page } = await setupPageResource({
        resourceType: "Page",
      })

      // Act
      const result = caller.getAncestryStack({
        includeSelf: true,
        resourceId: page.id,
        siteId: String(site.id),
      })

      // Assert
      await expect(result).rejects.toThrow(
        new TRPCError({
          code: "FORBIDDEN",
          message:
            "You do not have sufficient permissions to perform this action",
        }),
      )
    })

    it.skip("should throw 403 if user does not have read access to the resource", async () => {})
  })

  describe("getBatchAncestryWithSelf", () => {
    const RESOURCE_FIELDS_TO_PICK = [
      "id",
      "title",
      "parentId",
      "permalink",
      "type",
    ] as const

    it("should throw 401 if not logged in", async () => {
      // Arrange
      const unauthedSession = applySession()
      const unauthedCaller = createCaller(createMockRequest(unauthedSession))

      // Act
      const result = unauthedCaller.getBatchAncestryWithSelf({
        resourceIds: ["1", "2", "3"],
        siteId: "1",
      })

      // Assert
      await expect(result).rejects.toThrow(
        new TRPCError({ code: "UNAUTHORIZED" }),
      )
    })

    it("should return correct ancestry for a nested resource", async () => {
      // Arrange
      const { site } = await setupPageResource({
        resourceType: "RootPage",
      })
      const { folder: parentFolder } = await setupFolder({
        permalink: "parent-folder",
        title: "Parent folder",
      })
      const { folder: nestedFolder } = await setupFolder({
        parentId: parentFolder.id,
        permalink: "nested-folder",
        siteId: site.id,
        title: "Nested folder",
      })
      const { page: nestedPage } = await setupPageResource({
        parentId: nestedFolder.id,
        resourceType: "Page",
        siteId: site.id,
      })
      await setupEditorPermissions({
        siteId: site.id,
        userId: session.userId,
      })

      // Act
      const result = await caller.getBatchAncestryWithSelf({
        resourceIds: [nestedPage.id],
        siteId: String(site.id),
      })

      // Assert
      const expected = [
        [
          pick(parentFolder, RESOURCE_FIELDS_TO_PICK),
          pick(nestedFolder, RESOURCE_FIELDS_TO_PICK),
          pick(nestedPage, RESOURCE_FIELDS_TO_PICK),
        ],
      ]
      expect(result).toEqual(expected)
    })

    it("should throw 403 if user does not have read access to the site", async () => {
      // Arrange
      const { site, page } = await setupPageResource({
        resourceType: "RootPage",
      })

      // Act
      const result = caller.getBatchAncestryWithSelf({
        resourceIds: [page.id],
        siteId: String(site.id),
      })

      // Assert
      await expect(result).rejects.toThrow(
        new TRPCError({
          code: "FORBIDDEN",
          message:
            "You do not have sufficient permissions to perform this action",
        }),
      )
    })

    it("should accept requests up to MAX_BATCH_RESOURCE_IDS", async () => {
      // Arrange - use one existing resource ID repeated to hit the limit
      const { site } = await setupSite()
      await setupEditorPermissions({ siteId: site.id, userId: session.userId })

      const resourceIds: string[] = []
      for (let i = 0; i < MAX_BATCH_RESOURCE_IDS; i++) {
        const { page } = await setupPageResource({
          permalink: `page-${i + 1}`,
          resourceType: "Page",
          siteId: site.id,
        })
        resourceIds.push(page.id)
      }

      // Act
      const result = await caller.getBatchAncestryWithSelf({
        resourceIds,
        siteId: String(site.id),
      })

      // Assert
      expect(result).toHaveLength(MAX_BATCH_RESOURCE_IDS)
    })

    it("should reject requests over MAX_BATCH_RESOURCE_IDS", async () => {
      // Arrange
      const { site } = await setupSite()
      await setupEditorPermissions({ siteId: site.id, userId: session.userId })

      // Act
      const result = caller.getBatchAncestryWithSelf({
        resourceIds: makeResourceIds(MAX_BATCH_RESOURCE_IDS + 1),
        siteId: String(site.id),
      })

      // Assert
      await expect(result).rejects.toMatchObject({ code: "BAD_REQUEST" })
    })

    it.skip("should throw 403 if user does not have read access to the resources", async () => {})
  })

  describe("search", () => {
    const RESOURCE_FIELDS_TO_PICK = [
      "id",
      "title",
      "type",
      "parentId",
      "fullPermalink",
    ] as const

    it("should throw 401 if not logged in", async () => {
      // Arrange
      const unauthedSession = applySession()
      const unauthedCaller = createCaller(createMockRequest(unauthedSession))

      // Act
      const result = unauthedCaller.search({
        query: "test",
        siteId: "1",
      })

      // Assert
      await expect(result).rejects.toThrow(
        new TRPCError({ code: "UNAUTHORIZED" }),
      )
    })

    it("should throw 403 if user does not have read access to site", async () => {
      // Arrange
      const { site } = await setupSite()

      // Act
      const result = caller.search({
        query: "test",
        siteId: String(site.id),
      })

      // Assert
      await expect(result).rejects.toThrow(
        new TRPCError({
          code: "FORBIDDEN",
          message:
            "You do not have sufficient permissions to perform this action",
        }),
      )
    })

    it.skip("should throw 403 if user does not have read access to resource", async () => {})

    it("should return empty results if no resources exist", async () => {
      // Arrange
      const { site } = await setupSite()
      await setupAdminPermissions({
        siteId: site.id,
        userId: session.userId,
      })

      // Act
      const result = await caller.search({
        query: "test",
        siteId: String(site.id),
      })

      // Assert
      const expected = {
        nextOffset: null,
        recentlyEdited: [],
        resources: [],
        totalCount: 0,
      }
      expect(result).toEqual(expected)
    })

    it("should return the full permalink of resources", async () => {
      // Arrange
      const { site } = await setupSite()
      await setupAdminPermissions({
        siteId: site.id,
        userId: session.userId,
      })
      const { folder: folder1 } = await setupFolder({
        siteId: site.id,
      })
      const { folder: folder2 } = await setupFolder({
        parentId: folder1.id,
        siteId: site.id,
      })
      const { page } = await setupPageResource({
        parentId: folder2.id,
        resourceType: "Page",
        siteId: site.id,
      })

      // Act
      const result = await caller.search({
        query: "test",
        siteId: String(site.id),
      })

      // Assert
      const expected = {
        nextOffset: null,
        recentlyEdited: [],
        resources: [
          {
            ...pick(page, RESOURCE_FIELDS_TO_PICK),
            fullPermalink: `${folder1.permalink}/${folder2.permalink}/${page.permalink}`,
            lastUpdatedAt: page.updatedAt,
          },
          {
            ...pick(folder2, RESOURCE_FIELDS_TO_PICK),
            fullPermalink: `${folder1.permalink}/${folder2.permalink}`,
            lastUpdatedAt: folder2.updatedAt,
          },
          {
            ...pick(folder1, RESOURCE_FIELDS_TO_PICK),
            fullPermalink: folder1.permalink,
            lastUpdatedAt: folder1.updatedAt,
          },
        ],
        totalCount: 3,
      }
      expect(result).toEqual(expected)
    })

    it("should use the draft blob updatedAt datetime if available", async () => {
      // Arrange
      const { site } = await setupSite()
      await setupAdminPermissions({
        siteId: site.id,
        userId: session.userId,
      })
      const blob = await setupBlob()
      const { page: page1 } = await setupPageResource({
        blobId: blob.id,
        permalink: "page-1",
        resourceType: "Page",
        siteId: site.id,
      })
      const { page: page2 } = await setupPageResource({
        permalink: "page-2",
        resourceType: "Page",
        siteId: site.id,
      })
      const updatedBlob = await db
        .updateTable("Blob")
        .set({ updatedAt: new Date() })
        .where("id", "=", blob.id)
        .returningAll()
        .executeTakeFirstOrThrow()

      // Act
      const result = await caller.search({
        query: "test",
        siteId: String(site.id),
      })

      // Assert
      const expected = {
        nextOffset: null,
        recentlyEdited: [],
        resources: [
          {
            ...pick(page1, RESOURCE_FIELDS_TO_PICK),
            fullPermalink: page1.permalink,
            lastUpdatedAt: updatedBlob.updatedAt,
          },
          {
            ...pick(page2, RESOURCE_FIELDS_TO_PICK),
            fullPermalink: page2.permalink,
            lastUpdatedAt: page2.updatedAt,
          },
        ],
        totalCount: 2,
      }
      expect(result).toEqual(expected)
    })

    it("should return totalCount as a number", async () => {
      // Arrange
      const numberOfPages = 15 // arbitrary number above the default limit of 10
      const { site } = await setupSite()
      await setupAdminPermissions({
        siteId: site.id,
        userId: session.userId,
      })
      for (let index = 0; index < numberOfPages; index++) {
        await setupPageResource({
          permalink: `page-${index + 1}`,
          resourceType: "Page",
          siteId: site.id,
        })
      }

      // Act
      const result = await caller.search({
        query: "test",
        siteId: String(site.id),
      })

      // Assert
      expect(result.totalCount).toEqual(numberOfPages)
    })

    it("should return recentlyEdited as an empty array", async () => {
      // Arrange
      const { site } = await setupSite()
      await setupAdminPermissions({
        siteId: site.id,
        userId: session.userId,
      })
      await setupPageResource({ resourceType: "Page", siteId: site.id })

      // Act
      const result = await caller.search({
        query: "test",
        siteId: String(site.id),
      })

      // Assert
      expect(result.recentlyEdited).toEqual([])
    })

    it("should match all search terms and order by relevance", async () => {
      // Arrange
      const { site } = await setupSite()
      await setupAdminPermissions({
        siteId: site.id,
        userId: session.userId,
      })
      const { page: page1 } = await setupPageResource({
        permalink: "apple-banana-cherry-durian",
        resourceType: "Page",
        siteId: site.id,
        title: "apple banana cherry durian", // matches all search terms,
      })
      await setupPageResource({
        permalink: "apple-banana-cherry",
        resourceType: "Page",
        siteId: site.id,
        title: "apple banana cherry", // missing durian,
      })
      await setupPageResource({
        permalink: "banana",
        resourceType: "Page",
        siteId: site.id,
        title: "banana", // missing apple and durian,
      })

      // Act
      const result = await caller.search({
        query: "apple banana durian",
        siteId: String(site.id),
      })

      // Assert
      const expected = {
        nextOffset: null,
        recentlyEdited: [],
        resources: [
          {
            ...pick(page1, RESOURCE_FIELDS_TO_PICK),
            fullPermalink: page1.permalink,
            lastUpdatedAt: page1.updatedAt,
          },
        ],
        totalCount: 1,
      }
      expect(result).toEqual(expected)
    })

    it("should exclude resources that match only some search terms", async () => {
      // Arrange
      const { site } = await setupSite()
      await setupAdminPermissions({
        siteId: site.id,
        userId: session.userId,
      })
      await setupPageResource({
        permalink: "apple-pie",
        resourceType: "Page",
        siteId: site.id,
        title: "apple pie",
      })

      // Act
      const result = await caller.search({
        query: "apple banana",
        siteId: String(site.id),
      })

      // Assert
      const expected = {
        nextOffset: null,
        recentlyEdited: [],
        resources: [],
        totalCount: 0,
      }
      expect(result).toEqual(expected)
    })

    it("should match all search terms when some appear mid-title", async () => {
      // Arrange
      const { site } = await setupSite()
      await setupAdminPermissions({
        siteId: site.id,
        userId: session.userId,
      })
      const { page } = await setupPageResource({
        permalink: "guide-to-apple-services",
        resourceType: "Page",
        siteId: site.id,
        title: "Guide to Apple Services",
      })

      // Act
      const result = await caller.search({
        query: "guide apple",
        siteId: String(site.id),
      })

      // Assert
      const expected = {
        nextOffset: null,
        recentlyEdited: [],
        resources: [
          {
            ...pick(page, RESOURCE_FIELDS_TO_PICK),
            fullPermalink: page.permalink,
            lastUpdatedAt: page.updatedAt,
          },
        ],
        totalCount: 1,
      }
      expect(result).toEqual(expected)
    })

    it("should match all search terms case-insensitively", async () => {
      // Arrange
      const { site } = await setupSite()
      await setupAdminPermissions({
        siteId: site.id,
        userId: session.userId,
      })
      const { page } = await setupPageResource({
        permalink: "annual-budget-report",
        resourceType: "Page",
        siteId: site.id,
        title: "Annual Budget Report",
      })

      // Act
      const result = await caller.search({
        query: "ANNUAL budget",
        siteId: String(site.id),
      })

      // Assert
      const expected = {
        nextOffset: null,
        recentlyEdited: [],
        resources: [
          {
            ...pick(page, RESOURCE_FIELDS_TO_PICK),
            fullPermalink: page.permalink,
            lastUpdatedAt: page.updatedAt,
          },
        ],
        totalCount: 1,
      }
      expect(result).toEqual(expected)
    })

    it("should return resources in order of most recently updated if same search terms", async () => {
      // Arrange
      const { site } = await setupSite()
      await setupAdminPermissions({
        siteId: site.id,
        userId: session.userId,
      })
      const { page: page1 } = await setupPageResource({
        permalink: "page-1",
        resourceType: "Page",
        siteId: site.id,
      })
      const { page: page2 } = await setupPageResource({
        permalink: "page-2",
        resourceType: "Page",
        siteId: site.id,
      })

      // Act
      const result = await caller.search({
        query: "test",
        siteId: String(site.id),
      })

      // Assert
      const expected = {
        nextOffset: null,
        recentlyEdited: [],
        resources: [
          {
            ...pick(page2, RESOURCE_FIELDS_TO_PICK),
            fullPermalink: page2.permalink,
            lastUpdatedAt: page2.updatedAt,
          },
          {
            ...pick(page1, RESOURCE_FIELDS_TO_PICK),
            fullPermalink: page1.permalink,
            lastUpdatedAt: page1.updatedAt,
          },
        ],
        totalCount: 2,
      }
      expect(result).toEqual(expected)
    })

    it("should return resources that by prefix for each word in the title", async () => {
      // Arrange
      const { site } = await setupSite()
      await setupAdminPermissions({
        siteId: site.id,
        userId: session.userId,
      })
      await setupPageResource({
        permalink: "shouldnotmatch",
        resourceType: "Page",
        siteId: site.id,
        title: "shouldnotmatch",
      })
      const { page } = await setupPageResource({
        permalink: "match",
        resourceType: "Page",
        siteId: site.id,
        title: "match",
      })

      // Act
      const result = await caller.search({
        query: "match",
        siteId: String(site.id),
      })

      // Assert
      const expected = {
        nextOffset: null,
        recentlyEdited: [],
        resources: [
          {
            ...pick(page, RESOURCE_FIELDS_TO_PICK),
            fullPermalink: page.permalink,
            lastUpdatedAt: page.updatedAt,
          },
        ],
        totalCount: 1,
      }
      expect(result).toEqual(expected)
    })

    it("should rank results by not double counting ranking order for each search term", async () => {
      // Arrange
      const { site } = await setupSite()
      await setupAdminPermissions({
        siteId: site.id,
        userId: session.userId,
      })
      const { page: page1 } = await setupPageResource({
        permalink: "banana-banana-apple",
        resourceType: "Page",
        siteId: site.id,
        title: "banana banana apple",
      })
      const { page: page2 } = await setupPageResource({
        permalink: "banana-apple",
        resourceType: "Page",
        siteId: site.id,
        title: "banana apple",
      })

      // Act
      const result = await caller.search({
        query: "banana apple",
        siteId: String(site.id),
      })

      // Assert
      const expected = {
        nextOffset: null,
        recentlyEdited: [],
        resources: [
          {
            ...pick(page2, RESOURCE_FIELDS_TO_PICK),
            fullPermalink: page2.permalink,
            lastUpdatedAt: page2.updatedAt,
          },
          {
            ...pick(page1, RESOURCE_FIELDS_TO_PICK),
            fullPermalink: page1.permalink,
            lastUpdatedAt: page1.updatedAt,
          },
        ],
        totalCount: 2,
      }
      expect(result).toEqual(expected)
    })

    it("should require each search term to prefix-match a title word", async () => {
      // Arrange — a title word that is only a prefix of a search term (e.g.
      // "long" for "longterm") must not count as a match
      const { site } = await setupSite()
      await setupAdminPermissions({
        siteId: site.id,
        userId: session.userId,
      })
      const { page: matchingPage } = await setupPageResource({
        permalink: "longterm-short",
        resourceType: "Page",
        siteId: site.id,
        title: "longterm short",
      })
      await setupPageResource({
        permalink: "long-short",
        resourceType: "Page",
        siteId: site.id,
        title: "long short",
      })

      // Act
      const result = await caller.search({
        query: "longterm short",
        siteId: String(site.id),
      })

      // Assert
      const expected = {
        nextOffset: null,
        recentlyEdited: [],
        resources: [
          {
            ...pick(matchingPage, RESOURCE_FIELDS_TO_PICK),
            fullPermalink: matchingPage.permalink,
            lastUpdatedAt: matchingPage.updatedAt,
          },
        ],
        totalCount: 1,
      }
      expect(result).toEqual(expected)
    })

    it("should not return resources that do not match the search query", async () => {
      // Arrange
      const { site } = await setupSite()
      await setupAdminPermissions({
        siteId: site.id,
        userId: session.userId,
      })
      await setupPageResource({
        resourceType: "Page",
        siteId: site.id,
        title: "whatever",
      })

      // Act
      const result = await caller.search({
        query: "test",
        siteId: String(site.id),
      })

      // Assert
      const expected = {
        nextOffset: null,
        recentlyEdited: [],
        resources: [],
        totalCount: 0,
      }
      expect(result).toEqual(expected)
    })

    it("should not return resources matched by empty space if query terms are separated by spaces", async () => {
      // Arrange
      const { site } = await setupSite()
      await setupAdminPermissions({
        siteId: site.id,
        userId: session.userId,
      })
      const { page: page1 } = await setupPageResource({
        permalink: "test",
        resourceType: "Page",
        siteId: site.id,
        title: "test",
      })
      await setupPageResource({
        permalink: "something-else",
        resourceType: "Page",
        siteId: site.id,
        title: "something else",
      })

      // Act
      const result = await caller.search({
        query: "test  test",
        siteId: String(site.id),
      })

      // Assert
      const expected = {
        nextOffset: null,
        recentlyEdited: [],
        resources: [
          {
            ...pick(page1, RESOURCE_FIELDS_TO_PICK),
            fullPermalink: page1.permalink,
            lastUpdatedAt: page1.updatedAt,
          },
        ],
        totalCount: 1,
      }
      expect(result).toEqual(expected)
    })

    it("should only return user viewable resource types if specified", async () => {
      // Arrange
      const { site } = await setupSite()
      await setupAdminPermissions({
        siteId: site.id,
        userId: session.userId,
      })
      const { collection: collection1 } = await setupCollection({
        siteId: site.id,
      })
      const { folder: folder1 } = await setupFolder({ siteId: site.id })
      const { page: page1 } = await setupPageResource({
        resourceType: "Page",
        siteId: site.id,
      })
      const { page: collectionPage } = await setupPageResource({
        resourceType: "CollectionPage",
        siteId: site.id,
      })
      const { collectionLink } = await setupCollectionLink({
        collectionId: collection1.id,
        siteId: site.id,
      })
      await setupPageResource({ resourceType: "IndexPage", siteId: site.id })
      await setupFolderMeta({ folderId: folder1.id, siteId: site.id })

      // Act
      const result = await caller.search({
        query: "test",
        resourceTypes: USER_VIEWABLE_RESOURCE_TYPES,
        siteId: String(site.id),
      })

      // Assert
      const expected = {
        nextOffset: null,
        recentlyEdited: [],
        resources: [
          {
            ...pick(collectionLink, RESOURCE_FIELDS_TO_PICK),
            fullPermalink: `${collection1.permalink}/${collectionLink.permalink}`,
            lastUpdatedAt: collectionLink.updatedAt,
          },
          {
            ...pick(collectionPage, RESOURCE_FIELDS_TO_PICK),
            fullPermalink: collectionPage.permalink,
            lastUpdatedAt: collectionPage.updatedAt,
          },
          {
            ...pick(page1, RESOURCE_FIELDS_TO_PICK),
            fullPermalink: page1.permalink,
            lastUpdatedAt: page1.updatedAt,
          },
          {
            ...pick(folder1, RESOURCE_FIELDS_TO_PICK),
            fullPermalink: folder1.permalink,
            lastUpdatedAt: folder1.updatedAt,
          },
          {
            ...pick(collection1, RESOURCE_FIELDS_TO_PICK),
            fullPermalink: collection1.permalink,
            lastUpdatedAt: collection1.updatedAt,
          },
        ],
        totalCount: 5,
      }
      expect(result).toEqual(expected)
    })

    it("should not return resources from another site", async () => {
      // Arrange
      const { site: site1 } = await setupSite()
      await setupAdminPermissions({
        siteId: site1.id,
        userId: session.userId,
      })
      const { site: site2 } = await setupSite()
      await setupAdminPermissions({
        siteId: site2.id,
        userId: session.userId,
      })
      await setupPageResource({ resourceType: "Page", siteId: site1.id })

      // Act
      const result = await caller.search({
        query: "test",
        siteId: String(site2.id),
      })

      // Assert
      const expected = {
        nextOffset: null,
        recentlyEdited: [],
        resources: [],
        totalCount: 0,
      }
      expect(result).toEqual(expected)
    })

    it("should return the correct values if query is empty string", async () => {
      // Arrange
      const { site } = await setupSite()
      await setupAdminPermissions({
        siteId: site.id,
        userId: session.userId,
      })
      const { page: page1 } = await setupPageResource({
        resourceType: "Page",
        siteId: site.id,
      })

      // Act
      const result = await caller.search({
        query: "",
        siteId: String(site.id),
      })

      // Assert
      const expected = {
        nextOffset: null,
        recentlyEdited: [
          {
            ...pick(page1, RESOURCE_FIELDS_TO_PICK),
            fullPermalink: page1.permalink,
            lastUpdatedAt: page1.updatedAt,
          },
        ],
        resources: [],
        totalCount: null,
      }
      expect(result).toEqual(expected)
    })

    it("should return the correct values if query is a string of whitespaces", async () => {
      // Arrange
      const { site } = await setupSite()
      await setupAdminPermissions({
        siteId: site.id,
        userId: session.userId,
      })
      const { page: page1 } = await setupPageResource({
        resourceType: "Page",
        siteId: site.id,
      })

      // Act
      const result = await caller.search({
        query: "       ",
        siteId: String(site.id),
      })

      // Assert
      const expected = {
        nextOffset: null,
        recentlyEdited: [
          {
            ...pick(page1, RESOURCE_FIELDS_TO_PICK),
            fullPermalink: page1.permalink,
            lastUpdatedAt: page1.updatedAt,
          },
        ],
        resources: [],
        totalCount: null,
      }
      expect(result).toEqual(expected)
    })

    it("should return the correct values if query is not provided", async () => {
      // Arrange
      const { site } = await setupSite()
      await setupAdminPermissions({
        siteId: site.id,
        userId: session.userId,
      })
      const { page: page1 } = await setupPageResource({
        resourceType: "Page",
        siteId: site.id,
      })

      // Act
      const result = await caller.search({
        siteId: String(site.id),
      })

      // Assert
      const expected = {
        nextOffset: null,
        recentlyEdited: [
          {
            ...pick(page1, RESOURCE_FIELDS_TO_PICK),
            fullPermalink: page1.permalink,
            lastUpdatedAt: page1.updatedAt,
          },
        ],
        resources: [],
        totalCount: null,
      }
      expect(result).toEqual(expected)
    })

    it("recentlyEdited should be ordered by lastUpdatedAt", async () => {
      // Arrange
      const { site } = await setupSite()
      await setupAdminPermissions({
        siteId: site.id,
        userId: session.userId,
      })
      const { page: page1 } = await setupPageResource({
        permalink: "page-1",
        resourceType: "Page",
        siteId: site.id,
        title: "page 1",
      })
      const { page: page2 } = await setupPageResource({
        permalink: "page-2",
        resourceType: "Page",
        siteId: site.id,
        title: "page 2",
      })

      // Act
      const result = await caller.search({
        siteId: String(site.id),
      })

      // Assert
      const expected = {
        nextOffset: null,
        recentlyEdited: [
          {
            ...pick(page2, RESOURCE_FIELDS_TO_PICK),
            fullPermalink: page2.permalink,
            lastUpdatedAt: page2.updatedAt,
          },
          {
            ...pick(page1, RESOURCE_FIELDS_TO_PICK),
            fullPermalink: page1.permalink,
            lastUpdatedAt: page1.updatedAt,
          },
        ],
        resources: [],
        totalCount: null,
      }
      expect(result).toEqual(expected)
    })

    it("recentlyEdited should only return page-ish resources", async () => {
      // Arrange
      const { site } = await setupSite()
      await setupAdminPermissions({
        siteId: site.id,
        userId: session.userId,
      })
      await setupPageResource({ resourceType: "RootPage", siteId: site.id })
      const { folder: folder1 } = await setupFolder({ siteId: site.id })
      await setupFolderMeta({ folderId: folder1.id, siteId: site.id })
      await setupCollection({ siteId: site.id })

      // Act
      const result = await caller.search({
        siteId: String(site.id),
      })

      // Assert
      const expected = {
        nextOffset: null,
        recentlyEdited: [],
        resources: [],
        totalCount: null,
      }
      expect(result).toEqual(expected)
    })

    describe("limit", () => {
      it("should return up to 10 most recently edited resources if no limit is provided", async () => {
        // Arrange
        const { site } = await setupSite()
        await setupAdminPermissions({
          siteId: site.id,
          userId: session.userId,
        })
        const pages = []
        for (let index = 0; index < 11; index++) {
          pages.push(
            await setupPageResource({
              permalink: `page-${index + 1}`,
              resourceType: "Page",
              siteId: site.id,
            }),
          )
        }

        // Act
        const result = await caller.search({
          query: "test",
          siteId: String(site.id),
        })

        // Assert
        const expected = {
          nextOffset: 10,
          recentlyEdited: [],
          resources: pages
            .reverse()
            .slice(0, 10)
            .map((page) => {
              const { page: pageX } = page
              return {
                ...pick(pageX, RESOURCE_FIELDS_TO_PICK),
                fullPermalink: pageX.permalink,
                lastUpdatedAt: pageX.updatedAt,
              }
            }),
          totalCount: 11,
        }
        expect(result).toEqual(expected)
      })

      it("should return limit number of resources according to the the `limit` parameter", async () => {
        // Arrange
        const { site } = await setupSite()
        await setupAdminPermissions({
          siteId: site.id,
          userId: session.userId,
        })
        await setupPageResource({
          permalink: "page-1",
          resourceType: "Page",
          siteId: site.id,
        })
        const { page: page2 } = await setupPageResource({
          permalink: "page-2",
          resourceType: "Page",
          siteId: site.id,
        })
        const { page: page3 } = await setupPageResource({
          permalink: "page-3",
          resourceType: "Page",
          siteId: site.id,
        })

        // Act
        const result = await caller.search({
          limit: 2,
          query: "test",
          siteId: String(site.id),
        })

        // Assert
        const expected = {
          nextOffset: 2,
          recentlyEdited: [],
          resources: [
            {
              ...pick(page3, RESOURCE_FIELDS_TO_PICK),
              fullPermalink: page3.permalink,
              lastUpdatedAt: page3.updatedAt,
            },
            {
              ...pick(page2, RESOURCE_FIELDS_TO_PICK),
              fullPermalink: page2.permalink,
              lastUpdatedAt: page2.updatedAt,
            },
          ],
          totalCount: 3,
        }
        expect(result).toEqual(expected)
      })

      it("should return all items if limit is greater than the number of items", async () => {
        // Arrange
        const { site } = await setupSite()
        await setupAdminPermissions({
          siteId: site.id,
          userId: session.userId,
        })
        const { page: page1 } = await setupPageResource({
          resourceType: "Page",
          siteId: site.id,
        })

        // Act
        const result = await caller.search({
          limit: 2,
          query: "test",
          siteId: String(site.id),
        })

        // Assert
        const expected = {
          nextOffset: null,
          recentlyEdited: [],
          resources: [
            {
              ...pick(page1, RESOURCE_FIELDS_TO_PICK),
              fullPermalink: page1.permalink,
              lastUpdatedAt: page1.updatedAt,
            },
          ],
          totalCount: 1,
        }
        expect(result).toEqual(expected)
      })
    })

    describe("cursor", () => {
      it("should return empty results if `cursor` is invalid", async () => {
        // Arrange
        const { site } = await setupSite()
        await setupAdminPermissions({
          siteId: site.id,
          userId: session.userId,
        })
        await setupPageResource({ resourceType: "Page", siteId: site.id })

        // Act
        const result = await caller.search({
          cursor: 600,
          query: "test",
          siteId: String(site.id),
        })

        const expected = {
          nextOffset: null,
          recentlyEdited: [],
          resources: [],
          totalCount: 1,
        }
        expect(result).toEqual(expected)
      })

      it("should return the next set of resources if valid `cursor` is provided", async () => {
        // Arrange
        const { site } = await setupSite()
        await setupAdminPermissions({
          siteId: site.id,
          userId: session.userId,
        })
        const pages = []
        for (let index = 0; index < 31; index++) {
          pages.push(
            await setupPageResource({
              permalink: `page-${index + 1}`,
              resourceType: "Page",
              siteId: site.id,
            }),
          )
        }

        // Act
        const result = await caller.search({
          cursor: 10,
          query: "test",
          siteId: String(site.id),
        })

        // Assert
        const expected = {
          nextOffset: 20,
          recentlyEdited: [],
          resources: pages
            .reverse()
            .slice(10, 20)
            .map((page) => {
              const { page: pageX } = page
              return {
                ...pick(pageX, RESOURCE_FIELDS_TO_PICK),
                fullPermalink: pageX.permalink,
                lastUpdatedAt: pageX.updatedAt,
              }
            }),
          totalCount: 31,
        }
        expect(result).toEqual(expected)
      })
    })
  })

  describe("searchWithResourceIds", () => {
    const RESOURCE_FIELDS_TO_PICK = ["id", "title", "parentId", "type"] as const

    it("should throw 401 if not logged in", async () => {
      // Arrange
      const unauthedSession = applySession()
      const unauthedCaller = createCaller(createMockRequest(unauthedSession))

      // Act
      const result = unauthedCaller.searchWithResourceIds({
        resourceIds: ["1", "2", "3"],
        siteId: "1",
      })

      // Assert
      await expect(result).rejects.toThrow(
        new TRPCError({ code: "UNAUTHORIZED" }),
      )
    })

    it("should return the resources if user has read access to the resources", async () => {
      // Arrange
      const { site, page } = await setupPageResource({
        resourceType: "Page",
      })
      await setupEditorPermissions({
        siteId: site.id,
        userId: session.userId,
      })

      // Act
      const result = await caller.searchWithResourceIds({
        resourceIds: [page.id],
        siteId: String(site.id),
      })

      // Assert
      expect(result).toEqual([
        {
          ...pick(page, RESOURCE_FIELDS_TO_PICK),
          fullPermalink: page.permalink,
          lastUpdatedAt: null,
        },
      ])
    })

    it("should throw 403 if user does not have read access to the site", async () => {
      // Arrange
      const { site, page } = await setupPageResource({
        resourceType: "Page",
      })

      // Act
      const result = caller.searchWithResourceIds({
        resourceIds: [page.id],
        siteId: String(site.id),
      })

      // Assert
      await expect(result).rejects.toThrow(
        new TRPCError({
          code: "FORBIDDEN",
          message:
            "You do not have sufficient permissions to perform this action",
        }),
      )
    })

    it("should accept requests up to MAX_BATCH_RESOURCE_IDS", async () => {
      const { site } = await setupSite()
      await setupEditorPermissions({ siteId: site.id, userId: session.userId })

      const resourceIds: string[] = []
      for (let i = 0; i < MAX_BATCH_RESOURCE_IDS; i++) {
        const { page } = await setupPageResource({
          permalink: `page-${i + 1}`,
          resourceType: "Page",
          siteId: site.id,
        })
        resourceIds.push(page.id)
      }

      // Act
      const result = await caller.searchWithResourceIds({
        resourceIds,
        siteId: String(site.id),
      })

      // Assert - route accepts input (DB returns unique rows so 1 result)
      expect(Array.isArray(result)).toBe(true)
    })

    it("should reject requests over MAX_BATCH_RESOURCE_IDS", async () => {
      // Arrange
      const { site } = await setupSite()
      await setupEditorPermissions({ siteId: site.id, userId: session.userId })

      // Act
      const result = caller.searchWithResourceIds({
        resourceIds: makeResourceIds(MAX_BATCH_RESOURCE_IDS + 1),
        siteId: String(site.id),
      })

      // Assert
      await expect(result).rejects.toMatchObject({ code: "BAD_REQUEST" })
    })

    it("should reject invalid bigint resource IDs", async () => {
      // Arrange
      const { site } = await setupSite()
      await setupEditorPermissions({
        siteId: site.id,
        userId: session.userId,
      })

      // Act
      const result = caller.searchWithResourceIds({
        resourceIds: ["01", "2"],
        siteId: String(site.id),
      })

      // Assert
      await expect(result).rejects.toMatchObject({ code: "BAD_REQUEST" })
    })

    it.skip("should throw 403 if user does not have read access to the resources", async () => {})
  })

  describe("getIndexPage", () => {
    const RESOURCE_FIELDS_TO_PICK = ["id"] as const

    it("should throw 401 if not logged in", async () => {
      // Arrange
      const unauthedSession = applySession()
      const unauthedCaller = createCaller(createMockRequest(unauthedSession))

      // Act
      const result = unauthedCaller.getIndexPage({
        parentId: "1",
        siteId: 1,
      })

      // Assert
      await expect(result).rejects.toThrow(
        new TRPCError({ code: "UNAUTHORIZED" }),
      )
    })

    it("should throw 404 if index page does not exist", async () => {
      // Arrange
      const { site, folder } = await setupFolder()
      await setupEditorPermissions({
        siteId: site.id,
        userId: session.userId,
      })

      // Act
      const result = caller.getIndexPage({
        parentId: folder.id,
        siteId: site.id,
      })

      // Assert
      await expect(result).rejects.toThrow(new TRPCError({ code: "NOT_FOUND" }))
    })

    it("should return the index page if user has read access to the site", async () => {
      // Arrange
      const { site, folder } = await setupFolder()
      const { page } = await setupPageResource({
        parentId: folder.id,
        resourceType: "IndexPage",
        siteId: site.id,
      })
      await setupEditorPermissions({
        siteId: site.id,
        userId: session.userId,
      })

      // Act
      const result = await caller.getIndexPage({
        parentId: folder.id,
        siteId: site.id,
      })

      // Assert
      const expected = {
        ...pick(page, RESOURCE_FIELDS_TO_PICK),
      }
      expect(result).toEqual(expected)
    })

    it("should throw 403 if user does not have read access to the site", async () => {
      // Arrange
      const { site, folder } = await setupFolder()
      const { page } = await setupPageResource({
        parentId: folder.id,
        resourceType: "IndexPage",
        siteId: site.id,
      })

      // Act
      const result = caller.getIndexPage({
        parentId: page.id,
        siteId: site.id,
      })

      // Assert
      await expect(result).rejects.toThrow(
        new TRPCError({
          code: "FORBIDDEN",
          message:
            "You do not have sufficient permissions to perform this action",
        }),
      )
    })
  })
})
