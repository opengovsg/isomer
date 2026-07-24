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

import { db } from "../../database"
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
      userId: session.userId,
      email: "test@mock.com",
      isDeleted: false,
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
        siteId: 1,
        resourceId: "1",
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
        userId: session.userId,
        siteId: site.id,
      })

      // Act
      const result = caller.getMetadataById({
        siteId: site.id,
        resourceId: "1",
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
        siteId: site.id,
        resourceId: page.id,
      })

      // Assert
      const expected = {
        id: page.id,
        title: page.title,
        permalink: page.permalink,
        parentId: page.parentId,
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
        siteId: site.id,
        resourceId: page.id,
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
        resourceId: "1",
        siteId: "1",
        limit: 25,
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
        resourceId: "1",
        siteId: String(site.id),
        limit: 25,
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
        siteId: String(site.id),
        resourceId: page.id,
      })

      // Assert
      await expect(result).rejects.toThrow(new TRPCError({ code: "NOT_FOUND" }))
    })

    it("should return empty items array if `cursor` is invalid", async () => {
      // Arrange
      const { site } = await setupSite()
      const { folder } = await setupFolder({
        siteId: site.id,
        parentId: null,
        permalink: "parent-folder",
        title: "Parent folder",
      })
      await setupEditorPermissions({
        siteId: site.id,
        userId: session.userId,
      })

      // Act
      const result = await caller.getFolderChildrenOf({
        siteId: String(site.id),
        resourceId: folder.id,
        cursor: 600, // does not exist
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
            siteId: site.id,
            parentId: null,
            permalink: `folder-${i}`,
            title: `Test folder ${i}`,
          })
          return pick(folder, ["title", "permalink", "type", "id"])
        }),
      )
      // Extra resources to assert that they are not returned
      await setupPageResource({
        siteId: site.id,
        resourceType: "Page",
      })
      await setupPageResource({
        siteId: site.id,
        parentId: rootLevelFolders[3]!.id,
        resourceType: "Page",
      })
      await setupEditorPermissions({
        siteId: site.id,
        userId: session.userId,
      })

      // Act
      const result = caller.getFolderChildrenOf({
        siteId: String(site.id),
        resourceId: null,
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
        siteId: site.id,
        parentId: null,
        permalink: "parent-folder",
        title: "Parent folder",
      })
      const childFolders = await Promise.all(
        Array.from({ length: 30 }, (_, i) => i).map(async (i) => {
          const { folder } = await setupFolder({
            siteId: site.id,
            parentId: parentFolder.id,
            permalink: `child-folder-${i}`,
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
        siteId: String(site.id),
        resourceId: parentFolder.id,
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
        siteId: site.id,
        parentId: null,
        permalink: "parent-folder",
        title: "Parent folder",
      })
      const childFolders = await Promise.all(
        Array.from({ length: 30 }, (_, i) => i).map(async (i) => {
          const { folder } = await setupFolder({
            siteId: site.id,
            parentId: parentFolder.id,
            permalink: `child-folder-${i}`,
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
        siteId: String(site.id),
        resourceId: parentFolder.id,
        limit: setLimit,
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
        siteId: site.id,
        parentId: null,
        permalink: "parent-folder",
        title: "Parent folder",
      })
      const childFolders = await Promise.all(
        Array.from({ length: 30 }, (_, i) => i).map(async (i) => {
          const { folder } = await setupFolder({
            siteId: site.id,
            parentId: parentFolder.id,
            permalink: `child-folder-${i}`,
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
        siteId: String(site.id),
        resourceId: parentFolder.id,
        limit: nextLimit,
        cursor,
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
        siteId: site.id,
        parentId: null,
        permalink: "parent-folder",
        title: "Parent folder",
      })
      const childFolders = await Promise.all(
        Array.from({ length: numberOfItems }, (_, i) => i).map(async (i) => {
          const { folder } = await setupFolder({
            siteId: site.id,
            parentId: parentFolder.id,
            permalink: `child-folder-${i}`,
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
        siteId: String(site.id),
        resourceId: parentFolder.id,
        limit: setLimit,
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
        siteId: String(site.id),
        resourceId: null,
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
        resourceId: "1",
        siteId: "1",
        limit: 25,
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
        resourceId: "1",
        siteId: String(site.id),
        limit: 25,
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
        siteId: String(site.id),
        resourceId: page.id,
      })

      // Assert
      await expect(result).rejects.toThrow(new TRPCError({ code: "NOT_FOUND" }))
    })

    it("should not return RootPage as its own children", async () => {
      // Arrange
      const { site } = await setupSite()
      // Create a root page
      await setupPageResource({
        siteId: site.id,
        resourceType: "RootPage",
        title: "___Root page, should not be returned",
      })
      // Create first-level pages
      const childPages = await Promise.all(
        Array.from({ length: 3 }, (_, i) => i).map(async (i) => {
          const { page } = await setupPageResource({
            siteId: site.id,
            permalink: `child-page-${i}`,
            title: `Child page ${i}`,
            resourceType: "Page",
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
        siteId: String(site.id),
        resourceId: null,
      })

      // Assert
      const expected = {
        // should not have rootPage returned
        items: childPages.sort((a, b) => a.title.localeCompare(b.title)),
        nextOffset: null,
      }
      expect(result).toMatchObject(expected)
    })

    it("should not return FolderMeta, CollectionMeta, and CollectionLink as children", async () => {
      // Arrange
      const { site } = await setupSite()
      // Create a folder
      const { folder } = await setupFolder({
        siteId: site.id,
        parentId: null,
        permalink: "parent-folder",
        title: "Parent folder",
      })
      const { collection } = await setupCollection({
        siteId: site.id,
      })
      // Create FolderMeta, CollectionMeta, and CollectionLink
      await setupFolderMeta({
        siteId: site.id,
        folderId: folder.id,
      })
      await setupCollectionMeta({
        siteId: site.id,
        collectionId: collection.id,
      })
      await setupCollectionLink({
        siteId: site.id,
        collectionId: collection.id,
        title: "Collection Link",
      })
      // Create children pages of folder
      const childPages = await Promise.all(
        Array.from({ length: 3 }, (_, i) => i).map(async (i) => {
          const { page } = await setupPageResource({
            siteId: site.id,
            permalink: `child-page-${i}`,
            title: `Child page ${i}`,
            resourceType: "Page",
            parentId: folder.id,
          })
          return pick(page, ["title", "permalink", "type", "id"])
        }),
      )
      // Create children pages of collection
      const childCollectionPages = await Promise.all(
        Array.from({ length: 3 }, (_, i) => i).map(async (i) => {
          const { page } = await setupPageResource({
            siteId: site.id,
            permalink: `collection-child-page-${i}`,
            title: `Collection Child page ${i}`,
            resourceType: "Page",
            parentId: collection.id,
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
        siteId: String(site.id),
        resourceId: folder.id,
      })
      const resultCollection = await caller.getChildrenOf({
        siteId: String(site.id),
        resourceId: collection.id,
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
        siteId: site.id,
        parentId: null,
        permalink: "parent-folder",
        title: "Parent folder",
      })
      await setupEditorPermissions({
        siteId: site.id,
        userId: session.userId,
      })

      // Act
      const result = await caller.getChildrenOf({
        siteId: String(site.id),
        resourceId: folder.id,
        cursor: 600, // does not exist
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
            siteId: site.id,
            parentId: null,
            permalink: `folder-${i}`,
            title: `Test folder ${i}`,
          })
          return pick(folder, ["title", "permalink", "type", "id"])
        }),
      )
      // Extra root-level resources to assert that they are also returned
      const { page: rootLevelPage } = await setupPageResource({
        siteId: site.id,
        title: "__this should be returned",
        resourceType: "Page",
      })

      // Extra nested resources to assert these are not returned
      await setupPageResource({
        siteId: site.id,
        title: "__this should not return",
        parentId: rootLevelFolders[3]!.id,
        resourceType: "Page",
      })
      await setupEditorPermissions({
        siteId: site.id,
        userId: session.userId,
      })

      // Act
      const result = await caller.getChildrenOf({
        siteId: String(site.id),
        resourceId: null,
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
        siteId: site.id,
        parentId: null,
        permalink: "parent-folder",
        title: "Parent folder",
      })
      const childFolders = await Promise.all(
        Array.from({ length: 30 }, (_, i) => i).map(async (i) => {
          const { folder } = await setupFolder({
            siteId: site.id,
            parentId: parentFolder.id,
            permalink: `child-folder-${i}`,
            title: `Child folder ${i}`,
          })
          return pick(folder, ["title", "permalink", "type", "id"])
        }),
      )
      const childPages = await Promise.all(
        Array.from({ length: 2 }, (_, i) => i).map(async (i) => {
          const { page } = await setupPageResource({
            siteId: site.id,
            parentId: parentFolder.id,
            permalink: `child-page-${i}`,
            title: `__should be returned Child page ${i}`,
            resourceType: "Page",
          })
          return pick(page, ["title", "permalink", "type", "id"])
        }),
      )
      // Extra folders to assert that they are not returned
      await Promise.all(
        Array.from({ length: 3 }, (_, i) => i).map(async (i) => {
          const { folder } = await setupFolder({
            siteId: site.id,
            parentId: null,
            permalink: `root-folder-${i}`,
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
        siteId: String(site.id),
        resourceId: parentFolder.id,
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
        siteId: site.id,
        parentId: null,
        permalink: "parent-folder",
        title: "Parent folder",
      })
      const childFolders = await Promise.all(
        Array.from({ length: 30 }, (_, i) => i).map(async (i) => {
          const { folder } = await setupFolder({
            siteId: site.id,
            parentId: parentFolder.id,
            permalink: `child-folder-${i}`,
            title: `Child folder ${i}`,
          })
          return pick(folder, ["title", "permalink", "type", "id"])
        }),
      )
      const childPages = await Promise.all(
        Array.from({ length: 5 }, (_, i) => i).map(async (i) => {
          const { page } = await setupPageResource({
            siteId: site.id,
            parentId: parentFolder.id,
            permalink: `child-page-${i}`,
            title: `__underscore to return first and should be returned page ${i}`,
            resourceType: "Page",
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
        siteId: String(site.id),
        resourceId: parentFolder.id,
        limit: setLimit,
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
        siteId: site.id,
        parentId: null,
        permalink: "parent-folder",
        title: "Parent folder",
      })
      const childFolders = await Promise.all(
        Array.from({ length: 30 }, (_, i) => i).map(async (i) => {
          const { folder } = await setupFolder({
            siteId: site.id,
            parentId: parentFolder.id,
            permalink: `child-folder-${i}`,
            title: `Child folder ${i}`,
          })
          return pick(folder, ["title", "permalink", "type", "id"])
        }),
      )
      const childPages = await Promise.all(
        Array.from({ length: 5 }, (_, i) => i).map(async (i) => {
          const { page } = await setupPageResource({
            siteId: site.id,
            parentId: parentFolder.id,
            permalink: `child-page-${i}`,
            title: `__underscore to return first and should be returned page ${i}`,
            resourceType: "Page",
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
        siteId: String(site.id),
        resourceId: parentFolder.id,
        limit: nextLimit,
        cursor,
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
        siteId: site.id,
        parentId: null,
        permalink: "parent-folder",
        title: "Parent folder",
      })
      const childFolders = await Promise.all(
        Array.from({ length: numberOfFolders }, (_, i) => i).map(async (i) => {
          const { folder } = await setupFolder({
            siteId: site.id,
            parentId: parentFolder.id,
            permalink: `child-folder-${i}`,
            title: `Child folder ${i}`,
          })
          return pick(folder, ["title", "permalink", "type", "id"])
        }),
      )
      const childPages = await Promise.all(
        Array.from({ length: numberOfPages }, (_, i) => i).map(async (i) => {
          const { page } = await setupPageResource({
            siteId: site.id,
            parentId: parentFolder.id,
            permalink: `child-page-${i}`,
            title: `__underscore to return first and should be returned page ${i}`,
            resourceType: "Page",
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
        siteId: String(site.id),
        resourceId: parentFolder.id,
        limit: setLimit,
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
        siteId: String(site.id),
        resourceId: null,
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
        userId: session.userId,
        siteId: site.id,
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
        userId: session.userId,
        siteId: site.id,
      })
      const { page } = await setupPageResource({
        siteId: site.id,
        resourceType: "Page",
      })

      // Act
      const result = caller.getNestedFolderChildrenOf({
        siteId: String(site.id),
        resourceId: page.id,
      })

      // Assert
      await expect(result).rejects.toThrow(new TRPCError({ code: "NOT_FOUND" }))
    })

    it("should throw 403 if user does not have read access to site", async () => {
      // Arrange
      const { site, folder } = await setupFolder()

      // Act
      const result = caller.getNestedFolderChildrenOf({
        siteId: String(site.id),
        resourceId: folder.id,
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
        userId: session.userId,
        siteId: site.id,
      })
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
      const { folder: grandChildFolder } = await setupFolder({
        siteId: site.id,
        parentId: childFolder.id,
        permalink: "grand-child-folder",
        title: "Grand child folder",
      })
      const { folder: grandChildFolder2 } = await setupFolder({
        siteId: site.id,
        parentId: childFolder.id,
        permalink: "grand-child-folder-2",
        title: "Grand child folder 2",
      })

      // Act
      const result = await caller.getNestedFolderChildrenOf({
        siteId: String(site.id),
        resourceId: parentFolder.id,
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
        userId: session.userId,
        siteId: site.id,
      })
      const { folder: folderA } = await setupFolder({
        siteId: site.id,
        parentId: null,
        permalink: "cyclic-a",
      })
      const { folder: folderB } = await setupFolder({
        siteId: site.id,
        parentId: folderA.id,
        permalink: "cyclic-b",
      })
      const { folder: folderC } = await setupFolder({
        siteId: site.id,
        parentId: folderB.id,
        permalink: "cyclic-c",
      })

      // Seed legacy corruption: A <-> B cycle.
      await db
        .updateTable("Resource")
        .where("id", "=", folderA.id)
        .set({ parentId: folderB.id })
        .execute()

      // Act
      const result = await caller.getNestedFolderChildrenOf({
        siteId: String(site.id),
        resourceId: folderA.id,
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
        siteId: site.id,
        movedResourceId: "1",
        destinationResourceId: "1",
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
        userId: session.userId,
        siteId: site.id,
      })
      const auditSpy = vitest.spyOn(auditService, "logResourceEvent")

      // Act
      const result = caller.move({
        siteId: site.id,
        movedResourceId: "99999", // should not exist
        destinationResourceId: folder.id,
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
        userId: session.userId,
        siteId: site.id,
      })
      const auditSpy = vitest.spyOn(auditService, "logResourceEvent")

      // Act
      const result = caller.move({
        siteId: site.id,
        movedResourceId: folder.id,
        destinationResourceId: "99999", // should not exist
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
        resourceType: "Page",
        siteId: site.id,
        permalink: "another-page",
      })
      await setupAdminPermissions({
        userId: session.userId,
        siteId: site.id,
      })
      const auditSpy = vitest.spyOn(auditService, "logResourceEvent")

      // Act
      const result = caller.move({
        siteId: site.id,
        movedResourceId: pageToMove.id,
        destinationResourceId: anotherPage.id,
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
        resourceType: "Page",
        siteId: site.id,
        parentId: originFolder.id,
      })
      const auditSpy = vitest.spyOn(auditService, "logResourceEvent")
      await setupAdminPermissions({
        userId: session.userId,
        siteId: pageToMove.siteId,
      })

      // Act
      const result = caller.move({
        siteId: pageToMove.siteId,
        movedResourceId: pageToMove.id,
        destinationResourceId: pageToMove.parentId,
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

    it("should identify a collection when the destination is the same as the origin", async () => {
      // Arrange
      const { collection, site } = await setupCollection({
        permalink: "collection",
      })
      const { page } = await setupCollectionPage({
        siteId: site.id,
        parentId: collection.id,
      })
      const auditSpy = vitest.spyOn(auditService, "logResourceEvent")
      await setupAdminPermissions({
        userId: session.userId,
        siteId: site.id,
      })

      // Act
      const result = caller.move({
        siteId: site.id,
        movedResourceId: page.id,
        destinationResourceId: collection.id,
      })

      // Assert
      expect(auditSpy).not.toHaveBeenCalled()
      await expect(result).rejects.toThrow(
        new TRPCError({
          code: "BAD_REQUEST",
          message: "You cannot move a resource to the same collection",
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
        resourceType: "Page",
        siteId: site.id,
        parentId: originFolder.id,
      })
      await setupEditorPermissions({
        userId: session.userId,
        siteId: site.id,
      })

      // Act
      const result = caller.move({
        siteId: site.id,
        movedResourceId: pageToMove.id,
        destinationResourceId: null,
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
        resourceType: "Page",
        permalink: "search",
        parentId: null,
      })
      const { folder: destinationFolder } = await setupFolder({
        siteId: site.id,
        permalink: "destination-folder",
      })
      const auditSpy = vitest.spyOn(auditService, "logResourceEvent")
      await setupAdminPermissions({
        userId: session.userId,
        siteId: site.id,
      })

      // Act
      const result = caller.move({
        siteId: site.id,
        movedResourceId: searchPage.id,
        destinationResourceId: destinationFolder.id,
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

    it("should return 403 if source and destination resources belong to different sites", async () => {
      // Arrange
      const auditSpy = vitest.spyOn(auditService, "logResourceEvent")
      const { page: originPage, site: originSite } = await setupPageResource({
        resourceType: "Page",
      })
      const { folder: destinationFolder, site: destinationSite } =
        await setupFolder()
      expect(originSite.id).not.toEqual(destinationSite.id)
      await setupAdminPermissions({
        userId: session.userId,
        siteId: originSite.id,
      })

      // Act
      const result = caller.move({
        siteId: originSite.id,
        movedResourceId: originPage.id,
        destinationResourceId: destinationFolder.id,
      })

      // Assert
      expect(auditSpy).not.toHaveBeenCalled()
      await expect(result).rejects.toThrow(
        new TRPCError({
          code: "FORBIDDEN",
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
        resourceType: "Page",
        siteId: site.id,
        parentId: originFolder.id,
      })
      await setupAdminPermissions({
        userId: session.userId,
        siteId: site.id,
      })

      // Act
      const result = await caller.move({
        siteId: site.id,
        movedResourceId: pageToMove.id,
        destinationResourceId: null,
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
        resourceType: "Page",
        siteId: site.id,
        parentId: originFolder.id,
      })
      const { folder: destinationFolder } = await setupFolder({
        siteId: site.id,
        permalink: "destination-folder",
      })
      await setupAdminPermissions({
        userId: session.userId,
        siteId: site.id,
      })

      // Act
      const result = await caller.move({
        siteId: site.id,
        movedResourceId: pageToMove.id,
        destinationResourceId: destinationFolder.id,
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
        resourceType: "Page",
        parentId: null,
      })
      const { folder: destinationFolder } = await setupFolder({
        siteId: site.id,
        permalink: "destination-folder",
      })
      await setupAdminPermissions({
        userId: session.userId,
        siteId: site.id,
      })

      // Act
      const result = await caller.move({
        siteId: site.id,
        movedResourceId: pageToMove.id,
        destinationResourceId: destinationFolder.id,
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
        siteId: site.id,
        permalink: "child-folder",
        parentId: parentFolder.id,
      })
      await setupAdminPermissions({
        userId: session.userId,
        siteId: site.id,
      })

      // Act - try to move parent folder into its child (would create A -> B -> A cycle)
      const result = caller.move({
        siteId: site.id,
        movedResourceId: parentFolder.id,
        destinationResourceId: childFolder.id,
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
        siteId: site.id,
        permalink: "parent-folder",
        parentId: grandparentFolder.id,
      })
      const { folder: childFolder } = await setupFolder({
        siteId: site.id,
        permalink: "child-folder",
        parentId: parentFolder.id,
      })
      const { folder: grandchildFolder } = await setupFolder({
        siteId: site.id,
        permalink: "grandchild-folder",
        parentId: childFolder.id,
      })
      await setupAdminPermissions({
        userId: session.userId,
        siteId: site.id,
      })

      // Act - try to move grandparent folder into its grandchild (would create cycle)
      const result = caller.move({
        siteId: site.id,
        movedResourceId: grandparentFolder.id,
        destinationResourceId: grandchildFolder.id,
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
        siteId: site.id,
        permalink: "cyclic-folder-b",
        parentId: folderA.id,
      })
      const { folder: folderC } = await setupFolder({
        siteId: site.id,
        permalink: "cyclic-folder-c",
        parentId: folderB.id,
      })
      await setupAdminPermissions({
        userId: session.userId,
        siteId: site.id,
      })

      // Seed legacy corruption: A -> B and B -> A cycle.
      await db
        .updateTable("Resource")
        .where("id", "=", folderA.id)
        .set({ parentId: folderB.id })
        .execute()

      // Act
      const result = caller.move({
        siteId: site.id,
        movedResourceId: folderA.id,
        destinationResourceId: folderC.id,
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
        siteId: site.id,
        permalink: "folder-b",
      })
      await setupAdminPermissions({
        userId: session.userId,
        siteId: site.id,
      })

      // Act - move folder A into folder B (siblings, not descendants)
      const result = await caller.move({
        siteId: site.id,
        movedResourceId: folderA.id,
        destinationResourceId: folderB.id,
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
        siteId: site.id,
        permalink: "child-folder",
        parentId: rootPage.id,
      })
      await setupAdminPermissions({
        userId: session.userId,
        siteId: site.id,
      })

      // Act - try to move RootPage into its child folder (would create cycle)
      const result = caller.move({
        siteId: site.id,
        movedResourceId: rootPage.id,
        destinationResourceId: folder.id,
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
        siteId: site.id,
        permalink: "destination-folder",
      })
      await setupAdminPermissions({
        userId: session.userId,
        siteId: site.id,
      })

      // Act
      const result = await caller.move({
        siteId: site.id,
        movedResourceId: collection.id,
        destinationResourceId: destinationFolder.id,
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
        siteId: site.id,
        permalink: "destination-collection",
      })
      await setupAdminPermissions({
        userId: session.userId,
        siteId: site.id,
      })

      // Act
      const result = caller.move({
        siteId: site.id,
        movedResourceId: collectionToMove.id,
        destinationResourceId: destinationCollection.id,
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
          resourceType: ResourceType.RootPage,
          parentId: null,
        })
        const { folder } = await setupFolder({
          siteId: site.id,
          permalink: "dest",
        })
        await setupAdminPermissions({ userId: session.userId, siteId: site.id })
        return { site, rootPage, folder }
      }

      const liveRedirects = (siteId: number) =>
        db
          .selectFrom("Redirect")
          .selectAll()
          .where("siteId", "=", siteId)
          .where("deletedAt", "is", null)
          .execute()

      it("creates a redirect from the old URL for a published page", async () => {
        const { site, rootPage, folder } = await setup()
        const { page } = await setupPageResource({
          siteId: site.id,
          resourceType: ResourceType.Page,
          parentId: rootPage.id,
          permalink: "old-page",
          state: ResourceState.Published,
          userId: session.userId,
        })

        await caller.move({
          siteId: site.id,
          movedResourceId: page.id,
          destinationResourceId: folder.id,
          shouldCreateRedirect: true,
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
          siteId: site.id,
          resourceType: ResourceType.Page,
          parentId: rootPage.id,
          permalink: "old-page",
          state: ResourceState.Published,
          userId: session.userId,
        })

        await caller.move({
          siteId: site.id,
          movedResourceId: page.id,
          destinationResourceId: folder.id,
          shouldCreateRedirect: false,
        })

        expect(await liveRedirects(site.id)).toHaveLength(0)
      })

      it("does not create a redirect for an unpublished page", async () => {
        const { site, rootPage, folder } = await setup()
        const { page } = await setupPageResource({
          siteId: site.id,
          resourceType: ResourceType.Page,
          parentId: rootPage.id,
          permalink: "old-page",
          state: ResourceState.Draft,
        })

        await caller.move({
          siteId: site.id,
          movedResourceId: page.id,
          destinationResourceId: folder.id,
          shouldCreateRedirect: true,
        })

        expect(await liveRedirects(site.id)).toHaveLength(0)
      })

      it("soft-deletes a redirect pointing back at the page when it reclaims that URL", async () => {
        const { site, rootPage, folder } = await setup()
        const { page } = await setupPageResource({
          siteId: site.id,
          resourceType: ResourceType.Page,
          parentId: rootPage.id,
          permalink: "old-page",
          state: ResourceState.Published,
          userId: session.userId,
        })
        // A redirect at the path the page is about to occupy, pointing at it.
        await db
          .insertInto("Redirect")
          .values({
            siteId: site.id,
            source: "/dest/old-page",
            destination: `[resource:${site.id}:${page.id}]`,
          })
          .execute()

        await caller.move({
          siteId: site.id,
          movedResourceId: page.id,
          destinationResourceId: folder.id,
          shouldCreateRedirect: false,
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
          siteId: site.id,
          resourceType: ResourceType.Page,
          parentId: rootPage.id,
          permalink: "old-page",
          state: ResourceState.Published,
          userId: session.userId,
        })
        // A live redirect already occupies the destination URL, pointing
        // elsewhere — moving the page there would shadow it.
        await db
          .insertInto("Redirect")
          .values({
            siteId: site.id,
            source: "/dest/old-page",
            destination: "https://example.gov.sg/elsewhere",
          })
          .execute()

        const result = caller.move({
          siteId: site.id,
          movedResourceId: page.id,
          destinationResourceId: folder.id,
          shouldCreateRedirect: false,
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
          siteId: site.id,
          resourceType: ResourceType.Page,
          parentId: rootPage.id,
          permalink: "old-page",
          state: ResourceState.Draft,
        })
        await db
          .insertInto("Redirect")
          .values({
            siteId: site.id,
            source: "/dest/old-page",
            destination: "https://example.gov.sg/elsewhere",
          })
          .execute()

        // No live shadow yet (the page isn't published); the eventual publish is
        // guarded separately, so the move is allowed.
        await expect(
          caller.move({
            siteId: site.id,
            movedResourceId: page.id,
            destinationResourceId: folder.id,
            shouldCreateRedirect: true,
          }),
        ).resolves.toMatchObject({ id: page.id })
      })

      it("creates a redirect from the old URL for a published CollectionPage", async () => {
        // Locks in the CollectionPage branch of the redirect orchestration.
        const { site, collection: srcCollection } = await setupCollection({
          permalink: "src-collection",
        })
        await setupAdminPermissions({ userId: session.userId, siteId: site.id })
        const { collection: destCollection } = await setupCollection({
          siteId: site.id,
          permalink: "dest-collection",
        })
        const { page } = await setupCollectionPage({
          siteId: site.id,
          parentId: srcCollection.id,
          permalink: "old-article",
          state: ResourceState.Published,
          userId: session.userId,
        })

        await caller.move({
          siteId: site.id,
          movedResourceId: page.id,
          destinationResourceId: destCollection.id,
          shouldCreateRedirect: true,
        })

        const redirects = await liveRedirects(site.id)
        expect(redirects).toHaveLength(1)
        expect(redirects[0]!.source).toBe("/src-collection/old-article")
        expect(redirects[0]!.destination).toBe(
          `[resource:${site.id}:${page.id}]`,
        )
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
        resourceId: 99999, // should not exist
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
        resourceId: 99999, // should not exist
        siteId: 99999, // should not exist also
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
        siteId: site.id,
        resourceType: "RootPage",
      })
      const numberOfPages = 3
      const numberOfFolders = 2
      await Promise.all(
        Array.from({ length: numberOfPages }, (_, i) => i).map(async (i) => {
          await setupPageResource({
            siteId: site.id,
            permalink: `page-${i}`,
            title: `Test page ${i}`,
            resourceType: "Page",
          })
        }),
      )
      const folders = await Promise.all(
        Array.from({ length: numberOfFolders }, (_, i) => i).map(async (i) => {
          const { folder } = await setupFolder({
            siteId: site.id,
            permalink: `folder-${i}`,
            title: `Test folder ${i}`,
          })
          return folder.id
        }),
      )
      // Add more extra nested pages in folder, should not be returned in the count
      await Promise.all(
        Array.from({ length: 10 }, (_, i) => i).map(async (i) => {
          await setupPageResource({
            siteId: site.id,
            parentId: folders[1],
            resourceType: "Page",
            permalink: `nested-page-${i}`,
            title: `Nested page ${i}`,
          })
        }),
      )
      await setupEditorPermissions({
        userId: session.userId,
        siteId: site.id,
      })

      // Act
      const result = await caller.countWithoutRoot({
        siteId: site.id,
      })

      // Assert
      expect(result).toEqual(numberOfPages + numberOfFolders)
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
            siteId: site.id,
            parentId: folderToUse.id,
            permalink: `page-${i}`,
            title: `Test page ${i}`,
            resourceType: "Page",
          })
        }),
      )
      // Folders inside the folder
      const nestedFolders = await Promise.all(
        Array.from({ length: numberOfFolders }, (_, i) => i).map(async (i) => {
          const { folder } = await setupFolder({
            siteId: site.id,
            parentId: folderToUse.id,
            permalink: `folder-${i}`,
            title: `Test folder ${i}`,
          })
          return folder.id
        }),
      )
      // Add more extra nested pages in one of the nested folders, should not be returned in the count
      await Promise.all(
        Array.from({ length: 10 }, (_, i) => i).map(async (i) => {
          await setupPageResource({
            siteId: site.id,
            parentId: nestedFolders[1],
            resourceType: "Page",
            permalink: `nested-page-${i}`,
            title: `Nested page ${i}`,
          })
        }),
      )
      await setupEditorPermissions({
        userId: session.userId,
        siteId: site.id,
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
        siteId: 1,
        limit: 25,
      })

      // Assert
      await expect(result).rejects.toThrow(
        new TRPCError({ code: "UNAUTHORIZED" }),
      )
    })

    it("should return 403 if site does not exist", async () => {
      // Act
      const result = caller.listWithoutRoot({
        siteId: 99999, // should not exist
        limit: 25,
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
        siteId: site.id,
        limit: 25,
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
        siteId: site.id,
        limit: 25,
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
        siteId: site.id,
        resourceId: 99999, // should not exist
        limit: 25,
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
        siteId: site.id,
        resourceId: Number(page.id),
        limit: 25,
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
        siteId: site.id,
        resourceId: Number(folder.id),
        limit: 25,
      })

      // Assert
      expect(result).toEqual([])
    })

    it("should return resources (respecting the limit) excluding root page if resourceId is not provided", async () => {
      // Arrange
      const { site } = await setupSite()
      // Create root page, should not be returned in the count
      await setupPageResource({
        siteId: site.id,
        resourceType: "RootPage",
      })
      const numberOfPages = 30
      const numberOfFolders = 2
      const pages = await Promise.all(
        Array.from({ length: numberOfPages }, (_, i) => i).map(async (i) => {
          const { page } = await setupPageResource({
            siteId: site.id,
            permalink: `page-${i}`,
            title: `Test page ${i}`,
            resourceType: "Page",
          })
          return pick(page, RESOURCE_FIELDS_TO_PICK)
        }),
      )
      const folders = await Promise.all(
        Array.from({ length: numberOfFolders }, (_, i) => i).map(async (i) => {
          const { folder } = await setupFolder({
            siteId: site.id,
            permalink: `folder-${i}`,
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
            siteId: site.id,
            parentId: folderToUse.id,
            permalink: `page-${i}`,
            title: `Test page ${i}`,
            resourceType: "Page",
          })
          return pick(page, RESOURCE_FIELDS_TO_PICK)
        }),
      )
      // Folders inside the folder
      const folders = await Promise.all(
        Array.from({ length: numberOfFolders }, (_, i) => i).map(async (i) => {
          const { folder } = await setupFolder({
            siteId: site.id,
            parentId: folderToUse.id,
            permalink: `folder-${i}`,
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
        permalinks.map((permalink) =>
          setupPageResource({
            siteId: site.id,
            resourceType: "Page",
            title: sharedTitle,
            permalink,
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
        siteId: site.id,
        limit: 2,
        offset: 0,
      })
      const page1Second = await caller.listWithoutRoot({
        siteId: site.id,
        limit: 2,
        offset: 0,
      })
      const page2Result = await caller.listWithoutRoot({
        siteId: site.id,
        limit: 2,
        offset: 2,
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
        siteId: site.id,
        resourceType: "Page",
        title: "cherry",
        permalink: "cherry",
      })
      await setupPageResource({
        siteId: site.id,
        resourceType: "Page",
        title: "apple",
        permalink: "apple",
      })
      await setupPageResource({
        siteId: site.id,
        resourceType: "Page",
        title: "Banana",
        permalink: "banana",
      })

      // Act
      const result = await caller.listWithoutRoot({
        siteId: site.id,
        orderBy: "title-asc",
      })

      // Assert
      expect(result.map((r) => r.title)).toEqual(["apple", "Banana", "cherry"])
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
        userId: session.userId,
        siteId: site.id,
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
        userId: session.userId,
        siteId: site.id,
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
      await setupAdminPermissions({ userId: session.userId, siteId: site.id })
      const redirect = await db
        .insertInto("Redirect")
        .values({
          siteId: site.id,
          source: "/old",
          destination: `[resource:${site.id}:${page.id}]`,
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
      await setupAdminPermissions({ userId: session.userId, siteId: site.id })
      const { page } = await setupPageResource({
        siteId: site.id,
        parentId: folder.id,
        permalink: "leaf",
        resourceType: "Page",
      })
      const redirect = await db
        .insertInto("Redirect")
        .values({
          siteId: site.id,
          source: "/old",
          destination: `[resource:${site.id}:${page.id}]`,
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
      await setupAdminPermissions({ userId: session.userId, siteId: site.id })
      const { page: other } = await setupPageResource({
        siteId: site.id,
        permalink: "other",
        resourceType: "Page",
      })
      const redirect = await db
        .insertInto("Redirect")
        .values({
          siteId: site.id,
          source: "/old",
          destination: `[resource:${site.id}:${other.id}]`,
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
        userId: session.userId,
        siteId: site.id,
      })
      const nestedPages = await Promise.all(
        Array.from({ length: 3 }, (_, i) => i).map(async (i) => {
          const { page } = await setupPageResource({
            siteId: site.id,
            parentId: folderToUse.id,
            permalink: `page-${i}`,
            title: `Test page ${i}`,
            resourceType: "Page",
          })
          return page.id
        }),
      )
      const nestedFolders = await Promise.all(
        Array.from({ length: 2 }, (_, i) => i).map(async (i) => {
          const { folder } = await setupFolder({
            siteId: site.id,
            parentId: folderToUse.id,
            permalink: `folder-${i}`,
            title: `Test folder ${i}`,
          })
          return folder.id
        }),
      )
      // Nested in nested
      const nestedInNested = await Promise.all(
        Array.from({ length: 3 }, (_, i) => i).map(async (i) => {
          const { page } = await setupPageResource({
            siteId: site.id,
            parentId: nestedFolders[1],
            resourceType: "Page",
            permalink: `nested-page-${i}`,
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
        userId: session.userId,
        siteId: site.id,
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
        resourceType: "Page",
        permalink: "search",
        parentId: null,
      })
      const auditSpy = vitest.spyOn(auditService, "logResourceEvent")
      await setupAdminPermissions({
        userId: session.userId,
        siteId: site.id,
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
        userId: session.userId,
        siteId: site.id,
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
        userId: session.userId,
        siteId: site.id,
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
        userId: session.userId,
        siteId: site.id,
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
        siteId: site.id,
        parentId: parentFolder.id,
        resourceType: "Page",
      })
      await setupEditorPermissions({
        userId: session.userId,
        siteId: site.id,
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
        userId: session.userId,
        siteId: site.id,
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
        siteId: 1,
        resourceId: "1",
      })

      // Assert
      await expect(result).rejects.toThrow(
        new TRPCError({ code: "UNAUTHORIZED" }),
      )
    })

    it("should return 404 if resource does not exist", async () => {
      // Act
      const result = caller.getWithFullPermalink({
        siteId: 1,
        resourceId: "99999",
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
        userId: session.userId,
        siteId: site.id,
      })

      // Act
      const result = await caller.getWithFullPermalink({
        siteId: site.id,
        resourceId: page.id,
      })

      // Assert
      const expected = {
        ...pick(page, ["id", "title"]),
        fullPermalink: `${page.permalink}`,
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
        siteId: site.id,
        parentId: parentFolder.id,
        permalink: "nested-folder",
        title: "Nested folder",
      })
      const { page: nestedPage } = await setupPageResource({
        siteId: site.id,
        parentId: nestedFolder.id,
        resourceType: "Page",
      })
      await setupEditorPermissions({
        userId: session.userId,
        siteId: site.id,
      })

      // Act
      const result = await caller.getWithFullPermalink({
        siteId: site.id,
        resourceId: nestedPage.id,
      })

      // Assert
      expect(result).toMatchObject({
        id: nestedPage.id,
        title: nestedPage.title,
        fullPermalink: `${parentFolder.permalink}/${nestedFolder.permalink}/${nestedPage.permalink}`,
      })
    })

    it("should throw 403 if user does not have read access to the site", async () => {
      // Arrange
      const { site, page } = await setupPageResource({
        resourceType: "Page",
      })

      // Act
      const result = caller.getWithFullPermalink({
        siteId: site.id,
        resourceId: page.id,
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
        userId: session.userId,
        siteId: site.id,
      })

      // Act
      const result = caller.getAncestryStack({
        siteId: String(site.id),
        resourceId: "99999",
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
        userId: session.userId,
        siteId: site.id,
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
        userId: session.userId,
        siteId: site.id,
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
        siteId: site.id,
        permalink: "parent-folder",
        title: "Parent folder",
      })
      const { folder: nestedFolder } = await setupFolder({
        siteId: site.id,
        parentId: parentFolder.id,
        permalink: "nested-folder",
        title: "Nested folder",
      })
      const { page: nestedPage } = await setupPageResource({
        siteId: site.id,
        parentId: nestedFolder.id,
        resourceType: "Page",
      })
      await setupEditorPermissions({
        userId: session.userId,
        siteId: site.id,
      })

      // Act
      const result = await caller.getAncestryStack({
        resourceId: nestedPage.id,
        siteId: String(site.id),
        includeSelf: true,
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
        userId: session.userId,
        siteId: site.id,
      })

      // Act
      const result = await caller.getAncestryStack({
        resourceId: page.id,
        siteId: String(site.id),
        includeSelf: true,
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
        siteId: site.id,
        parentId: parentFolder.id,
        permalink: "nested-folder",
        title: "Nested folder",
      })
      const { page: nestedPage } = await setupPageResource({
        siteId: site.id,
        parentId: nestedFolder.id,
        resourceType: "Page",
      })
      await setupEditorPermissions({
        userId: session.userId,
        siteId: site.id,
      })

      // Act
      const result = await caller.getAncestryStack({
        resourceId: nestedPage.id,
        siteId: String(site.id),
        includeSelf: false,
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
        resourceId: page.id,
        siteId: String(site.id),
        includeSelf: true,
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
        siteId: site.id,
        parentId: parentFolder.id,
        permalink: "nested-folder",
        title: "Nested folder",
      })
      const { page: nestedPage } = await setupPageResource({
        siteId: site.id,
        parentId: nestedFolder.id,
        resourceType: "Page",
      })
      await setupEditorPermissions({
        userId: session.userId,
        siteId: site.id,
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
      await setupEditorPermissions({ userId: session.userId, siteId: site.id })

      const resourceIds: string[] = []
      for (let i = 0; i < MAX_BATCH_RESOURCE_IDS; i++) {
        const { page } = await setupPageResource({
          siteId: site.id,
          resourceType: "Page",
          permalink: `page-${i + 1}`,
        })
        resourceIds.push(page.id)
      }

      // Act
      const result = await caller.getBatchAncestryWithSelf({
        siteId: String(site.id),
        resourceIds,
      })

      // Assert
      expect(result).toHaveLength(MAX_BATCH_RESOURCE_IDS)
    })

    it("should reject requests over MAX_BATCH_RESOURCE_IDS", async () => {
      // Arrange
      const { site } = await setupSite()
      await setupEditorPermissions({ userId: session.userId, siteId: site.id })

      // Act
      const result = caller.getBatchAncestryWithSelf({
        siteId: String(site.id),
        resourceIds: makeResourceIds(MAX_BATCH_RESOURCE_IDS + 1),
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
        siteId: "1",
        query: "test",
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
        siteId: String(site.id),
        query: "test",
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
        userId: session.userId,
        siteId: site.id,
      })

      // Act
      const result = await caller.search({
        siteId: String(site.id),
        query: "test",
      })

      // Assert
      const expected = {
        totalCount: 0,
        resources: [],
        recentlyEdited: [],
        nextOffset: null,
      }
      expect(result).toEqual(expected)
    })

    it("should return the full permalink of resources", async () => {
      // Arrange
      const { site } = await setupSite()
      await setupAdminPermissions({
        userId: session.userId,
        siteId: site.id,
      })
      const { folder: folder1 } = await setupFolder({
        siteId: site.id,
      })
      const { folder: folder2 } = await setupFolder({
        siteId: site.id,
        parentId: folder1.id,
      })
      const { page } = await setupPageResource({
        resourceType: "Page",
        siteId: site.id,
        parentId: folder2.id,
      })

      // Act
      const result = await caller.search({
        siteId: String(site.id),
        query: "test",
      })

      // Assert
      const expected = {
        totalCount: 3,
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
            fullPermalink: `${folder1.permalink}`,
            lastUpdatedAt: folder1.updatedAt,
          },
        ],
        recentlyEdited: [],
        nextOffset: null,
      }
      expect(result).toEqual(expected)
    })

    it("should use the draft blob updatedAt datetime if available", async () => {
      // Arrange
      const { site } = await setupSite()
      await setupAdminPermissions({
        userId: session.userId,
        siteId: site.id,
      })
      const blob = await setupBlob()
      const { page: page1 } = await setupPageResource({
        resourceType: "Page",
        siteId: site.id,
        permalink: "page-1",
        blobId: blob.id,
      })
      const { page: page2 } = await setupPageResource({
        resourceType: "Page",
        siteId: site.id,
        permalink: "page-2",
      })
      const updatedBlob = await db
        .updateTable("Blob")
        .set({ updatedAt: new Date() })
        .where("id", "=", blob.id)
        .returningAll()
        .executeTakeFirstOrThrow()

      // Act
      const result = await caller.search({
        siteId: String(site.id),
        query: "test",
      })

      // Assert
      const expected = {
        totalCount: 2,
        resources: [
          {
            ...pick(page1, RESOURCE_FIELDS_TO_PICK),
            fullPermalink: `${page1.permalink}`,
            lastUpdatedAt: updatedBlob.updatedAt,
          },
          {
            ...pick(page2, RESOURCE_FIELDS_TO_PICK),
            fullPermalink: `${page2.permalink}`,
            lastUpdatedAt: page2.updatedAt,
          },
        ],
        recentlyEdited: [],
        nextOffset: null,
      }
      expect(result).toEqual(expected)
    })

    it("should return totalCount as a number", async () => {
      // Arrange
      const numberOfPages = 15 // arbitrary number above the default limit of 10
      const { site } = await setupSite()
      await setupAdminPermissions({
        userId: session.userId,
        siteId: site.id,
      })
      for (let index = 0; index < numberOfPages; index++) {
        await setupPageResource({
          siteId: site.id,
          resourceType: "Page",
          permalink: `page-${index + 1}`,
        })
      }

      // Act
      const result = await caller.search({
        siteId: String(site.id),
        query: "test",
      })

      // Assert
      expect(result.totalCount).toEqual(numberOfPages)
    })

    it("should return recentlyEdited as an empty array", async () => {
      // Arrange
      const { site } = await setupSite()
      await setupAdminPermissions({
        userId: session.userId,
        siteId: site.id,
      })
      await setupPageResource({ resourceType: "Page", siteId: site.id })

      // Act
      const result = await caller.search({
        siteId: String(site.id),
        query: "test",
      })

      // Assert
      expect(result.recentlyEdited).toEqual([])
    })

    it("should match all search terms and order by relevance", async () => {
      // Arrange
      const { site } = await setupSite()
      await setupAdminPermissions({
        userId: session.userId,
        siteId: site.id,
      })
      const { page: page1 } = await setupPageResource({
        resourceType: "Page",
        siteId: site.id,
        title: "apple banana cherry durian", // matches all search terms
        permalink: "apple-banana-cherry-durian",
      })
      await setupPageResource({
        resourceType: "Page",
        siteId: site.id,
        title: "apple banana cherry", // missing durian
        permalink: "apple-banana-cherry",
      })
      await setupPageResource({
        resourceType: "Page",
        siteId: site.id,
        title: "banana", // missing apple and durian
        permalink: "banana",
      })

      // Act
      const result = await caller.search({
        siteId: String(site.id),
        query: "apple banana durian",
      })

      // Assert
      const expected = {
        totalCount: 1,
        resources: [
          {
            ...pick(page1, RESOURCE_FIELDS_TO_PICK),
            fullPermalink: `${page1.permalink}`,
            lastUpdatedAt: page1.updatedAt,
          },
        ],
        recentlyEdited: [],
        nextOffset: null,
      }
      expect(result).toEqual(expected)
    })

    it("should exclude resources that match only some search terms", async () => {
      // Arrange
      const { site } = await setupSite()
      await setupAdminPermissions({
        userId: session.userId,
        siteId: site.id,
      })
      await setupPageResource({
        resourceType: "Page",
        siteId: site.id,
        title: "apple pie",
        permalink: "apple-pie",
      })

      // Act
      const result = await caller.search({
        siteId: String(site.id),
        query: "apple banana",
      })

      // Assert
      const expected = {
        totalCount: 0,
        resources: [],
        recentlyEdited: [],
        nextOffset: null,
      }
      expect(result).toEqual(expected)
    })

    it("should match all search terms when some appear mid-title", async () => {
      // Arrange
      const { site } = await setupSite()
      await setupAdminPermissions({
        userId: session.userId,
        siteId: site.id,
      })
      const { page } = await setupPageResource({
        resourceType: "Page",
        siteId: site.id,
        title: "Guide to Apple Services",
        permalink: "guide-to-apple-services",
      })

      // Act
      const result = await caller.search({
        siteId: String(site.id),
        query: "guide apple",
      })

      // Assert
      const expected = {
        totalCount: 1,
        resources: [
          {
            ...pick(page, RESOURCE_FIELDS_TO_PICK),
            fullPermalink: `${page.permalink}`,
            lastUpdatedAt: page.updatedAt,
          },
        ],
        recentlyEdited: [],
        nextOffset: null,
      }
      expect(result).toEqual(expected)
    })

    it("should match all search terms case-insensitively", async () => {
      // Arrange
      const { site } = await setupSite()
      await setupAdminPermissions({
        userId: session.userId,
        siteId: site.id,
      })
      const { page } = await setupPageResource({
        resourceType: "Page",
        siteId: site.id,
        title: "Annual Budget Report",
        permalink: "annual-budget-report",
      })

      // Act
      const result = await caller.search({
        siteId: String(site.id),
        query: "ANNUAL budget",
      })

      // Assert
      const expected = {
        totalCount: 1,
        resources: [
          {
            ...pick(page, RESOURCE_FIELDS_TO_PICK),
            fullPermalink: `${page.permalink}`,
            lastUpdatedAt: page.updatedAt,
          },
        ],
        recentlyEdited: [],
        nextOffset: null,
      }
      expect(result).toEqual(expected)
    })

    it("should return resources in order of most recently updated if same search terms", async () => {
      // Arrange
      const { site } = await setupSite()
      await setupAdminPermissions({
        userId: session.userId,
        siteId: site.id,
      })
      const { page: page1 } = await setupPageResource({
        resourceType: "Page",
        siteId: site.id,
        permalink: "page-1",
      })
      const { page: page2 } = await setupPageResource({
        resourceType: "Page",
        siteId: site.id,
        permalink: "page-2",
      })

      // Act
      const result = await caller.search({
        siteId: String(site.id),
        query: "test",
      })

      // Assert
      const expected = {
        totalCount: 2,
        resources: [
          {
            ...pick(page2, RESOURCE_FIELDS_TO_PICK),
            fullPermalink: `${page2.permalink}`,
            lastUpdatedAt: page2.updatedAt,
          },
          {
            ...pick(page1, RESOURCE_FIELDS_TO_PICK),
            fullPermalink: `${page1.permalink}`,
            lastUpdatedAt: page1.updatedAt,
          },
        ],
        recentlyEdited: [],
        nextOffset: null,
      }
      expect(result).toEqual(expected)
    })

    it("should return resources that by prefix for each word in the title", async () => {
      // Arrange
      const { site } = await setupSite()
      await setupAdminPermissions({
        userId: session.userId,
        siteId: site.id,
      })
      await setupPageResource({
        resourceType: "Page",
        siteId: site.id,
        title: "shouldnotmatch",
        permalink: "shouldnotmatch",
      })
      const { page } = await setupPageResource({
        resourceType: "Page",
        siteId: site.id,
        title: "match",
        permalink: "match",
      })

      // Act
      const result = await caller.search({
        siteId: String(site.id),
        query: "match",
      })

      // Assert
      const expected = {
        totalCount: 1,
        resources: [
          {
            ...pick(page, RESOURCE_FIELDS_TO_PICK),
            fullPermalink: `${page.permalink}`,
            lastUpdatedAt: page.updatedAt,
          },
        ],
        recentlyEdited: [],
        nextOffset: null,
      }
      expect(result).toEqual(expected)
    })

    it("should rank results by not double counting ranking order for each search term", async () => {
      // Arrange
      const { site } = await setupSite()
      await setupAdminPermissions({
        userId: session.userId,
        siteId: site.id,
      })
      const { page: page1 } = await setupPageResource({
        resourceType: "Page",
        siteId: site.id,
        title: "banana banana apple",
        permalink: "banana-banana-apple",
      })
      const { page: page2 } = await setupPageResource({
        resourceType: "Page",
        siteId: site.id,
        title: "banana apple",
        permalink: "banana-apple",
      })

      // Act
      const result = await caller.search({
        siteId: String(site.id),
        query: "banana apple",
      })

      // Assert
      const expected = {
        totalCount: 2,
        resources: [
          {
            ...pick(page2, RESOURCE_FIELDS_TO_PICK),
            fullPermalink: `${page2.permalink}`,
            lastUpdatedAt: page2.updatedAt,
          },
          {
            ...pick(page1, RESOURCE_FIELDS_TO_PICK),
            fullPermalink: `${page1.permalink}`,
            lastUpdatedAt: page1.updatedAt,
          },
        ],
        recentlyEdited: [],
        nextOffset: null,
      }
      expect(result).toEqual(expected)
    })

    it("should require each search term to prefix-match a title word", async () => {
      // Arrange — a title word that is only a prefix of a search term (e.g.
      // "long" for "longterm") must not count as a match
      const { site } = await setupSite()
      await setupAdminPermissions({
        userId: session.userId,
        siteId: site.id,
      })
      const { page: matchingPage } = await setupPageResource({
        resourceType: "Page",
        siteId: site.id,
        title: "longterm short",
        permalink: "longterm-short",
      })
      await setupPageResource({
        resourceType: "Page",
        siteId: site.id,
        title: "long short",
        permalink: "long-short",
      })

      // Act
      const result = await caller.search({
        siteId: String(site.id),
        query: "longterm short",
      })

      // Assert
      const expected = {
        totalCount: 1,
        resources: [
          {
            ...pick(matchingPage, RESOURCE_FIELDS_TO_PICK),
            fullPermalink: `${matchingPage.permalink}`,
            lastUpdatedAt: matchingPage.updatedAt,
          },
        ],
        recentlyEdited: [],
        nextOffset: null,
      }
      expect(result).toEqual(expected)
    })

    it("should not return resources that do not match the search query", async () => {
      // Arrange
      const { site } = await setupSite()
      await setupAdminPermissions({
        userId: session.userId,
        siteId: site.id,
      })
      await setupPageResource({
        resourceType: "Page",
        siteId: site.id,
        title: "whatever",
      })

      // Act
      const result = await caller.search({
        siteId: String(site.id),
        query: "test",
      })

      // Assert
      const expected = {
        totalCount: 0,
        resources: [],
        recentlyEdited: [],
        nextOffset: null,
      }
      expect(result).toEqual(expected)
    })

    it("should not return resources matched by empty space if query terms are separated by spaces", async () => {
      // Arrange
      const { site } = await setupSite()
      await setupAdminPermissions({
        userId: session.userId,
        siteId: site.id,
      })
      const { page: page1 } = await setupPageResource({
        resourceType: "Page",
        siteId: site.id,
        title: "test",
        permalink: "test",
      })
      await setupPageResource({
        resourceType: "Page",
        siteId: site.id,
        title: "something else",
        permalink: "something-else",
      })

      // Act
      const result = await caller.search({
        siteId: String(site.id),
        query: "test  test",
      })

      // Assert
      const expected = {
        totalCount: 1,
        resources: [
          {
            ...pick(page1, RESOURCE_FIELDS_TO_PICK),
            fullPermalink: `${page1.permalink}`,
            lastUpdatedAt: page1.updatedAt,
          },
        ],
        recentlyEdited: [],
        nextOffset: null,
      }
      expect(result).toEqual(expected)
    })

    it("should only return user viewable resource types if specified", async () => {
      // Arrange
      const { site } = await setupSite()
      await setupAdminPermissions({
        userId: session.userId,
        siteId: site.id,
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
        siteId: site.id,
        collectionId: collection1.id,
      })
      await setupPageResource({ resourceType: "IndexPage", siteId: site.id })
      await setupFolderMeta({ siteId: site.id, folderId: folder1.id })

      // Act
      const result = await caller.search({
        siteId: String(site.id),
        query: "test",
        resourceTypes: USER_VIEWABLE_RESOURCE_TYPES,
      })

      // Assert
      const expected = {
        totalCount: 5,
        resources: [
          {
            ...pick(collectionLink, RESOURCE_FIELDS_TO_PICK),
            fullPermalink: `${collection1.permalink}/${collectionLink.permalink}`,
            lastUpdatedAt: collectionLink.updatedAt,
          },
          {
            ...pick(collectionPage, RESOURCE_FIELDS_TO_PICK),
            fullPermalink: `${collectionPage.permalink}`,
            lastUpdatedAt: collectionPage.updatedAt,
          },
          {
            ...pick(page1, RESOURCE_FIELDS_TO_PICK),
            fullPermalink: `${page1.permalink}`,
            lastUpdatedAt: page1.updatedAt,
          },
          {
            ...pick(folder1, RESOURCE_FIELDS_TO_PICK),
            fullPermalink: `${folder1.permalink}`,
            lastUpdatedAt: folder1.updatedAt,
          },
          {
            ...pick(collection1, RESOURCE_FIELDS_TO_PICK),
            fullPermalink: `${collection1.permalink}`,
            lastUpdatedAt: collection1.updatedAt,
          },
        ],
        recentlyEdited: [],
        nextOffset: null,
      }
      expect(result).toEqual(expected)
    })

    it("should not return resources from another site", async () => {
      // Arrange
      const { site: site1 } = await setupSite()
      await setupAdminPermissions({
        userId: session.userId,
        siteId: site1.id,
      })
      const { site: site2 } = await setupSite()
      await setupAdminPermissions({
        userId: session.userId,
        siteId: site2.id,
      })
      await setupPageResource({ resourceType: "Page", siteId: site1.id })

      // Act
      const result = await caller.search({
        siteId: String(site2.id),
        query: "test",
      })

      // Assert
      const expected = {
        totalCount: 0,
        resources: [],
        recentlyEdited: [],
        nextOffset: null,
      }
      expect(result).toEqual(expected)
    })

    it("should return the correct values if query is empty string", async () => {
      // Arrange
      const { site } = await setupSite()
      await setupAdminPermissions({
        userId: session.userId,
        siteId: site.id,
      })
      const { page: page1 } = await setupPageResource({
        resourceType: "Page",
        siteId: site.id,
      })

      // Act
      const result = await caller.search({
        siteId: String(site.id),
        query: "",
      })

      // Assert
      const expected = {
        totalCount: null,
        resources: [],
        recentlyEdited: [
          {
            ...pick(page1, RESOURCE_FIELDS_TO_PICK),
            fullPermalink: `${page1.permalink}`,
            lastUpdatedAt: page1.updatedAt,
          },
        ],
        nextOffset: null,
      }
      expect(result).toEqual(expected)
    })

    it("should return the correct values if query is a string of whitespaces", async () => {
      // Arrange
      const { site } = await setupSite()
      await setupAdminPermissions({
        userId: session.userId,
        siteId: site.id,
      })
      const { page: page1 } = await setupPageResource({
        resourceType: "Page",
        siteId: site.id,
      })

      // Act
      const result = await caller.search({
        siteId: String(site.id),
        query: "       ",
      })

      // Assert
      const expected = {
        totalCount: null,
        resources: [],
        recentlyEdited: [
          {
            ...pick(page1, RESOURCE_FIELDS_TO_PICK),
            fullPermalink: `${page1.permalink}`,
            lastUpdatedAt: page1.updatedAt,
          },
        ],
        nextOffset: null,
      }
      expect(result).toEqual(expected)
    })

    it("should return the correct values if query is not provided", async () => {
      // Arrange
      const { site } = await setupSite()
      await setupAdminPermissions({
        userId: session.userId,
        siteId: site.id,
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
        totalCount: null,
        resources: [],
        recentlyEdited: [
          {
            ...pick(page1, RESOURCE_FIELDS_TO_PICK),
            fullPermalink: `${page1.permalink}`,
            lastUpdatedAt: page1.updatedAt,
          },
        ],
        nextOffset: null,
      }
      expect(result).toEqual(expected)
    })

    it("recentlyEdited should be ordered by lastUpdatedAt", async () => {
      // Arrange
      const { site } = await setupSite()
      await setupAdminPermissions({
        userId: session.userId,
        siteId: site.id,
      })
      const { page: page1 } = await setupPageResource({
        resourceType: "Page",
        siteId: site.id,
        title: "page 1",
        permalink: "page-1",
      })
      const { page: page2 } = await setupPageResource({
        resourceType: "Page",
        siteId: site.id,
        title: "page 2",
        permalink: "page-2",
      })

      // Act
      const result = await caller.search({
        siteId: String(site.id),
      })

      // Assert
      const expected = {
        totalCount: null,
        resources: [],
        recentlyEdited: [
          {
            ...pick(page2, RESOURCE_FIELDS_TO_PICK),
            fullPermalink: `${page2.permalink}`,
            lastUpdatedAt: page2.updatedAt,
          },
          {
            ...pick(page1, RESOURCE_FIELDS_TO_PICK),
            fullPermalink: `${page1.permalink}`,
            lastUpdatedAt: page1.updatedAt,
          },
        ],
        nextOffset: null,
      }
      expect(result).toEqual(expected)
    })

    it("recentlyEdited should only return page-ish resources", async () => {
      // Arrange
      const { site } = await setupSite()
      await setupAdminPermissions({
        userId: session.userId,
        siteId: site.id,
      })
      await setupPageResource({ resourceType: "RootPage", siteId: site.id })
      const { folder: folder1 } = await setupFolder({ siteId: site.id })
      await setupFolderMeta({ siteId: site.id, folderId: folder1.id })
      await setupCollection({ siteId: site.id })

      // Act
      const result = await caller.search({
        siteId: String(site.id),
      })

      // Assert
      const expected = {
        totalCount: null,
        resources: [],
        recentlyEdited: [],
        nextOffset: null,
      }
      expect(result).toEqual(expected)
    })

    describe("limit", () => {
      it("should return up to 10 most recently edited resources if no limit is provided", async () => {
        // Arrange
        const { site } = await setupSite()
        await setupAdminPermissions({
          userId: session.userId,
          siteId: site.id,
        })
        const pages = []
        for (let index = 0; index < 11; index++) {
          pages.push(
            await setupPageResource({
              siteId: site.id,
              resourceType: "Page",
              permalink: `page-${index + 1}`,
            }),
          )
        }

        // Act
        const result = await caller.search({
          siteId: String(site.id),
          query: "test",
        })

        // Assert
        const expected = {
          totalCount: 11,
          resources: pages
            .reverse()
            .slice(0, 10)
            .map((page) => {
              const { page: pageX } = page
              return {
                ...pick(pageX, RESOURCE_FIELDS_TO_PICK),
                fullPermalink: `${pageX.permalink}`,
                lastUpdatedAt: pageX.updatedAt,
              }
            }),
          recentlyEdited: [],
          nextOffset: 10,
        }
        expect(result).toEqual(expected)
      })

      it("should return limit number of resources according to the the `limit` parameter", async () => {
        // Arrange
        const { site } = await setupSite()
        await setupAdminPermissions({
          userId: session.userId,
          siteId: site.id,
        })
        await setupPageResource({
          siteId: site.id,
          resourceType: "Page",
          permalink: "page-1",
        })
        const { page: page2 } = await setupPageResource({
          siteId: site.id,
          resourceType: "Page",
          permalink: "page-2",
        })
        const { page: page3 } = await setupPageResource({
          siteId: site.id,
          resourceType: "Page",
          permalink: "page-3",
        })

        // Act
        const result = await caller.search({
          siteId: String(site.id),
          query: "test",
          limit: 2,
        })

        // Assert
        const expected = {
          totalCount: 3,
          resources: [
            {
              ...pick(page3, RESOURCE_FIELDS_TO_PICK),
              fullPermalink: `${page3.permalink}`,
              lastUpdatedAt: page3.updatedAt,
            },
            {
              ...pick(page2, RESOURCE_FIELDS_TO_PICK),
              fullPermalink: `${page2.permalink}`,
              lastUpdatedAt: page2.updatedAt,
            },
          ],
          recentlyEdited: [],
          nextOffset: 2,
        }
        expect(result).toEqual(expected)
      })

      it("should return all items if limit is greater than the number of items", async () => {
        // Arrange
        const { site } = await setupSite()
        await setupAdminPermissions({
          userId: session.userId,
          siteId: site.id,
        })
        const { page: page1 } = await setupPageResource({
          resourceType: "Page",
          siteId: site.id,
        })

        // Act
        const result = await caller.search({
          siteId: String(site.id),
          query: "test",
          limit: 2,
        })

        // Assert
        const expected = {
          totalCount: 1,
          resources: [
            {
              ...pick(page1, RESOURCE_FIELDS_TO_PICK),
              fullPermalink: `${page1.permalink}`,
              lastUpdatedAt: page1.updatedAt,
            },
          ],
          recentlyEdited: [],
          nextOffset: null,
        }
        expect(result).toEqual(expected)
      })
    })

    describe("cursor", () => {
      it("should return empty results if `cursor` is invalid", async () => {
        // Arrange
        const { site } = await setupSite()
        await setupAdminPermissions({
          userId: session.userId,
          siteId: site.id,
        })
        await setupPageResource({ resourceType: "Page", siteId: site.id })

        // Act
        const result = await caller.search({
          siteId: String(site.id),
          query: "test",
          cursor: 600,
        })

        const expected = {
          totalCount: 1,
          resources: [],
          recentlyEdited: [],
          nextOffset: null,
        }
        expect(result).toEqual(expected)
      })

      it("should return the next set of resources if valid `cursor` is provided", async () => {
        // Arrange
        const { site } = await setupSite()
        await setupAdminPermissions({
          userId: session.userId,
          siteId: site.id,
        })
        const pages = []
        for (let index = 0; index < 31; index++) {
          pages.push(
            await setupPageResource({
              siteId: site.id,
              resourceType: "Page",
              permalink: `page-${index + 1}`,
            }),
          )
        }

        // Act
        const result = await caller.search({
          siteId: String(site.id),
          query: "test",
          cursor: 10,
        })

        // Assert
        const expected = {
          totalCount: 31,
          resources: pages
            .reverse()
            .slice(10, 20)
            .map((page) => {
              const { page: pageX } = page
              return {
                ...pick(pageX, RESOURCE_FIELDS_TO_PICK),
                fullPermalink: `${pageX.permalink}`,
                lastUpdatedAt: pageX.updatedAt,
              }
            }),
          recentlyEdited: [],
          nextOffset: 20,
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
        userId: session.userId,
        siteId: site.id,
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
          fullPermalink: `${page.permalink}`,
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
      await setupEditorPermissions({ userId: session.userId, siteId: site.id })

      const resourceIds: string[] = []
      for (let i = 0; i < MAX_BATCH_RESOURCE_IDS; i++) {
        const { page } = await setupPageResource({
          siteId: site.id,
          resourceType: "Page",
          permalink: `page-${i + 1}`,
        })
        resourceIds.push(page.id)
      }

      // Act
      const result = await caller.searchWithResourceIds({
        siteId: String(site.id),
        resourceIds,
      })

      // Assert - route accepts input (DB returns unique rows so 1 result)
      expect(Array.isArray(result)).toBe(true)
    })

    it("should reject requests over MAX_BATCH_RESOURCE_IDS", async () => {
      // Arrange
      const { site } = await setupSite()
      await setupEditorPermissions({ userId: session.userId, siteId: site.id })

      // Act
      const result = caller.searchWithResourceIds({
        siteId: String(site.id),
        resourceIds: makeResourceIds(MAX_BATCH_RESOURCE_IDS + 1),
      })

      // Assert
      await expect(result).rejects.toMatchObject({ code: "BAD_REQUEST" })
    })

    it("should reject invalid bigint resource IDs", async () => {
      // Arrange
      const { site } = await setupSite()
      await setupEditorPermissions({
        userId: session.userId,
        siteId: site.id,
      })

      // Act
      const result = caller.searchWithResourceIds({
        siteId: String(site.id),
        resourceIds: ["01", "2"],
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
        siteId: 1,
        parentId: "1",
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
        userId: session.userId,
        siteId: site.id,
      })

      // Act
      const result = caller.getIndexPage({
        siteId: site.id,
        parentId: folder.id,
      })

      // Assert
      await expect(result).rejects.toThrow(new TRPCError({ code: "NOT_FOUND" }))
    })

    it("should return the index page if user has read access to the site", async () => {
      // Arrange
      const { site, folder } = await setupFolder()
      const { page } = await setupPageResource({
        resourceType: "IndexPage",
        siteId: site.id,
        parentId: folder.id,
      })
      await setupEditorPermissions({
        userId: session.userId,
        siteId: site.id,
      })

      // Act
      const result = await caller.getIndexPage({
        siteId: site.id,
        parentId: folder.id,
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
        resourceType: "IndexPage",
        siteId: site.id,
        parentId: folder.id,
      })

      // Act
      const result = caller.getIndexPage({
        siteId: site.id,
        parentId: page.id,
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
