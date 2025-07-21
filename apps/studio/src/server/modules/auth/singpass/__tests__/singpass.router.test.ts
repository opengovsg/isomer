import { TRPCError } from "@trpc/server"
import { resetTables } from "tests/integration/helpers/db"
import {
  applySession,
  createMockRequest,
} from "tests/integration/helpers/iron-session"
import { setupUser, setUpWhitelist } from "tests/integration/helpers/seed"
import { expect, vi } from "vitest"

import type { SessionData } from "~/lib/types/session"
import { env } from "~/env.mjs"
import { AuditLogEvent, db } from "~/server/modules/database"
import { createCallerFactory } from "~/server/trpc"
import { singpassRouter } from "../singpass.router"
import * as SingpassService from "../singpass.service"

const createCaller = createCallerFactory(singpassRouter)
const TEST_VALID_EMAIL = "test@open.gov.sg"
const MOCK_ORIGINAL_UUID = "2625dd66-2cbb-414b-a136-f62bb516653c"
const MOCK_SINGPASS_UUID = "beef6054-985f-4073-ae91-cd61552e2a7d"

describe("auth.singpass", () => {
  let caller: ReturnType<typeof createCaller>
  let session: ReturnType<typeof applySession>

  beforeEach(async () => {
    await resetTables("AuditLog", "User", "VerificationToken", "Whitelist")
    await setUpWhitelist({ email: TEST_VALID_EMAIL })
    await setupUser({ email: TEST_VALID_EMAIL })
    session = applySession()
    caller = createCaller(createMockRequest(session))
    vi.clearAllMocks()
  })

  describe("login", () => {
    it("should throw if email verification has not been completed", async () => {
      // Act
      const result = caller.login({ landingUrl: new URL("http://localhost") })

      // Assert
      await expect(result).rejects.toThrowError(
        new TRPCError({
          code: "BAD_REQUEST",
          message: "Email verification has not been completed",
        }),
      )
    })

    it("should return redirectUrl if login is successful", async () => {
      // Arrange
      const verificationToken = await db
        .insertInto("VerificationToken")
        .values({
          expires: new Date(Date.now() + env.OTP_EXPIRY * 1000),
          identifier: "identifier",
          token: "token",
        })
        .returningAll()
        .executeTakeFirstOrThrow()

      session.singpass = {
        sessionState: {
          userId: "test-user-id" as NonNullable<
            NonNullable<SessionData["singpass"]>["sessionState"]
          >["userId"],
          verificationToken,
          codeVerifier: "code-verifier",
          nonce: "nonce",
        },
      }
      await session.save()

      // Act
      const result = await caller.login({
        landingUrl: new URL("http://localhost"),
      })

      // Assert
      expect(result).toHaveProperty("redirectUrl")
    })
  })

  describe("getUserProps", () => {
    it("should throw if no session state is found", async () => {
      // Act
      const result = caller.getUserProps()

      // Assert
      await expect(result).rejects.toThrowError(
        new TRPCError({
          code: "BAD_REQUEST",
          message: "Invalid login flow",
        }),
      )
    })

    it("should throw if user is not found", async () => {
      // Arrange
      session.singpass = {
        sessionState: {
          userId: "non-existent-user-id" as NonNullable<
            NonNullable<SessionData["singpass"]>["sessionState"]
          >["userId"],
          verificationToken: {} as never,
          codeVerifier: "code-verifier",
          nonce: "nonce",
        },
      }
      await session.save()

      // Act
      const result = caller.getUserProps()

      // Assert
      await expect(result).rejects.toThrowError(
        new TRPCError({ code: "NOT_FOUND", message: "User not found" }),
      )
    })

    it("should return name and isNewUser if session state is found", async () => {
      // Arrange
      const user = await db
        .selectFrom("User")
        .where("email", "=", TEST_VALID_EMAIL)
        .selectAll()
        .executeTakeFirstOrThrow()
      session.singpass = {
        sessionState: {
          userId: user.id as NonNullable<
            NonNullable<SessionData["singpass"]>["sessionState"]
          >["userId"],
          verificationToken: {} as never,
          codeVerifier: "code-verifier",
          nonce: "nonce",
        },
      }
      await session.save()

      // Act
      const result = await caller.getUserProps()

      // Assert
      expect(result).toEqual({
        name: user.name || user.email,
        isNewUser: !user.singpassUuid,
      })
    })
  })

  describe("callback", () => {
    it("should throw if no session state is found", async () => {
      // Act
      const result = caller.callback({
        state: "state",
        code: "code",
      })

      // Assert
      await expect(result).rejects.toThrowError(
        new TRPCError({
          code: "BAD_REQUEST",
          message: "Invalid login flow",
        }),
      )
    })

    it("should throw if the Singpass UUID cannot be extracted", async () => {
      // Arrange
      session.singpass = {
        sessionState: {
          userId: "user-id" as NonNullable<
            NonNullable<SessionData["singpass"]>["sessionState"]
          >["userId"],
          verificationToken: {} as never,
          codeVerifier: "code-verifier",
          nonce: "nonce",
        },
      }
      await session.save()

      vi.spyOn(SingpassService, "login").mockResolvedValue({
        uuid: undefined,
      })

      // Assert
      await expect(
        caller.callback({
          state: JSON.stringify({ state: expect.any(String) }),
          code: "code",
        }),
      ).rejects.toThrowError(
        new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Singpass login failed",
        }),
      )
    })

    it("should throw an error if the user's UUID from Singpass does not match the one stored in the database", async () => {
      // Arrange
      const user = await db
        .updateTable("User")
        .set({ singpassUuid: MOCK_ORIGINAL_UUID })
        .where("email", "=", TEST_VALID_EMAIL)
        .returningAll()
        .executeTakeFirstOrThrow()
      session.singpass = {
        sessionState: {
          userId: user.id as NonNullable<
            NonNullable<SessionData["singpass"]>["sessionState"]
          >["userId"],
          verificationToken: {} as never,
          codeVerifier: "code-verifier",
          nonce: "nonce",
        },
      }
      await session.save()

      vi.spyOn(SingpassService, "login").mockResolvedValue({
        uuid: MOCK_SINGPASS_UUID,
      })

      // Assert
      await expect(
        caller.callback({
          state: JSON.stringify({ state: expect.any(String) }),
          code: "code",
        }),
      ).rejects.toThrowError(
        new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Singpass profile does not match user",
        }),
      )
    })

    it("should store the user's Singpass UUID in the database if it is the first-time login", async () => {
      // Arrange
      const user = await db
        .updateTable("User")
        .set({ singpassUuid: null })
        .where("email", "=", TEST_VALID_EMAIL)
        .returningAll()
        .executeTakeFirstOrThrow()
      session.singpass = {
        sessionState: {
          userId: user.id as NonNullable<
            NonNullable<SessionData["singpass"]>["sessionState"]
          >["userId"],
          verificationToken: {} as never,
          codeVerifier: "code-verifier",
          nonce: "nonce",
        },
      }
      await session.save()

      vi.spyOn(SingpassService, "login").mockResolvedValue({
        uuid: MOCK_SINGPASS_UUID,
      })

      // Act
      await caller.callback({
        state: JSON.stringify({ state: expect.any(String) }),
        code: "code",
      })

      // Assert
      const updatedUser = await db
        .selectFrom("User")
        .selectAll()
        .where("email", "=", TEST_VALID_EMAIL)
        .executeTakeFirstOrThrow()
      expect(updatedUser.singpassUuid).toEqual(MOCK_SINGPASS_UUID)
      // Audit log should have been created
      const auditLogs = await db.selectFrom("AuditLog").selectAll().execute()
      expect(auditLogs).toHaveLength(2)
      expect(auditLogs).toEqual([
        expect.objectContaining({
          eventType: AuditLogEvent.UserUpdate,
          delta: {
            before: expect.objectContaining({ singpassUuid: null }),
            after: expect.objectContaining({
              singpassUuid: MOCK_SINGPASS_UUID,
            }),
          },
        }),
        expect.objectContaining({
          eventType: AuditLogEvent.Login,
          delta: {
            before: { attempts: null },
            after: null,
          },
        }),
      ])
    })

    it("should record the user's login audit log upon successful authentication", async () => {
      // Arrange
      const user = await db
        .updateTable("User")
        .set({ singpassUuid: MOCK_SINGPASS_UUID })
        .where("email", "=", TEST_VALID_EMAIL)
        .returningAll()
        .executeTakeFirstOrThrow()
      session.singpass = {
        sessionState: {
          userId: user.id as NonNullable<
            NonNullable<SessionData["singpass"]>["sessionState"]
          >["userId"],
          verificationToken: {} as never,
          codeVerifier: "code-verifier",
          nonce: "nonce",
        },
      }
      await session.save()

      vi.spyOn(SingpassService, "login").mockResolvedValue({
        uuid: MOCK_SINGPASS_UUID,
      })

      // Act
      await caller.callback({
        state: JSON.stringify({ state: expect.any(String) }),
        code: "code",
      })

      // Assert
      const auditLogs = await db.selectFrom("AuditLog").selectAll().execute()
      expect(auditLogs).toHaveLength(1)
      expect(auditLogs).toEqual([
        expect.objectContaining({
          eventType: AuditLogEvent.Login,
          delta: {
            before: { attempts: null },
            after: null,
          },
        }),
      ])
    })
  })
})
