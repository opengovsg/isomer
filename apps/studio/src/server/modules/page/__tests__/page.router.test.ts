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
  describe("list", () => {
    describe("unauthorized", () => {
      it("should throw 401 if unauthed", async () => {
        const unauthedSession = applySession()
        const ctx = createMockRequest(unauthedSession)
        const caller = createCaller(ctx)

        const result = caller.list({
          siteId: 1,
        })

        await expect(result).rejects.toThrow(
          new TRPCError({ code: "UNAUTHORIZED" }),
        )
      })
    })

    describe("authorized", () => {
      let caller: ReturnType<typeof createCaller>
      let session: ReturnType<typeof applySession>

      beforeEach(async () => {
        session = await applyAuthedSession()
        const ctx = createMockRequest(session)
        caller = createCaller(ctx)
      })

      it("should return a list of pages", async () => {
        const result = caller.list({
          siteId: 1,
        })

        await expect(result).resolves.toEqual([])
      })
    })
  })
})
