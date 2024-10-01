import { TRPCError } from "@trpc/server"
import {
  applyAuthedSession,
  applySession,
  createMockRequest,
} from "tests/integration/helpers/iron-session"
import { setupFolder, setupPageResource } from "tests/integration/helpers/seed"

import { readPageOutputSchema } from "~/schemas/page"
import { createCallerFactory } from "~/server/trpc"
import { pageRouter } from "../page.router"

const createCaller = createCallerFactory(pageRouter)

describe("page.router", () => {
  describe("readPage", () => {
    it("should throw 401 if not logged in", async () => {
      const unauthedSession = applySession()
      const ctx = createMockRequest(unauthedSession)
      const caller = createCaller(ctx)

      const result = caller.readPage({
        siteId: 1,
        pageId: 1,
      })

      await expect(result).rejects.toThrow(
        new TRPCError({ code: "UNAUTHORIZED" }),
      )
    })

    describe("authenticated", () => {
      let caller: ReturnType<typeof createCaller>
      let session: ReturnType<typeof applySession>

      beforeEach(async () => {
        session = await applyAuthedSession()
        const ctx = createMockRequest(session)
        caller = createCaller(ctx)
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
        const { siteId, pageId } = await setupPageResource({
          resourceType: "Page",
        })

        // Act
        const result = await caller.readPage({
          siteId,
          pageId: Number(pageId),
        })

        // Assert
        expect(readPageOutputSchema.safeParse(result).success).toEqual(true)
      })

      it("should return the resource if resource type is CollectionPage and exists", async () => {
        // Arrange
        const { siteId, pageId } = await setupPageResource({
          resourceType: "CollectionPage",
        })

        // Act
        const result = await caller.readPage({
          siteId,
          pageId: Number(pageId),
        })

        // Assert
        expect(readPageOutputSchema.safeParse(result).success).toEqual(true)
      })

      it("should return the resource if resource type is RootPage and exists", async () => {
        // Arrange
        const { siteId, pageId } = await setupPageResource({
          resourceType: "RootPage",
        })

        // Act
        const result = await caller.readPage({
          siteId,
          pageId: Number(pageId),
        })

        // Assert
        expect(readPageOutputSchema.safeParse(result).success).toEqual(true)
      })

      it("should return 404 if resource type is not a page", async () => {
        // Arrange
        const { siteId, folderId } = await setupFolder()

        // Act
        const result = caller.readPage({
          siteId,
          pageId: Number(folderId),
        })

        // Assert
        await expect(result).rejects.toThrow(
          new TRPCError({ code: "NOT_FOUND", message: "Resource not found" }),
        )
      })
    })
  })
})
