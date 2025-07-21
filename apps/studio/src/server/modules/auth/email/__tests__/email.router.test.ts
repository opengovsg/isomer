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
import * as mailLib from "~/lib/mail"
import { AuditLogEvent, db } from "~/server/modules/database"
import { prisma } from "~/server/prisma"
import { createCallerFactory } from "~/server/trpc"
import { createTokenHash } from "../../auth.util"
import { emailSessionRouter } from "../email.router"
import { getIpFingerprint, LOCALHOST } from "../utils"

const createCaller = createCallerFactory(emailSessionRouter)

describe("auth.email", () => {
  let caller: ReturnType<typeof createCaller>
  let session: ReturnType<typeof applySession>
  const TEST_VALID_EMAIL = "test@open.gov.sg"

  beforeEach(async () => {
    await resetTables("AuditLog", "User", "VerificationToken", "Whitelist")
    await setUpWhitelist({ email: TEST_VALID_EMAIL })
    session = applySession()
    const ctx = createMockRequest(session)
    caller = createCaller(ctx)
  })

  describe("login", () => {
    it("should throw 400 if email is not provided", async () => {
      // Act
      const result = caller.login({ email: "" })

      // Assert
      await expect(result).rejects.toThrowError(
        "Please sign in with a valid email address.",
      )
    })

    it("should throw 400 if email is invalid", async () => {
      // Act
      const result = caller.login({ email: "not-an-email" })

      // Assert
      await expect(result).rejects.toThrowError(
        "Please sign in with a valid email address.",
      )
    })

    it("should return email and a prefix if OTP is sent successfully", async () => {
      // Arrange
      const spy = vi.spyOn(mailLib, "sendMail")

      // Act
      const result = await caller.login({ email: TEST_VALID_EMAIL })

      // Assert
      const expectedReturn = {
        email: TEST_VALID_EMAIL,
        otpPrefix: expect.any(String),
      }
      expect(spy).toHaveBeenCalledWith({
        body: expect.stringContaining("Your OTP is"),
        recipient: TEST_VALID_EMAIL,
        subject: expect.stringContaining("Sign in to"),
      })
      expect(result).toEqual(expectedReturn)
    })

    it("should throw 401 if user is deleted", async () => {
      // Arrange
      await setupUser({
        name: "Deleted",
        userId: "deleted123",
        email: TEST_VALID_EMAIL,
        phone: "123",
        isDeleted: true,
      })

      // Act
      const result = caller.login({ email: TEST_VALID_EMAIL })

      // Assert
      await expect(result).rejects.toThrowError(
        new TRPCError({
          code: "UNAUTHORIZED",
          message: "Email address is not whitelisted",
        }),
      )
    })
  })

  describe("verifyOtp", () => {
    const VALID_OTP = "123456"
    const VALID_TOKEN_HASH = createTokenHash(VALID_OTP, TEST_VALID_EMAIL)
    const INVALID_OTP = "987643"
    const TEST_OTP_FINGERPRINT = getIpFingerprint(TEST_VALID_EMAIL, LOCALHOST)

    describe("when singpass is not enabled", () => {
      beforeEach(() => {
        vi.spyOn(growthbookLib, "getIsSingpassEnabled").mockReturnValue(false)
        caller = createCaller(createMockRequest(session))
      })

      afterEach(() => {
        vi.restoreAllMocks()
      })

      it("should successfully set session on first valid OTP", async () => {
        // Arrange
        await setupUser({ email: TEST_VALID_EMAIL })
        await prisma.verificationToken.create({
          data: {
            expires: new Date(Date.now() + env.OTP_EXPIRY * 1000),
            identifier: TEST_OTP_FINGERPRINT,
            token: VALID_TOKEN_HASH,
          },
        })

        // Act
        const result = caller.verifyOtp({
          email: TEST_VALID_EMAIL,
          token: VALID_OTP,
        })

        // Assert
        const expectedUser = {
          id: expect.any(String),
          email: TEST_VALID_EMAIL,
        }
        // Should return logged in user.
        await expect(result).resolves.toMatchObject(expectedUser)

        // Session should have been set with logged in user.
        expect(session.userId).toEqual(expectedUser.id)

        // Audit log should have been created.
        const auditLogs = await db.selectFrom("AuditLog").selectAll().execute()
        expect(auditLogs).toHaveLength(1)
        expect(auditLogs[0]?.eventType).toBe(AuditLogEvent.Login)
        expect(auditLogs[0]?.delta.before!.attempts).toBe(1)
      })

      it("should successfully set session on a subsequent valid OTP", async () => {
        // Arrange
        await setupUser({ email: TEST_VALID_EMAIL })
        await prisma.verificationToken.create({
          data: {
            expires: new Date(Date.now() + env.OTP_EXPIRY * 1000),
            identifier: TEST_OTP_FINGERPRINT,
            token: VALID_TOKEN_HASH,
          },
        })

        // Act
        await expect(
          caller.verifyOtp({
            email: TEST_VALID_EMAIL,
            token: INVALID_OTP,
          }),
        ).rejects.toThrowError()

        const result = caller.verifyOtp({
          email: TEST_VALID_EMAIL,
          token: VALID_OTP,
        })

        // Assert
        const expectedUser = {
          id: expect.any(String),
          email: TEST_VALID_EMAIL,
        }
        // Should return logged in user.
        await expect(result).resolves.toMatchObject(expectedUser)
        // Session should have been set with logged in user.
        expect(session.userId).toEqual(expectedUser.id)
        // Audit log should have been created.
        const auditLogs = await db.selectFrom("AuditLog").selectAll().execute()
        expect(auditLogs).toHaveLength(1)
        expect(auditLogs[0]?.eventType).toBe(AuditLogEvent.Login)
        expect(auditLogs[0]?.delta.before!.attempts).toBe(2)
      })

      it("should set lastLoginAt when creating a new user", async () => {
        // Arrange
        const beforeLogin = new Date()
        await prisma.verificationToken.create({
          data: {
            expires: new Date(Date.now() + env.OTP_EXPIRY * 1000),
            identifier: TEST_OTP_FINGERPRINT,
            token: VALID_TOKEN_HASH,
          },
        })

        // Act
        await caller.verifyOtp({
          email: TEST_VALID_EMAIL,
          token: VALID_OTP,
        })

        // Assert
        const user = await prisma.user.findFirst({
          where: { email: TEST_VALID_EMAIL },
        })
        expect(user?.lastLoginAt).toBeInstanceOf(Date)
        expect(user?.lastLoginAt!.getTime()).toBeGreaterThan(
          beforeLogin.getTime(),
        )
      })

      it("should update lastLoginAt when user logs in", async () => {
        // Arrange
        const beforeLogin = new Date()
        await prisma.verificationToken.create({
          data: {
            expires: new Date(Date.now() + env.OTP_EXPIRY * 1000),
            identifier: TEST_OTP_FINGERPRINT,
            token: VALID_TOKEN_HASH,
          },
        })
        // Create user first
        await prisma.user.create({
          data: {
            email: TEST_VALID_EMAIL,
            name: "Test User",
            phone: "",
            lastLoginAt: null,
          },
        })

        // Act
        await caller.verifyOtp({
          email: TEST_VALID_EMAIL,
          token: VALID_OTP,
        })

        // Assert
        const user = await prisma.user.findFirst({
          where: { email: TEST_VALID_EMAIL },
        })
        expect(user?.lastLoginAt).toBeInstanceOf(Date)
        expect(user?.lastLoginAt!.getTime()).toBeGreaterThan(
          beforeLogin.getTime(),
        )
      })

      it("should send login alert email", async () => {
        // Arrange
        const alertSpy = vi
          .spyOn(mailService, "sendLoginAlertEmail")
          .mockResolvedValue()
        await setupUser({ email: TEST_VALID_EMAIL })
        await prisma.verificationToken.create({
          data: {
            expires: new Date(Date.now() + env.OTP_EXPIRY * 1000),
            identifier: TEST_OTP_FINGERPRINT,
            token: VALID_TOKEN_HASH,
          },
        })

        // Act
        await caller.verifyOtp({
          email: TEST_VALID_EMAIL,
          token: VALID_OTP,
        })

        // Assert
        expect(alertSpy).toHaveBeenCalledWith({
          recipientEmail: TEST_VALID_EMAIL,
        })
      })
    })

    describe("when singpass is enabled", () => {
      it("should successfully set session on first valid OTP", async () => {
        // Arrange
        await setupUser({ email: TEST_VALID_EMAIL })
        await prisma.verificationToken.create({
          data: {
            expires: new Date(Date.now() + env.OTP_EXPIRY * 1000),
            identifier: TEST_OTP_FINGERPRINT,
            token: VALID_TOKEN_HASH,
          },
        })

        // Act
        const result = caller.verifyOtp({
          email: TEST_VALID_EMAIL,
          token: VALID_OTP,
        })

        // Assert
        const expectedUser = {
          id: expect.any(String),
          email: TEST_VALID_EMAIL,
        }
        // Should return logged in user.
        await expect(result).resolves.toMatchObject(expectedUser)

        // Session (singpass) should have been set with logged in user.
        expect(session.singpass?.sessionState?.userId).toEqual(expectedUser.id)

        // Audit log should not have been created yet
        const auditLogs = await db.selectFrom("AuditLog").selectAll().execute()
        expect(auditLogs).toHaveLength(0)
      })

      it("should successfully set session on a subsequent valid OTP", async () => {
        // Arrange
        await setupUser({ email: TEST_VALID_EMAIL })
        await prisma.verificationToken.create({
          data: {
            expires: new Date(Date.now() + env.OTP_EXPIRY * 1000),
            identifier: TEST_OTP_FINGERPRINT,
            token: VALID_TOKEN_HASH,
          },
        })

        // Act
        await expect(
          caller.verifyOtp({
            email: TEST_VALID_EMAIL,
            token: INVALID_OTP,
          }),
        ).rejects.toThrowError()

        const result = caller.verifyOtp({
          email: TEST_VALID_EMAIL,
          token: VALID_OTP,
        })

        // Assert
        const expectedUser = {
          id: expect.any(String),
          email: TEST_VALID_EMAIL,
        }
        // Should return logged in user.
        await expect(result).resolves.toMatchObject(expectedUser)

        // Session (singpass) should have been set with logged in user.
        expect(session.singpass?.sessionState?.userId).toEqual(expectedUser.id)

        // Audit log should not have been created yet
        const auditLogs = await db.selectFrom("AuditLog").selectAll().execute()
        expect(auditLogs).toHaveLength(0)
      })

      // Note: It's updated in Singpass's callback.
      it("should not set lastLoginAt when creating a new user", async () => {
        // Arrange
        await prisma.verificationToken.create({
          data: {
            expires: new Date(Date.now() + env.OTP_EXPIRY * 1000),
            identifier: TEST_OTP_FINGERPRINT,
            token: VALID_TOKEN_HASH,
          },
        })

        // Act
        await caller.verifyOtp({
          email: TEST_VALID_EMAIL,
          token: VALID_OTP,
        })

        // Assert
        const user = await prisma.user.findFirst({
          where: { email: TEST_VALID_EMAIL },
        })
        expect(user?.lastLoginAt).toBeNull()
      })

      // Note: It's updated in Singpass's callback.
      it("should not update lastLoginAt when user logs in", async () => {
        // Arrange
        await prisma.verificationToken.create({
          data: {
            expires: new Date(Date.now() + env.OTP_EXPIRY * 1000),
            identifier: TEST_OTP_FINGERPRINT,
            token: VALID_TOKEN_HASH,
          },
        })
        // Create user first
        await prisma.user.create({
          data: {
            email: TEST_VALID_EMAIL,
            name: "Test User",
            phone: "",
            lastLoginAt: null,
          },
        })

        // Act
        await caller.verifyOtp({
          email: TEST_VALID_EMAIL,
          token: VALID_OTP,
        })

        // Assert
        const user = await prisma.user.findFirst({
          where: { email: TEST_VALID_EMAIL },
        })
        expect(user?.lastLoginAt).toBeNull()
      })

      // Note: it's only sent in singpass downtime
      it("should not send login alert email", async () => {
        // Arrange
        const alertSpy = vi
          .spyOn(mailService, "sendLoginAlertEmail")
          .mockResolvedValue()
        await setupUser({ email: TEST_VALID_EMAIL })
        await prisma.verificationToken.create({
          data: {
            expires: new Date(Date.now() + env.OTP_EXPIRY * 1000),
            identifier: TEST_OTP_FINGERPRINT,
            token: VALID_TOKEN_HASH,
          },
        })

        // Act
        await caller.verifyOtp({
          email: TEST_VALID_EMAIL,
          token: VALID_OTP,
        })

        // Assert
        expect(alertSpy).not.toHaveBeenCalled()
      })
    })

    it("should throw 400 if OTP is not found", async () => {
      // Act
      const result = caller.verifyOtp({
        email: TEST_VALID_EMAIL,
        // Not created yet.
        token: INVALID_OTP,
      })

      // Assert
      await expect(result).rejects.toThrowError(
        new TRPCError({
          code: "BAD_REQUEST",
          message: "Please request for another OTP",
        }),
      )
      await expect(
        db.selectFrom("AuditLog").selectAll().execute(),
      ).resolves.toHaveLength(0)
    })

    it("should throw 400 if OTP is invalid", async () => {
      // Arrange
      await prisma.verificationToken.create({
        data: {
          expires: new Date(Date.now() + env.OTP_EXPIRY * 1000),
          identifier: TEST_OTP_FINGERPRINT,
          token: VALID_TOKEN_HASH,
        },
      })

      // Act
      const result = caller.verifyOtp({
        email: TEST_VALID_EMAIL,
        // OTP does not match email record.
        token: INVALID_OTP,
      })

      // Assert
      await expect(result).rejects.toThrowError(
        new TRPCError({
          code: "BAD_REQUEST",
          message: "Token is invalid or has expired",
        }),
      )
      await expect(
        db.selectFrom("AuditLog").selectAll().execute(),
      ).resolves.toHaveLength(0)
    })

    it("should throw 400 if OTP is expired", async () => {
      // Arrange
      await prisma.verificationToken.create({
        data: {
          expires: new Date(Date.now() - 1000),
          identifier: TEST_OTP_FINGERPRINT,
          token: VALID_TOKEN_HASH,
        },
      })

      // Act
      const result = caller.verifyOtp({
        email: TEST_VALID_EMAIL,
        token: VALID_OTP,
      })

      // Assert
      await expect(result).rejects.toThrowError(
        new TRPCError({
          code: "BAD_REQUEST",
          message: "Token is invalid or has expired",
        }),
      )
      await expect(
        db.selectFrom("AuditLog").selectAll().execute(),
      ).resolves.toHaveLength(0)
    })

    it("should throw 400 if max verification attempts has been reached", async () => {
      // Arrange
      await prisma.verificationToken.create({
        data: {
          expires: new Date(Date.now() + env.OTP_EXPIRY * 1000),
          identifier: TEST_OTP_FINGERPRINT,
          token: VALID_TOKEN_HASH,
          attempts: 6, // Currently hardcoded to 5 attempts.
        },
      })

      // Act
      const result = caller.verifyOtp({
        email: TEST_VALID_EMAIL,
        token: VALID_OTP,
      })

      // Assert
      await expect(result).rejects.toThrowError(
        new TRPCError({
          code: "BAD_REQUEST",
          message: "Too many attempts",
        }),
      )
      await expect(
        db.selectFrom("AuditLog").selectAll().execute(),
      ).resolves.toHaveLength(0)
    })
  })
})
