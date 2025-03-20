import type { applySession } from "tests/integration/helpers/iron-session"
import { TRPCError } from "@trpc/server"
import { resetTables } from "tests/integration/helpers/db"
import {
  applyAuthedSession,
  createMockRequest,
} from "tests/integration/helpers/iron-session"
import { setUpWhitelist } from "tests/integration/helpers/seed"
import { describe, expect, it } from "vitest"

import { createCallerFactory } from "~/server/trpc"
import * as authService from "../../audit/audit.service"
import { db } from "../../database"
import { authRouter } from "../auth.router"

const createCaller = createCallerFactory(authRouter)

describe("auth.email", () => {
  let caller: Awaited<ReturnType<typeof authRouter.createCaller>>
  let session: ReturnType<typeof applySession>
  const TEST_VALID_EMAIL = "test@open.gov.sg"

  beforeEach(async () => {
    await resetTables("User", "VerificationToken", "Whitelist")
    await setUpWhitelist({ email: TEST_VALID_EMAIL })
    session = await applyAuthedSession()
    const ctx = createMockRequest(session)
    caller = createCaller(ctx)
  })

  describe("logout", () => {
    it("should not log anything if there is an error thrown while logging out", async () => {
      // Arrange
      const spy = vi.spyOn(authService, "logAuthEvent")
      await db.deleteFrom("User").where("id", "=", session.userId!).execute()

      // Act
      const result = caller.logout()

      // Assert
      expect(spy).not.toHaveBeenCalled()
      await expect(result).rejects.toThrowError(
        new TRPCError({ code: "BAD_REQUEST" }),
      )
    })
    it("should log the user out and have an audit log of the change", async () => {
      // Arrange
      const spy = vi.spyOn(authService, "logAuthEvent")

      // Act
      const result = await caller.logout()

      // Assert
      // NOTE: Not asserting argument becasuse this requires a tx,
      // we'll instead check that the db row exists
      expect(spy).toHaveBeenCalled()
      expect(result.isLoggedIn).toBeFalsy()
      const user = db
        .selectFrom("User")
        .where("id", "=", session.userId!)
        .selectAll()
        .executeTakeFirstOrThrow()
      const log = await db
        .selectFrom("AuditLog")
        .selectAll()
        .where("eventType", "=", "Logout")
        .executeTakeFirstOrThrow()
      expect(log).toMatchObject({
        delta: {
          before: user,
          after: null,
        },
        eventType: "Logout",
        ipAddress: "127.0.0.1",
      })
    })
  })
})
