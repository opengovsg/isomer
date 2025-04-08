import { ResourceType } from "@prisma/client"
import {
  setupFolder,
  setupPageResource,
  setupSite,
} from "tests/integration/helpers/seed"

import { getBatchAncestryWithSelfQuery } from "../resource.service"

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
})
