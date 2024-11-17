import { TRPCError } from "@trpc/server"
import { resetTables } from "tests/integration/helpers/db"
import {
  applyAuthedSession,
  applySession,
  createMockRequest,
} from "tests/integration/helpers/iron-session"
import {
  setupAdminPermissions,
  setupSite,
} from "tests/integration/helpers/seed"

import { createCallerFactory } from "~/server/trpc"
import { siteRouter } from "../site.router"

const createCaller = createCallerFactory(siteRouter)

describe("site.router", async () => {
  let caller: ReturnType<typeof createCaller>
  const session = await applyAuthedSession()

  beforeAll(() => {
    caller = createCaller(createMockRequest(session))
  })

  beforeEach(async () => {
    await resetTables("Site", "ResourcePermission")
  })

  describe("list", () => {
    it("should throw 401 if not logged in", async () => {
      // Arrange
      const unauthedSession = applySession()
      const unauthedCaller = createCaller(createMockRequest(unauthedSession))

      // Act
      const result = unauthedCaller.list()

      // Assert
      await expect(result).rejects.toThrowError(
        new TRPCError({ code: "UNAUTHORIZED" }),
      )
    })

    it("should return an empty array if there are no sites in the database", async () => {
      // Act
      const result = await caller.list()

      // Assert
      expect(result).toEqual([])
    })

    it("should include the Site if the user has any role permission for the site", async () => {
      // Arrange
      const { site } = await setupSite()
      await setupAdminPermissions({
        userId: session.userId,
        siteId: site.id,
      })

      // Act
      const result = await caller.list()

      // Assert
      expect(result).toEqual([
        {
          id: site.id,
          name: site.name,
          config: site.config,
        },
      ])
    })

    it("should only include sites that the user has any role permission for", async () => {
      // Arrange
      const { site: site1 } = await setupSite()
      const { site: _site2 } = await setupSite()
      await setupAdminPermissions({
        userId: session.userId,
        siteId: site1.id,
      })

      // Act
      const result = await caller.list()

      // Assert
      expect(result).toEqual([
        {
          id: site1.id,
          name: site1.name,
          config: site1.config,
        },
      ])
    })

    it("should return an empty array if the user does not have any role for the site", async () => {
      // Arrange
      const _ = await setupSite()

      // Act
      const result = await caller.list()

      // Assert
      expect(result).toEqual([])
    })
  })

  describe("getSiteName", () => {
    it("should throw 401 if not logged in", async () => {
      // Arrange
      const unauthedSession = applySession()
      const unauthedCaller = createCaller(createMockRequest(unauthedSession))

      // Act
      const result = unauthedCaller.getSiteName({ siteId: 1 })

      // Assert
      await expect(result).rejects.toThrowError(
        new TRPCError({ code: "UNAUTHORIZED" }),
      )
    })

    it("should return the site name", async () => {
      // Arrange
      const { site } = await setupSite()
      await setupAdminPermissions({
        userId: session.userId,
        siteId: site.id,
      })

      // Act
      const result = await caller.getSiteName({ siteId: site.id })

      // Assert
      expect(result).toEqual({ name: site.name })
    })

    it.skip("should throw 403 if user does not have read access to the site", async () => {})
  })
})
