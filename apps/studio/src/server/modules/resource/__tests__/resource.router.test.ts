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
})
