import type { SessionData } from "~/lib/types/session"
import { TRPCError } from "@trpc/server"
import { resetTables } from "tests/integration/helpers/db"
import {
  applySession,
  createMockRequest,
} from "tests/integration/helpers/iron-session"
import { setupUser, setUpWhitelist } from "tests/integration/helpers/seed"
import { expect, vi } from "vitest"
import { env } from "~/env.mjs"
import { db } from "~/server/modules/database/database"
import { AuditLogEvent } from "~/server/modules/database/types"
import { createCallerFactory } from "~/server/trpc"
import {
  hasNonEmptyString,
  isDefinedNumber,
  isNullableBooleanTrue,
} from "~/utils/truthiness"

import { singpassRouter } from "../singpass.router"
import * as SingpassService from "../singpass.service"

const createCaller = createCallerFactory(singpassRouter)
const TEST_VALID_EMAIL = "test@open.gov.sg"
const MOCK_ORIGINAL_UUID = "2625dd66-2cbb-414b-a136-f62bb516653c"
const MOCK_SINGPASS_UUID = "beef6054-985f-4073-ae91-cd61552e2a7d"

type SingpassSessionUserId = NonNullable<
  NonNullable<SessionData["singpass"]>["sessionState"]
>["userId"]

const asSingpassSessionUserId = (userId: string): SingpassSessionUserId =>
  // SAFETY: singpass session fixtures use persisted user id strings from test seeds
  userId as SingpassSessionUserId

const emptyVerificationToken = () =>
  // SAFETY: getUserProps only needs sessionState.userId; other fields are unused in these tests
  ({}) as never

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
      const result = caller.login({ landingUrl: "http://localhost" })

      // Assert
      await expect(result).rejects.toThrow(
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
          codeVerifier: "code-verifier",
          nonce: "nonce",
          userId: asSingpassSessionUserId("test-user-id"),
          verificationToken,
        },
      }
      await session.save()

      // Act
      const result = await caller.login({
        landingUrl: "http://localhost",
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
      await expect(result).rejects.toThrow(
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
          codeVerifier: "code-verifier",
          nonce: "nonce",
          userId: asSingpassSessionUserId("non-existent-user-id"),
          verificationToken: emptyVerificationToken(),
        },
      }
      await session.save()

      // Act
      const result = caller.getUserProps()

      // Assert
      await expect(result).rejects.toThrow(
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
          codeVerifier: "code-verifier",
          nonce: "nonce",
          userId: asSingpassSessionUserId(user.id),
          verificationToken: emptyVerificationToken(),
        },
      }
      await session.save()

      // Act
      const result = await caller.getUserProps()

      // Assert
      expect(result).toEqual({
        isNewUser: !user.singpassUuid,
        name: user.name || user.email,
      })
    })
  })

  describe("callback", () => {
    it("should throw if no session state is found", async () => {
      // Act
      const result = caller.callback({
        code: "code",
        state: "state",
      })

      // Assert
      await expect(result).rejects.toThrow(
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
          codeVerifier: "code-verifier",
          nonce: "nonce",
          userId: asSingpassSessionUserId("user-id"),
          verificationToken: emptyVerificationToken(),
        },
      }
      await session.save()

      vi.spyOn(SingpassService, "login").mockResolvedValue({
        uuid: undefined,
      })

      // Assert
      await expect(
        caller.callback({
          code: "code",
          state: JSON.stringify({ state: expect.any(String) }),
        }),
      ).rejects.toThrow(
        new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Singpass login failed",
        }),
      )
    })

    it("should throw NOT_FOUND if the user's UUID from Singpass does not match the one stored in the database", async () => {
      // Arrange
      const user = await db
        .updateTable("User")
        .set({ singpassUuid: MOCK_ORIGINAL_UUID })
        .where("email", "=", TEST_VALID_EMAIL)
        .returningAll()
        .executeTakeFirstOrThrow()
      session.singpass = {
        sessionState: {
          codeVerifier: "code-verifier",
          nonce: "nonce",
          userId: asSingpassSessionUserId(user.id),
          verificationToken: emptyVerificationToken(),
        },
      }
      await session.save()

      vi.spyOn(SingpassService, "login").mockResolvedValue({
        uuid: MOCK_SINGPASS_UUID,
      })

      // Assert
      await expect(
        caller.callback({
          code: "code",
          state: JSON.stringify({ state: expect.any(String) }),
        }),
      ).rejects.toThrow(
        new TRPCError({
          code: "NOT_FOUND",
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
          codeVerifier: "code-verifier",
          nonce: "nonce",
          userId: asSingpassSessionUserId(user.id),
          verificationToken: emptyVerificationToken(),
        },
      }
      await session.save()

      vi.spyOn(SingpassService, "login").mockResolvedValue({
        uuid: MOCK_SINGPASS_UUID,
      })

      // Act
      await caller.callback({
        code: "code",
        state: JSON.stringify({ state: expect.any(String) }),
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
          delta: {
            after: expect.objectContaining({
              singpassUuid: MOCK_SINGPASS_UUID,
            }),
            before: expect.objectContaining({ singpassUuid: null }),
          },
          eventType: AuditLogEvent.UserUpdate,
        }),
        expect.objectContaining({
          delta: {
            after: null,
            before: { attempts: null },
          },
          eventType: AuditLogEvent.Login,
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
          codeVerifier: "code-verifier",
          nonce: "nonce",
          userId: asSingpassSessionUserId(user.id),
          verificationToken: emptyVerificationToken(),
        },
      }
      await session.save()

      vi.spyOn(SingpassService, "login").mockResolvedValue({
        uuid: MOCK_SINGPASS_UUID,
      })

      // Act
      await caller.callback({
        code: "code",
        state: JSON.stringify({ state: expect.any(String) }),
      })

      // Assert
      const auditLogs = await db.selectFrom("AuditLog").selectAll().execute()
      expect(auditLogs).toHaveLength(1)
      expect(auditLogs).toEqual([
        expect.objectContaining({
          delta: {
            after: null,
            before: { attempts: null },
          },
          eventType: AuditLogEvent.Login,
        }),
      ])
    })
  })
})
