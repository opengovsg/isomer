import type { z } from "zod"
import { TRPCError } from "@trpc/server"
import { omit, pick } from "lodash"
import { resetTables } from "tests/integration/helpers/db"
import {
  applyAuthedSession,
  applySession,
  createMockRequest,
} from "tests/integration/helpers/iron-session"
import { setupFolder, setupPageResource } from "tests/integration/helpers/seed"

import type { reorderBlobSchema } from "~/schemas/page"
import { createCallerFactory } from "~/server/trpc"
import { db } from "../../database"
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

      await expect(result).rejects.toThrowError(
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
      await expect(result).rejects.toThrowError(
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
      await expect(result).rejects.toThrowError(
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

      await expect(result).rejects.toThrowError(
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
      await expect(result).rejects.toThrowError(
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
      await expect(result).rejects.toThrowError(
        new TRPCError({ code: "NOT_FOUND", message: "Resource not found" }),
      )
    })
  })

  describe("reorderBlock", () => {
    let pageToReorder: Awaited<ReturnType<typeof setupPageResource>>

    beforeEach(async () => {
      pageToReorder = await setupPageResource({ resourceType: "Page" })
    })

    it("should throw 401 if not logged in", async () => {
      const unauthedSession = applySession()
      const unauthedCaller = createCaller(createMockRequest(unauthedSession))

      const result = unauthedCaller.reorderBlock({
        siteId: 1,
        pageId: 1,
        from: 0,
        to: 1,
        blocks: pageToReorder.blob.content.content,
      })

      await expect(result).rejects.toThrowError(
        new TRPCError({ code: "UNAUTHORIZED" }),
      )
    })

    it("should return 404 if page does not exist", async () => {
      // Act
      const result = caller.reorderBlock({
        siteId: 1,
        pageId: 999999, // should not exist
        from: 0,
        to: 1,
        blocks: pageToReorder.blob.content.content,
      })

      // Assert
      await expect(result).rejects.toThrowError(
        new TRPCError({
          code: "NOT_FOUND",
          message:
            "Unable to load content for the requested page, please contact Isomer Support",
        }),
      )
    })

    it("should return 409 if block arg does not match current state", async () => {
      // Arrange
      const unexpectedBlock: z.input<typeof reorderBlobSchema>["blocks"] = [
        {
          type: "prose",
          content: [
            {
              type: "paragraph",
              content: [
                {
                  text: "Test block that does not match current blocks",
                  type: "text",
                },
              ],
            },
          ],
        },
      ]
      expect(unexpectedBlock).not.toEqual(pageToReorder.blob.content.content)

      // Act
      const result = caller.reorderBlock({
        siteId: pageToReorder.site.id,
        pageId: Number(pageToReorder.page.id),
        from: 0,
        to: 1,
        blocks: unexpectedBlock,
      })

      // Assert
      await expect(result).rejects.toThrowError(
        new TRPCError({
          code: "CONFLICT",
          message:
            "Someone on your team has changed this page, refresh the page and try again",
        }),
      )
    })

    it("should return 422 if `from` arg is out of bounds", async () => {
      // Arrange
      const fromArg = pageToReorder.blob.content.content.length + 10

      // Act
      const result = caller.reorderBlock({
        siteId: pageToReorder.site.id,
        pageId: Number(pageToReorder.page.id),
        from: fromArg, // should not exist
        to: 1,
        blocks: pageToReorder.blob.content.content,
      })

      // Assert
      await expect(result).rejects.toThrowError(
        new TRPCError({
          code: "UNPROCESSABLE_CONTENT",
        }),
      )
    })

    it("should fail validation if `from` arg is negative index", async () => {
      // Act
      const result = caller.reorderBlock({
        siteId: pageToReorder.site.id,
        pageId: Number(pageToReorder.page.id),
        from: -1,
        to: 1,
        blocks: pageToReorder.blob.content.content,
      })

      // Assert
      await expect(result).rejects.toThrowError(
        "Number must be greater than or equal to 0",
      )
    })

    it("should return 422 if `to` arg is out of bounds", async () => {
      // Arrange
      const toArg = pageToReorder.blob.content.content.length + 10

      // Act
      const result = caller.reorderBlock({
        siteId: pageToReorder.site.id,
        pageId: Number(pageToReorder.page.id),
        from: 1,
        to: toArg, // should not exist
        blocks: pageToReorder.blob.content.content,
      })

      // Assert
      await expect(result).rejects.toThrowError(
        new TRPCError({
          code: "UNPROCESSABLE_CONTENT",
        }),
      )
    })

    it("should fail validation if `to` arg is negative index", async () => {
      // Act
      const result = caller.reorderBlock({
        siteId: pageToReorder.site.id,
        pageId: Number(pageToReorder.page.id),
        from: 1,
        to: -1,
        blocks: pageToReorder.blob.content.content,
      })

      // Assert
      await expect(result).rejects.toThrowError(
        "Number must be greater than or equal to 0",
      )
    })

    it("should reorder block if args are valid", async () => {
      // Act
      const result = await caller.reorderBlock({
        siteId: pageToReorder.site.id,
        pageId: Number(pageToReorder.page.id),
        from: 0,
        to: 1,
        blocks: pageToReorder.blob.content.content,
      })

      // Assert
      const actual = await db
        .selectFrom("Blob")
        .where("id", "=", pageToReorder.blob.id)
        .select("content")
        .executeTakeFirstOrThrow()
      const expectedBlocks = pageToReorder.blob.content.content.reverse()
      expect(actual.content.content).toEqual(expectedBlocks)
      expect(result).toEqual(expectedBlocks)
    })
  })
})
