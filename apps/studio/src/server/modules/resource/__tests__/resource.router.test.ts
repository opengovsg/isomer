import { TRPCError } from "@trpc/server"
import _, { pick } from "lodash"
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
  setupEditorPermissions,
  setupFolder,
  setupFolderMeta,
  setupPageResource,
  setupSite,
  setupUser,
} from "tests/integration/helpers/seed"

import * as auditService from "~/server/modules/audit/audit.service"
import { createCallerFactory } from "~/server/trpc"
import { getUserViewableResourceTypes } from "~/utils/resources"
import { db } from "../../database"
import { resourceRouter } from "../resource.router"
import { getFullPageById } from "../resource.service"

const createCaller = createCallerFactory(resourceRouter)

describe("resource.router", async () => {
  let caller: ReturnType<typeof createCaller>
  const session = await applyAuthedSession()

  beforeAll(() => {
    caller = createCaller(createMockRequest(session))
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
      const unauthedSession = applySession()
      const unauthedCaller = createCaller(createMockRequest(unauthedSession))

      const result = unauthedCaller.getMetadataById({
        resourceId: "1",
      })

      await expect(result).rejects.toThrowError(
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
        resourceId: "1",
      })

      // Assert
      await expect(result).rejects.toThrowError(
        new TRPCError({ code: "NOT_FOUND" }),
      )
    })

    it("should return metadata if page resource exists", async () => {
      // Arrange
      const { page } = await setupPageResource({
        resourceType: "Page",
      })

      // Act
      const result = caller.getMetadataById({
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

    it.skip("should throw 403 if user does not have read access to resource", async () => {})
  })

  describe("getFolderChildrenOf", () => {
    it("should throw 401 if not logged in", async () => {
      const unauthedSession = applySession()
      const unauthedCaller = createCaller(createMockRequest(unauthedSession))

      const result = unauthedCaller.getFolderChildrenOf({
        resourceId: "1",
        siteId: "1",
        limit: 25,
      })

      await expect(result).rejects.toThrowError(
        new TRPCError({ code: "UNAUTHORIZED" }),
      )
    })

    it("should return 404 if resource does not exist", async () => {
      // Act
      const result = caller.getFolderChildrenOf({
        resourceId: "1",
        siteId: "1",
        limit: 25,
      })

      // Assert
      await expect(result).rejects.toThrowError(
        new TRPCError({ code: "NOT_FOUND" }),
      )
    })

    it("should return 404 if resource is not a folder", async () => {
      // Arrange
      const { site, page } = await setupPageResource({
        resourceType: "Page",
      })

      // Act
      const result = caller.getFolderChildrenOf({
        siteId: String(site.id),
        resourceId: page.id,
      })

      // Assert
      await expect(result).rejects.toThrowError(
        new TRPCError({ code: "NOT_FOUND" }),
      )
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

    it.skip("should throw 403 if user does not have read access to resource", async () => {})
  })

  describe("getChildrenOf", () => {
    it("should throw 401 if not logged in", async () => {
      const unauthedSession = applySession()
      const unauthedCaller = createCaller(createMockRequest(unauthedSession))

      const result = unauthedCaller.getChildrenOf({
        resourceId: "1",
        siteId: "1",
        limit: 25,
      })

      await expect(result).rejects.toThrowError(
        new TRPCError({ code: "UNAUTHORIZED" }),
      )
    })

    it("should return 404 if resource does not exist", async () => {
      // Act
      const result = caller.getChildrenOf({
        resourceId: "1",
        siteId: "1",
        limit: 25,
      })

      // Assert
      await expect(result).rejects.toThrowError(
        new TRPCError({ code: "NOT_FOUND" }),
      )
    })

    it("should return 404 if resource is not a folder", async () => {
      // Arrange
      const { site, page } = await setupPageResource({
        resourceType: "Page",
      })

      // Act
      const result = caller.getChildrenOf({
        siteId: String(site.id),
        resourceId: page.id,
      })

      // Assert
      await expect(result).rejects.toThrowError(
        new TRPCError({ code: "NOT_FOUND" }),
      )
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

    it("should return empty items array if `cursor` is invalid", async () => {
      // Arrange
      const { site } = await setupSite()
      const { folder } = await setupFolder({
        siteId: site.id,
        parentId: null,
        permalink: "parent-folder",
        title: "Parent folder",
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
      const unauthedSession = applySession()
      const unauthedCaller = createCaller(createMockRequest(unauthedSession))

      const result = unauthedCaller.getNestedFolderChildrenOf({
        resourceId: "1",
        siteId: "1",
      })

      await expect(result).rejects.toThrowError(
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
      const result = caller.getNestedFolderChildrenOf({
        resourceId: "1",
        siteId: String(site.id),
      })

      // Assert
      await expect(result).rejects.toThrowError(
        new TRPCError({ code: "NOT_FOUND" }),
      )
    })

    it("should return 404 if resource is not a folder", async () => {
      // Arrange
      const { site } = await setupSite()
      await setupAdminPermissions({
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
      await expect(result).rejects.toThrowError(
        new TRPCError({ code: "NOT_FOUND" }),
      )
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
      await expect(result).rejects.toThrowError(
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
      await setupAdminPermissions({
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
  })

  describe("move", () => {
    it("should throw 401 if not logged in", async () => {
      const unauthedSession = applySession()
      const { site } = await setupSite()
      const auditSpy = vitest.spyOn(auditService, "logResourceEvent")
      const unauthedCaller = createCaller(createMockRequest(unauthedSession))

      const result = unauthedCaller.move({
        siteId: site.id,
        movedResourceId: "1",
        destinationResourceId: "1",
      })

      await expect(result).rejects.toThrowError(
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
      await expect(result).rejects.toThrowError(
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
      await expect(result).rejects.toThrowError(
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
      await expect(result).rejects.toThrowError(
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
      await expect(result).rejects.toThrowError(
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
      await expect(result).rejects.toThrowError(
        new TRPCError({
          code: "FORBIDDEN",
          message:
            "Please ensure that you have the required permissions to perform a move!",
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
      await expect(result).rejects.toThrowError(
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
        _.omit(result, ["createdAt", "updatedAt"]),
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
        _.omit(result, ["createdAt", "updatedAt"]),
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
        _.omit(result, ["createdAt", "updatedAt"]),
      )
      expect(auditEntry.userId).toBe(session.userId)
    })

    it.skip("should throw 403 if user does not have write access to destination resource", async () => {})

    it.skip("should throw 403 if user does not have write access to origin resource", async () => {})
  })

  describe("countWithoutRoot", () => {
    it("should throw 401 if not logged in", async () => {
      const unauthedSession = applySession()
      const unauthedCaller = createCaller(createMockRequest(unauthedSession))

      const result = unauthedCaller.countWithoutRoot({
        resourceId: 1,
        siteId: 1,
      })

      await expect(result).rejects.toThrowError(
        new TRPCError({ code: "UNAUTHORIZED" }),
      )
    })

    it("should return 0 if resource does not exist", async () => {
      const { site } = await setupSite()
      // Act
      const result = await caller.countWithoutRoot({
        resourceId: 99999, // should not exist
        siteId: site.id,
      })

      // Assert
      expect(result).toEqual(0)
    })

    it("should return 0 if site does not exist", async () => {
      // Act
      const result = await caller.countWithoutRoot({
        resourceId: 99999, // should not exist
        siteId: 99999, // should not exist also
      })

      // Assert
      expect(result).toEqual(0)
    })

    it("should return 0 if resource is a page", async () => {
      // Arrange
      const { page, site } = await setupPageResource({
        resourceType: "Page",
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

      // Act
      const result = await caller.countWithoutRoot({
        resourceId: Number(folderToUse.id),
        siteId: site.id,
      })

      // Assert
      expect(result).toEqual(numberOfPages + numberOfFolders)
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
    ] as const

    const testListComparable = (
      a: { updatedAt: Date; title: string },
      b: { updatedAt: Date; title: string },
    ) => {
      if (b.updatedAt.valueOf() === a.updatedAt.valueOf()) {
        return a.title.localeCompare(b.title)
      }
      return b.updatedAt.valueOf() - a.updatedAt.valueOf()
    }

    it("should throw 401 if not logged in", async () => {
      const unauthedSession = applySession()
      const unauthedCaller = createCaller(createMockRequest(unauthedSession))

      const result = unauthedCaller.listWithoutRoot({
        siteId: 1,
        limit: 25,
      })

      await expect(result).rejects.toThrowError(
        new TRPCError({ code: "UNAUTHORIZED" }),
      )
    })

    it("should return empty array if site does not exist", async () => {
      // Act
      const result = await caller.listWithoutRoot({
        siteId: 99999, // should not exist
        limit: 25,
      })

      // Assert
      expect(result).toEqual([])
    })

    it("should return empty array if site has no resources", async () => {
      // Arrange
      const { site } = await setupSite()

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

      // Act
      const result = await caller.listWithoutRoot({
        siteId: site.id,
        limit: 25,
      })

      // Assert
      expect(result).toEqual([])
    })

    it("should return empty array if resource does not exist", async () => {
      // Arrange
      const { site } = await setupSite()

      // Act
      const result = await caller.listWithoutRoot({
        siteId: site.id,
        resourceId: 99999, // should not exist
        limit: 25,
      })

      // Assert
      expect(result).toEqual([])
    })

    it("should return empty array if resource is not a folder", async () => {
      // Arrange
      const { site, page } = await setupPageResource({
        resourceType: "Page",
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

    it.skip("should throw 403 if user does not have read access to the resource", async () => {})
  })

  describe("delete", () => {
    it("should throw 401 if not logged in", async () => {
      const unauthedSession = applySession()
      const unauthedCaller = createCaller(createMockRequest(unauthedSession))
      const auditSpy = vitest.spyOn(auditService, "logResourceEvent")

      const result = unauthedCaller.delete({
        resourceId: "1",
        siteId: 1,
      })

      expect(auditSpy).not.toHaveBeenCalled()
      await expect(result).rejects.toThrowError(
        new TRPCError({ code: "UNAUTHORIZED" }),
      )
    })

    it("should return 400 if resource to delete does not exist", async () => {
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
      expect(auditSpy).not.toHaveBeenCalled()
      await expect(result).rejects.toThrowError(
        new TRPCError({ code: "BAD_REQUEST", message: "Resource not found" }),
      )
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
        _.omit(fullPage, ["createdAt", "updatedAt"]),
      )
      expect(auditEntry.userId).toBe(session.userId)
      const actual = await db
        .selectFrom("Resource")
        .where("id", "=", page.id)
        .executeTakeFirst()
      expect(actual).toBeUndefined()
      expect(result).toEqual(page)
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
        _.omit(folderToUse, ["createdAt", "updatedAt"]),
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
      await expect(result).rejects.toThrowError(
        new TRPCError({ code: "BAD_REQUEST" }),
      )
    })

    it.skip("should throw 403 if user does not have delete access to the resource", async () => {})
  })

  describe("getParentOf", () => {
    it("should throw 401 if not logged in", async () => {
      const unauthedSession = applySession()
      const unauthedCaller = createCaller(createMockRequest(unauthedSession))

      const result = unauthedCaller.getParentOf({
        resourceId: "1",
        siteId: 1,
      })

      await expect(result).rejects.toThrowError(
        new TRPCError({ code: "UNAUTHORIZED" }),
      )
    })

    it("should return 404 if resource does not exist", async () => {
      // Arrange
      const { site } = await setupSite()

      // Act
      const result = caller.getParentOf({
        resourceId: "99999", // should not exist
        siteId: site.id,
      })

      // Assert
      await expect(result).rejects.toThrowError(
        new TRPCError({ code: "NOT_FOUND" }),
      )
    })

    it("should return null parent if resource is a root page", async () => {
      // Arrange
      const { page, site } = await setupPageResource({
        resourceType: "RootPage",
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

    it.skip("should throw 403 if user does not have read access to the resource", async () => {})
  })

  describe("getWithFullPermalink", () => {
    it("should throw 401 if not logged in", async () => {
      const unauthedSession = applySession()
      const unauthedCaller = createCaller(createMockRequest(unauthedSession))

      const result = unauthedCaller.getWithFullPermalink({
        resourceId: "1",
      })

      await expect(result).rejects.toThrowError(
        new TRPCError({ code: "UNAUTHORIZED" }),
      )
    })

    it("should return 404 if resource does not exist", async () => {
      // Arrange
      await setupSite()

      // Act
      const result = caller.getWithFullPermalink({
        resourceId: "99999",
      })

      // Assert
      await expect(result).rejects.toThrowError(
        new TRPCError({ code: "NOT_FOUND" }),
      )
    })

    it("should return the details with full permalink of a first-level resource", async () => {
      // Arrange
      const { page } = await setupPageResource({
        resourceType: "Page",
      })

      // Act
      const result = await caller.getWithFullPermalink({
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

      // Act
      const result = await caller.getWithFullPermalink({
        resourceId: nestedPage.id,
      })

      // Assert
      expect(result).toMatchObject({
        id: nestedPage.id,
        title: nestedPage.title,
        fullPermalink: `${parentFolder.permalink}/${nestedFolder.permalink}/${nestedPage.permalink}`,
      })
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
      const unauthedSession = applySession()
      const unauthedCaller = createCaller(createMockRequest(unauthedSession))

      const result = unauthedCaller.getAncestryStack({
        resourceId: "1",
        siteId: "1",
      })

      await expect(result).rejects.toThrowError(
        new TRPCError({ code: "UNAUTHORIZED" }),
      )
    })

    it("should return empty array if resource does not exist", async () => {
      // Arrange
      const { site } = await setupSite()

      // Act
      const result = await caller.getAncestryStack({
        siteId: String(site.id),
        resourceId: "99999",
      })

      // Assert
      expect(result).toEqual([])
    })

    it("should return empty array if resource is a root page", async () => {
      // Arrange
      const { page, site } = await setupPageResource({
        resourceType: "RootPage",
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

    it.skip("should throw 403 if user does not have read access to the resource", async () => {})
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
      const unauthedSession = applySession()
      const unauthedCaller = createCaller(createMockRequest(unauthedSession))

      const result = unauthedCaller.search({
        siteId: "1",
        query: "test",
      })

      await expect(result).rejects.toThrowError(
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
      await expect(result).rejects.toThrowError(
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

    it("should match and order by splitting the query into an array of search terms", async () => {
      // Arrange
      const { site } = await setupSite()
      await setupAdminPermissions({
        userId: session.userId,
        siteId: site.id,
      })
      const { page: page1 } = await setupPageResource({
        resourceType: "Page",
        siteId: site.id,
        title: "apple banana cherry durian", // should match 3 terms
        permalink: "apple-banana-cherry-durian",
      })
      const { page: page2 } = await setupPageResource({
        resourceType: "Page",
        siteId: site.id,
        title: "apple banana cherry", // should match 2 terms
        permalink: "apple-banana-cherry",
      })
      const { page: page3 } = await setupPageResource({
        resourceType: "Page",
        siteId: site.id,
        title: "banana", // should match 1 term
        permalink: "banana",
      })

      // Act
      const result = await caller.search({
        siteId: String(site.id),
        query: "apple banana durian",
      })

      // Assert
      const expected = {
        totalCount: 3,
        resources: [
          {
            ...pick(page1, RESOURCE_FIELDS_TO_PICK),
            fullPermalink: `${page1.permalink}`,
            lastUpdatedAt: page1.updatedAt,
          },
          {
            ...pick(page2, RESOURCE_FIELDS_TO_PICK),
            fullPermalink: `${page2.permalink}`,
            lastUpdatedAt: page2.updatedAt,
          },
          {
            ...pick(page3, RESOURCE_FIELDS_TO_PICK),
            fullPermalink: `${page3.permalink}`,
            lastUpdatedAt: page3.updatedAt,
          },
        ],
        recentlyEdited: [],
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
      }
      expect(result).toEqual(expected)
    })

    it("should rank results by character length of search term matches", async () => {
      // Arrange
      const { site } = await setupSite()
      await setupAdminPermissions({
        userId: session.userId,
        siteId: site.id,
      })
      const { page: page1 } = await setupPageResource({
        resourceType: "Page",
        siteId: site.id,
        title: "looooongword",
        permalink: "looooongword",
      })
      const { page: page2 } = await setupPageResource({
        resourceType: "Page",
        siteId: site.id,
        title: "shortword",
        permalink: "shortword",
      })

      // Act
      const result = await caller.search({
        siteId: String(site.id),
        query: "shortword looooongword",
      })

      // Assert
      const expected = {
        totalCount: 2,
        resources: [
          {
            ...pick(page1, RESOURCE_FIELDS_TO_PICK),
            fullPermalink: `${page1.permalink}`,
            lastUpdatedAt: page1.updatedAt,
          },
          {
            ...pick(page2, RESOURCE_FIELDS_TO_PICK),
            fullPermalink: `${page2.permalink}`,
            lastUpdatedAt: page2.updatedAt,
          },
        ],
        recentlyEdited: [],
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
        resourceTypes: getUserViewableResourceTypes(),
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
        }
        expect(result).toEqual(expected)
      })
    })
  })
})
