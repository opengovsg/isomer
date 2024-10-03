import { TRPCError } from "@trpc/server"
import {
  applyAuthedSession,
  applySession,
  createMockRequest,
} from "tests/integration/helpers/iron-session"
import { setupPageResource } from "tests/integration/helpers/seed"

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
})
