import { TRPCError } from "@trpc/server"
import { pick } from "lodash"
import {
  applyAuthedSession,
  applySession,
  createMockRequest,
} from "tests/integration/helpers/iron-session"
import {
  setupFolder,
  setupPageResource,
  setupSite,
} from "tests/integration/helpers/seed"

import { createCallerFactory } from "~/server/trpc"
import { db } from "../../database"
import { resourceRouter } from "../resource.router"

const createCaller = createCallerFactory(resourceRouter)

describe("resource.router", () => {
  let caller: ReturnType<typeof createCaller>

  beforeAll(async () => {
    const session = await applyAuthedSession()
    caller = createCaller(createMockRequest(session))
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

  describe("move", () => {
    it("should throw 401 if not logged in", async () => {
      const unauthedSession = applySession()
      const unauthedCaller = createCaller(createMockRequest(unauthedSession))

      const result = unauthedCaller.move({
        movedResourceId: "1",
        destinationResourceId: "1",
      })

      await expect(result).rejects.toThrowError(
        new TRPCError({ code: "UNAUTHORIZED" }),
      )
    })

    it("should return 400 if moved resource does not exist", async () => {
      // Arrange
      const { folder } = await setupFolder()

      // Act
      const result = caller.move({
        movedResourceId: "99999", // should not exist
        destinationResourceId: folder.id,
      })

      // Assert
      await expect(result).rejects.toThrowError(
        new TRPCError({ code: "BAD_REQUEST" }),
      )
    })

    it("should return 400 if destination resource does not exist", async () => {
      // Arrange
      const { folder } = await setupFolder()

      // Act
      const result = caller.move({
        movedResourceId: folder.id,
        destinationResourceId: "99999", // should not exist
      })

      // Assert
      await expect(result).rejects.toThrowError(
        new TRPCError({ code: "BAD_REQUEST" }),
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

      // Act
      const result = caller.move({
        movedResourceId: pageToMove.id,
        destinationResourceId: anotherPage.id,
      })

      // Assert
      await expect(result).rejects.toThrowError(
        new TRPCError({ code: "BAD_REQUEST" }),
      )
    })

    it("should return 403 if source and destination resources belong to different sites", async () => {
      // Arrange
      const { page: originPage, site: originSite } = await setupPageResource({
        resourceType: "Page",
      })
      const { folder: destinationFolder, site: destinationSite } =
        await setupFolder()
      expect(originSite.id).not.toEqual(destinationSite.id)

      // Act
      const result = caller.move({
        movedResourceId: originPage.id,
        destinationResourceId: destinationFolder.id,
      })

      // Assert
      await expect(result).rejects.toThrowError(
        new TRPCError({ code: "FORBIDDEN" }),
      )
    })

    it("should move nested resource to destination folder", async () => {
      // Arrange
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

      // Act
      const result = await caller.move({
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
    })

    it("should move root-level resource to destination folder", async () => {
      // Arrange
      const { page: pageToMove, site } = await setupPageResource({
        resourceType: "Page",
        parentId: null,
      })
      const { folder: destinationFolder } = await setupFolder({
        siteId: site.id,
        permalink: "destination-folder",
      })

      // Act
      const result = await caller.move({
        movedResourceId: pageToMove.id,
        destinationResourceId: destinationFolder.id,
      })

      // Assert
      const expected = {
        ...pick(pageToMove, ["id", "type", "permalink", "title"]),
        parentId: destinationFolder.id,
      }
      expect(result).toMatchObject(expected)
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
})
