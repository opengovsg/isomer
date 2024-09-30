import { TRPCError } from "@trpc/server"
import {
  applyAuthedSession,
  applySession,
  createMockRequest,
} from "tests/integration/helpers/iron-session"

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
    })
  })
})
