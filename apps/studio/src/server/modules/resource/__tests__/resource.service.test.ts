import { pick } from "lodash"
import {
  setupPageResource,
  setupTestUser,
} from "tests/integration/helpers/seed"

import type { Resource } from "../../database"
import { db } from "../../database"
import { getFullPageById, getSiteResourceById } from "../resource.service"

describe("resource.service", () => {
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
      const testUser = await setupTestUser()
      const {
        site,
        page: actualPage,
        blob: actualBlob,
      } = await setupPageResource({
        resourceType: "Page",
        state: "Published",
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
})
