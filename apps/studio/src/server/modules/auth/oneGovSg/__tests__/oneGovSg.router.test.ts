import type { SessionData } from "~/lib/types/session"
import { TRPCError } from "@trpc/server"
import { resetTables } from "tests/integration/helpers/db"
import {
  applySession,
  createMockRequest,
} from "tests/integration/helpers/iron-session"
import { setupUser, setUpWhitelist } from "tests/integration/helpers/seed"
import { describe, expect, it, vi } from "vitest"
import { env } from "~/env.mjs"
import * as mailService from "~/features/mail/service"
import * as growthbookLib from "~/lib/growthbook"
import { DASHBOARD, SIGN_IN_SINGPASS } from "~/lib/routes"
import { ONE_GOV_SG_LOGIN_METHOD } from "~/lib/types/session"
import { AuditLogEvent, db } from "~/server/modules/database"
import { createCallerFactory } from "~/server/trpc"

import { getIpFingerprint, LOCALHOST } from "../../email/utils"
import { oneGovSgRouter } from "../oneGovSg.router"
import * as OneGovSgService from "../oneGovSg.service"

const createCaller = createCallerFactory(oneGovSgRouter)
const TEST_VALID_EMAIL = "test@open.gov.sg"
const TEST_AUTHORIZATION_URL = "https://one.gov.sg/api/auth/authorize"
const TEST_LOGIN_ATTEMPT = {
  identifier: getIpFingerprint(TEST_VALID_EMAIL, LOCALHOST),
  method: ONE_GOV_SG_LOGIN_METHOD,
}
const INVALID_LOGIN_FLOW = new TRPCError({
  code: "BAD_REQUEST",
  message: "Invalid login flow",
})

const PENDING_LOGIN_IDENTIFIER = `${ONE_GOV_SG_LOGIN_METHOD}|state`

const createSessionState = () => ({
  codeVerifier: "code-verifier",
  nonce: "nonce",
  state: "state",
  expiresAt: Date.now() + 60 * 1000,
})

describe("auth.oneGovSg", () => {
  let caller: ReturnType<typeof createCaller>
  let session: ReturnType<typeof applySession>

  beforeEach(async () => {
    await resetTables("AuditLog", "User", "VerificationToken", "Whitelist")
    await setUpWhitelist({ email: TEST_VALID_EMAIL })
    session = applySession()
    caller = createCaller(createMockRequest(session))
    vi.spyOn(OneGovSgService, "isOneGovSgEnabled").mockReturnValue(true)
    vi.spyOn(OneGovSgService, "getAuthorizationUrl").mockResolvedValue({
      authorizationUrl: TEST_AUTHORIZATION_URL,
      session: createSessionState(),
    })
    vi.spyOn(OneGovSgService, "exchangeCode").mockResolvedValue(
      TEST_VALID_EMAIL,
    )
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe("isEnabled", () => {
    it("should report whether one.gov.sg is configured", async () => {
      // Arrange
      vi.spyOn(OneGovSgService, "isOneGovSgEnabled").mockReturnValue(false)

      // Act
      const result = await caller.isEnabled()

      // Assert
      expect(result).toBe(false)
    })
  })

  describe("login", () => {
    it("should throw 404 when one.gov.sg is not configured", async () => {
      // Arrange
      vi.spyOn(OneGovSgService, "isOneGovSgEnabled").mockReturnValue(false)

      // Act
      const result = caller.login({})

      // Assert
      await expect(result).rejects.toThrow(new TRPCError({ code: "NOT_FOUND" }))
    })

    it("should store the transaction and return the authorization URL", async () => {
      // Act
      const result = await caller.login({})

      // Assert
      expect(result).toEqual({
        redirectUrl: TEST_AUTHORIZATION_URL,
        isLoggedIn: false,
      })
      expect(session.oneGovSg?.sessionState?.state).toBe("state")
    })

    it("should record the pending login server-side", async () => {
      // Act
      await caller.login({})

      // Assert
      const pendingLogin = await db
        .selectFrom("VerificationToken")
        .selectAll()
        .where("identifier", "=", PENDING_LOGIN_IDENTIFIER)
        .executeTakeFirst()
      expect(pendingLogin).toBeDefined()
    })

    it("should reject a launcher login from an unknown issuer", async () => {
      // Act
      const result = caller.login({ iss: "https://evil.example" })

      // Assert
      await expect(result).rejects.toThrow(
        new TRPCError({
          code: "BAD_REQUEST",
          message: "Invalid one.gov.sg issuer",
        }),
      )
      expect(OneGovSgService.getAuthorizationUrl).not.toHaveBeenCalled()
    })

    it("should send a launcher login with a live session to the dashboard", async () => {
      // Arrange
      const user = await setupUser({ email: TEST_VALID_EMAIL })
      session.userId = user.id as NonNullable<SessionData["userId"]>

      // Act
      const result = await caller.login({ iss: env.ONE_GOV_SG_ISSUER })

      // Assert
      expect(result).toEqual({ redirectUrl: DASHBOARD, isLoggedIn: true })
      expect(OneGovSgService.getAuthorizationUrl).not.toHaveBeenCalled()
    })

    it("should start one.gov.sg when the session user is deleted", async () => {
      // Arrange
      const user = await setupUser({
        email: TEST_VALID_EMAIL,
        isDeleted: true,
      })
      session.userId = user.id as NonNullable<SessionData["userId"]>

      // Act
      const result = await caller.login({ iss: env.ONE_GOV_SG_ISSUER })

      // Assert
      expect(result.redirectUrl).toBe(TEST_AUTHORIZATION_URL)
      expect(session.userId).toBeUndefined()
    })
  })

  describe("callback", () => {
    const callbackInput = {
      code: "code",
      state: "state",
      iss: env.ONE_GOV_SG_ISSUER,
    }

    beforeEach(async () => {
      session.oneGovSg = { sessionState: createSessionState() }
      await db
        .insertInto("VerificationToken")
        .values({
          identifier: PENDING_LOGIN_IDENTIFIER,
          token: "",
          expires: new Date(Date.now() + 60 * 1000),
        })
        .execute()
    })

    it("should not exchange a callback replayed with the original cookie", async () => {
      // Arrange
      vi.spyOn(growthbookLib, "getIsSingpassEnabled").mockReturnValue(true)
      const replayedSession = applySession()
      replayedSession.oneGovSg = { sessionState: createSessionState() }
      const replayCaller = createCaller(createMockRequest(replayedSession))
      await caller.callback(callbackInput)

      // Act
      const result = replayCaller.callback({ ...callbackInput, code: "other" })

      // Assert
      await expect(result).rejects.toThrow(INVALID_LOGIN_FLOW)
      expect(OneGovSgService.exchangeCode).toHaveBeenCalledTimes(1)
    })

    it("should throw if no login is in progress", async () => {
      // Arrange
      session.oneGovSg = undefined

      // Act
      const result = caller.callback(callbackInput)

      // Assert
      await expect(result).rejects.toThrow(INVALID_LOGIN_FLOW)
      expect(OneGovSgService.exchangeCode).not.toHaveBeenCalled()
    })

    it("should throw if the transaction has expired", async () => {
      // Arrange
      session.oneGovSg = {
        sessionState: { ...createSessionState(), expiresAt: Date.now() - 1 },
      }

      // Act
      const result = caller.callback(callbackInput)

      // Assert
      await expect(result).rejects.toThrow(INVALID_LOGIN_FLOW)
      expect(OneGovSgService.exchangeCode).not.toHaveBeenCalled()
    })

    it("should keep the pending login when state does not match", async () => {
      // Act
      const result = caller.callback({ ...callbackInput, state: "forged" })

      // Assert
      await expect(result).rejects.toThrow(INVALID_LOGIN_FLOW)
      expect(session.oneGovSg?.sessionState).toBeDefined()
      expect(OneGovSgService.exchangeCode).not.toHaveBeenCalled()
    })

    it("should keep the pending login when iss does not match", async () => {
      // Act
      const result = caller.callback({
        ...callbackInput,
        iss: "https://one.gov.sg",
      })

      // Assert
      await expect(result).rejects.toThrow(INVALID_LOGIN_FLOW)
      expect(session.oneGovSg?.sessionState).toBeDefined()
      expect(OneGovSgService.exchangeCode).not.toHaveBeenCalled()
    })

    it("should consume the login without exchanging when one.gov.sg returns an error", async () => {
      // Act
      const result = caller.callback({
        state: "state",
        iss: env.ONE_GOV_SG_ISSUER,
        error: "access_denied",
      })

      // Assert
      await expect(result).rejects.toThrow(
        new TRPCError({
          code: "BAD_REQUEST",
          message: "one.gov.sg login failed",
        }),
      )
      expect(session.oneGovSg).toBeUndefined()
      expect(OneGovSgService.exchangeCode).not.toHaveBeenCalled()
    })

    it("should throw 500 when the exchange fails", async () => {
      // Arrange
      vi.spyOn(OneGovSgService, "exchangeCode").mockRejectedValue(
        new Error("nonce mismatch"),
      )

      // Act
      const result = caller.callback(callbackInput)

      // Assert
      await expect(result).rejects.toMatchObject({
        code: "INTERNAL_SERVER_ERROR",
        message: "one.gov.sg login failed",
      })
      expect(session.oneGovSg).toBeUndefined()
    })

    it("should throw 401 and not provision if the email is not whitelisted", async () => {
      // Arrange
      vi.spyOn(OneGovSgService, "exchangeCode").mockResolvedValue(
        "outsider@example.com",
      )

      // Act
      const result = caller.callback(callbackInput)

      // Assert
      await expect(result).rejects.toThrow(
        new TRPCError({
          code: "UNAUTHORIZED",
          message: "Email address is not whitelisted",
        }),
      )
      const user = await db
        .selectFrom("User")
        .where("email", "=", "outsider@example.com")
        .executeTakeFirst()
      expect(user).toBeUndefined()
    })

    describe("when singpass is enabled", () => {
      beforeEach(() => {
        vi.spyOn(growthbookLib, "getIsSingpassEnabled").mockReturnValue(true)
      })

      it("should create the user and hand off to Singpass", async () => {
        // Act
        const result = await caller.callback(callbackInput)

        // Assert
        const user = await db
          .selectFrom("User")
          .selectAll()
          .where("email", "=", TEST_VALID_EMAIL)
          .executeTakeFirstOrThrow()
        expect(result).toEqual({
          redirectUrl: SIGN_IN_SINGPASS,
          isLoggedIn: false,
        })
        expect(session.userId).toBeUndefined()
        expect(session.oneGovSg).toBeUndefined()
        expect(session.singpass?.sessionState).toEqual({
          userId: user.id,
          verificationToken: TEST_LOGIN_ATTEMPT,
        })
      })
    })

    describe("when singpass is not enabled", () => {
      beforeEach(() => {
        vi.spyOn(growthbookLib, "getIsSingpassEnabled").mockReturnValue(false)
        vi.spyOn(
          growthbookLib,
          "getIsSingpassDisabledInNonPreview",
        ).mockReturnValue(true)
      })

      it("should log the user in and record the one.gov.sg login", async () => {
        // Arrange
        const alertSpy = vi
          .spyOn(mailService, "sendLoginAlertEmail")
          .mockResolvedValue()

        // Act
        const result = await caller.callback(callbackInput)

        // Assert
        const user = await db
          .selectFrom("User")
          .selectAll()
          .where("email", "=", TEST_VALID_EMAIL)
          .executeTakeFirstOrThrow()
        const auditLog = await db
          .selectFrom("AuditLog")
          .selectAll()
          .where("eventType", "=", AuditLogEvent.Login)
          .executeTakeFirstOrThrow()
        expect(result).toEqual({ redirectUrl: DASHBOARD, isLoggedIn: true })
        expect(session.userId).toBe(user.id)
        expect(user.lastLoginAt).not.toBeNull()
        expect(auditLog.userId).toBe(user.id)
        expect(auditLog.delta).toEqual({
          before: TEST_LOGIN_ATTEMPT,
          after: null,
        })
        expect(alertSpy).toHaveBeenCalledWith({
          recipientEmail: TEST_VALID_EMAIL,
        })
      })
    })
  })
})
