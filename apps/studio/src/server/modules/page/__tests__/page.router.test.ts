import { TRPCError } from "@trpc/server"
import { omit, pick } from "lodash"
import { resetTables } from "tests/integration/helpers/db"
import {
  applyAuthedSession,
  applySession,
  createMockRequest,
} from "tests/integration/helpers/iron-session"
import { setupFolder, setupPageResource } from "tests/integration/helpers/seed"

import { createCallerFactory } from "~/server/trpc"
import { pageRouter } from "../page.router"

const createCaller = createCallerFactory(pageRouter)

describe("page.router", () => {
  let caller: ReturnType<typeof createCaller>
  beforeAll(async () => {
    const session = await applyAuthedSession()
    caller = createCaller(createMockRequest(session))
  })

  describe("readPage", () => {
    beforeEach(async () => {
      await resetTables("Site")
    })

    it("should throw 401 if not logged in", async () => {
      const unauthedSession = applySession()
      const unauthedCaller = createCaller(createMockRequest(unauthedSession))

      const result = unauthedCaller.readPage({
        siteId: 1,
        pageId: 1,
      })

      await expect(result).rejects.toThrow(
        new TRPCError({ code: "UNAUTHORIZED" }),
      )
    })

    it("should return 404 if page does not exist", async () => {
      // Act
      const result = caller.readPage({
        siteId: 1,
        pageId: 1,
      })

      // Assert
      await expect(result).rejects.toThrow(
        new TRPCError({ code: "NOT_FOUND", message: "Resource not found" }),
      )
    })

    it("should return the resource if resource type is Page and exists", async () => {
      // Arrange
      const { site, page: expectedPage } = await setupPageResource({
        resourceType: "Page",
      })

      // Act
      const result = await caller.readPage({
        siteId: site.id,
        pageId: Number(expectedPage.id),
      })

      // Assert
      expect(result.siteId).toEqual(site.id)
      expect(result.type).toEqual("Page")
      expect(result).toMatchObject(expectedPage)
    })

    it("should return the resource if resource type is CollectionPage and exists", async () => {
      // Arrange
      const { site, page: expectedPage } = await setupPageResource({
        resourceType: "CollectionPage",
      })

      // Act
      const result = await caller.readPage({
        siteId: site.id,
        pageId: Number(expectedPage.id),
      })

      // Assert
      expect(result.siteId).toEqual(site.id)
      expect(result.type).toEqual("CollectionPage")
      expect(result).toMatchObject(expectedPage)
    })

    it("should return the resource if resource type is RootPage and exists", async () => {
      // Arrange
      const { site, page: expectedPage } = await setupPageResource({
        resourceType: "RootPage",
      })

      // Act
      const result = await caller.readPage({
        siteId: site.id,
        pageId: Number(expectedPage.id),
      })

      // Assert
      expect(result.siteId).toEqual(site.id)
      expect(result.type).toEqual("RootPage")
      expect(result).toMatchObject(expectedPage)
    })

    it("should return 404 if resource type is not a page", async () => {
      // Arrange
      const { site, folder } = await setupFolder()

      // Act
      const result = caller.readPage({
        siteId: site.id,
        pageId: Number(folder.id),
      })

      // Assert
      await expect(result).rejects.toThrow(
        new TRPCError({ code: "NOT_FOUND", message: "Resource not found" }),
      )
    })
  })

  describe("readPageAndBlob", () => {
    it("should throw 401 if not logged in", async () => {
      const unauthedSession = applySession()
      const unauthedCaller = createCaller(createMockRequest(unauthedSession))

      const result = unauthedCaller.readPageAndBlob({
        siteId: 1,
        pageId: 1,
      })

      await expect(result).rejects.toThrow(
        new TRPCError({ code: "UNAUTHORIZED" }),
      )
    })

    it("should return 404 if page does not exist", async () => {
      // Act
      const result = caller.readPageAndBlob({
        siteId: 1,
        pageId: 1,
      })

      // Assert
      await expect(result).rejects.toThrow(
        new TRPCError({ code: "NOT_FOUND", message: "Resource not found" }),
      )
    })

    it("should return the resource if resource type is Page and exists", async () => {
      // Arrange
      const { site, page, blob, navbar, footer } = await setupPageResource({
        resourceType: "Page",
      })
      const expected = {
        ...pick(page, ["permalink", "title", "type"]),
        navbar: omit(navbar, ["createdAt", "updatedAt"]),
        footer: omit(footer, ["createdAt", "updatedAt"]),
        content: blob.content,
      }

      // Act
      const result = await caller.readPageAndBlob({
        siteId: site.id,
        pageId: Number(page.id),
      })

      // Assert
      expect(result.type).toEqual("Page")
      expect(result).toMatchObject(expected)
    })

    it("should return the resource if resource type is RootPage and exists", async () => {
      // Arrange
      const { site, page, blob, navbar, footer } = await setupPageResource({
        resourceType: "RootPage",
      })
      const expected = {
        ...pick(page, ["permalink", "title", "type"]),
        navbar: omit(navbar, ["createdAt", "updatedAt"]),
        footer: omit(footer, ["createdAt", "updatedAt"]),
        content: blob.content,
      }

      // Act
      const result = await caller.readPageAndBlob({
        siteId: site.id,
        pageId: Number(page.id),
      })

      // Assert
      expect(result.type).toEqual("RootPage")
      expect(result).toMatchObject(expected)
    })

    it("should return the resource if resource type is CollectionPage and exists", async () => {
      // Arrange
      const { site, page, blob, navbar, footer } = await setupPageResource({
        resourceType: "CollectionPage",
      })
      const expected = {
        ...pick(page, ["permalink", "title", "type"]),
        navbar: omit(navbar, ["createdAt", "updatedAt"]),
        footer: omit(footer, ["createdAt", "updatedAt"]),
        content: blob.content,
      }

      // Act
      const result = await caller.readPageAndBlob({
        siteId: site.id,
        pageId: Number(page.id),
      })

      // Assert
      expect(result.type).toEqual("CollectionPage")
      expect(result).toMatchObject(expected)
    })

    it("should return 404 if resource type is not a page", async () => {
      // Arrange
      const { site, folder } = await setupFolder()

      // Act
      const result = caller.readPageAndBlob({
        siteId: site.id,
        pageId: Number(folder.id),
      })

      // Assert
      await expect(result).rejects.toThrow(
        new TRPCError({ code: "NOT_FOUND", message: "Resource not found" }),
      )
    })
  })
})
