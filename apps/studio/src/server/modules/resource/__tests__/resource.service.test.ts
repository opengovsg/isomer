import { setupPageResource } from "tests/integration/helpers/seed"

import type { Resource } from "../../database"
import { getSiteResourceById } from "../resource.service"

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
})
