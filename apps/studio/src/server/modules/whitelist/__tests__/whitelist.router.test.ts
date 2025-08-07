import { TRPCError } from "@trpc/server"
import { auth } from "tests/integration/helpers/auth"
import { resetTables } from "tests/integration/helpers/db"
import {
  applyAuthedSession,
  applySession,
  createMockRequest,
} from "tests/integration/helpers/iron-session"
import {
  setupAdminPermissions,
  setupPublisherPermissions,
  setupSite,
  setupUser,
  setUpWhitelist,
} from "tests/integration/helpers/seed"

import { createCallerFactory } from "~/server/trpc"
import { whitelistRouter } from "../whitelist.router"

const createCaller = createCallerFactory(whitelistRouter)

describe("whitelist.router", async () => {
  let caller: ReturnType<typeof createCaller>
  let unauthedCaller: ReturnType<typeof createCaller>
  const session = await applyAuthedSession()

  describe("isEmailWhitelisted", () => {
    beforeEach(async () => {
      await resetTables("User", "Whitelist")
      caller = createCaller(createMockRequest(session))
      unauthedCaller = createCaller(createMockRequest(applySession()))
      const user = await setupUser({
        userId: session.userId,
        email: "test@mock.com",
      })
      await auth(user)
    })

    it("should throw 401 if not logged in", async () => {
      // Act
      const result = unauthedCaller.isEmailWhitelisted({
        siteId: 1,
        email: "test@mock.com",
      })

      // Assert
      await expect(result).rejects.toThrowError(
        new TRPCError({ code: "UNAUTHORIZED" }),
      )
    })

    it("should throw 403 if user does not have manage permissions", async () => {
      // Arrange
      const { site } = await setupSite()
      await setUpWhitelist({ email: "another-test@mock.com" })
      await setupPublisherPermissions({
        userId: session.userId,
        siteId: site.id,
      })

      // Act
      const result = caller.isEmailWhitelisted({
        siteId: site.id,
        email: "another-test@mock.com",
      })

      // Assert
      await expect(result).rejects.toThrowError(
        new TRPCError({
          code: "FORBIDDEN",
          message:
            "You do not have sufficient permissions to perform this action",
        }),
      )
    })

    it("should return false if email is not whitelisted", async () => {
      // Arrange
      const { site } = await setupSite()
      await setupAdminPermissions({ userId: session.userId, siteId: site.id })

      // Act
      const result = await caller.isEmailWhitelisted({
        siteId: site.id,
        email: "another-test@mock.com",
      })

      // Assert
      expect(result).toBe(false)
    })

    it("should return true if email is whitelisted", async () => {
      // Arrange
      const { site } = await setupSite()
      await setUpWhitelist({ email: "another-test@mock.com" })
      await setupAdminPermissions({ userId: session.userId, siteId: site.id })
      // Act
      const result = await caller.isEmailWhitelisted({
        siteId: site.id,
        email: "another-test@mock.com",
      })

      // Assert
      expect(result).toBe(true)
    })
  })
})
