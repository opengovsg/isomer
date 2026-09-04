import { TRPCError } from "@trpc/server"
import { omit } from "lodash-es"
import { resetTables } from "tests/integration/helpers/db"
import {
  setupAdminPermissions,
  setupSite,
  setupUser,
  setUpWhitelist,
} from "tests/integration/helpers/seed"
import { beforeAll, beforeEach, describe, expect, it } from "vitest"
import { db } from "~/server/modules/database"
import { RoleType } from "~prisma/generated/generatedEnums"

import { createUserWithPermission, isUserDeleted } from "../user.service"

describe("user.service", () => {
  describe(isUserDeleted, () => {
    beforeAll(async () => {
      await resetTables("User")
    })

    it("should return false if user is not deleted", async () => {
      // Arrange
      const email = "active@example.com"
      // Setup active user
      await setupUser({
        email: email,
        isDeleted: false,
      })

      // Act
      const result = await isUserDeleted(email)
      // Assert
      expect(result).toBe(false)
    })

    it("should return true if user is deleted", async () => {
      // Arrange
      const email = "deleted@example.com"
      // Setup deleted user
      await setupUser({
        email: email,
        isDeleted: true,
      })

      // Act
      const result = await isUserDeleted(email)
      // Assert
      expect(result).toBe(true)
    })
  })

  describe(createUserWithPermission, () => {
    const TEST_EMAIL = "test@open.gov.sg"
    let siteId: number
    let creatorUserId: string

    beforeAll(async () => {
      await setUpWhitelist({ email: TEST_EMAIL })
    })

    beforeEach(async () => {
      await resetTables("User", "ResourcePermission", "Site", "AuditLog")
      const { site } = await setupSite()
      siteId = site.id

      const creator = await setupUser({
        name: "creator",
        email: "creator@open.gov.sg",
        isDeleted: false,
      })
      creatorUserId = creator.id
    })

    it("should throw error if email is invalid", async () => {
      // Act
      const result = db.transaction().execute((tx) => {
        return createUserWithPermission({
          byUserId: creatorUserId,
          email: "invalid-email",
          role: RoleType.Editor,
          siteId,
          tx,
        })
      })
      // Assert
      await expect(result).rejects.toThrow(
        new TRPCError({
          code: "BAD_REQUEST",
          message: "Invalid email",
        }),
      )

      // Assert DB - audit logs
      const auditLogs = await db.selectFrom("AuditLog").selectAll().execute()
      expect(auditLogs).toHaveLength(0)
    })

    it("should throw error if site does not exist", async () => {
      // Act
      const result = db.transaction().execute((tx) => {
        return createUserWithPermission({
          byUserId: creatorUserId,
          email: TEST_EMAIL,
          role: RoleType.Editor,
          siteId: 9999,
          tx,
        })
      })

      // Assert
      await expect(result).rejects.toThrow(/./)

      // Assert DB - audit logs
      const auditLogs = await db.selectFrom("AuditLog").selectAll().execute()
      expect(auditLogs).toHaveLength(0)
    })

    it("should throw error if both user and permission already exists", async () => {
      // Arrange
      const user = await setupUser({ email: TEST_EMAIL, isDeleted: false })
      await setupAdminPermissions({ userId: user.id, siteId })

      // Act

      const result = db.transaction().execute((tx) => {
        return createUserWithPermission({
          byUserId: creatorUserId,
          email: TEST_EMAIL,
          role: RoleType.Editor,
          siteId,
          tx,
        })
      })
      // Assert
      await expect(result).rejects.toThrow(
        new TRPCError({
          code: "CONFLICT",
          message: "User already has permission for this site",
        }),
      )

      // Assert DB - audit logs
      const auditLogs = await db.selectFrom("AuditLog").selectAll().execute()
      expect(auditLogs).toHaveLength(0)
    })

    describe("should create user if user already exists but has non-null deletedAt", () => {
      const roleToCreate = RoleType.Editor
      let createdUser: Awaited<
        ReturnType<typeof createUserWithPermission>
      >["user"]
      let resourcePermission: Awaited<
        ReturnType<typeof createUserWithPermission>
      >["resourcePermission"]
      let originalUserId: string
      let dbUserResult: Awaited<
        ReturnType<
          ReturnType<typeof db.selectFrom<"User">>["execute"]
        >
      >
      let dbResourcePermissionResult: Awaited<
        ReturnType<
          ReturnType<typeof db.selectFrom<"ResourcePermission">>["execute"]
        >
      >
      let userAuditLogs: Awaited<
        ReturnType<
          ReturnType<typeof db.selectFrom<"AuditLog">>["execute"]
        >
      >
      let permissionAuditLogs: Awaited<
        ReturnType<
          ReturnType<typeof db.selectFrom<"AuditLog">>["execute"]
        >
      >

      beforeEach(async () => {
        const user = await setupUser({ email: TEST_EMAIL, isDeleted: true })
        originalUserId = user.id
        await setupAdminPermissions({ userId: user.id, siteId })

        const result = await db.transaction().execute((tx) => {
          return createUserWithPermission({
            byUserId: creatorUserId,
            email: TEST_EMAIL,
            role: roleToCreate,
            siteId,
            tx,
          })
        })
        createdUser = result.user
        resourcePermission = result.resourcePermission

        dbUserResult = await db
          .selectFrom("User")
          .where("email", "=", TEST_EMAIL)
          .selectAll()
          .execute()
        dbResourcePermissionResult = await db
          .selectFrom("ResourcePermission")
          .where("userId", "=", createdUser.id)
          .where("siteId", "=", siteId)
          .selectAll()
          .execute()
        userAuditLogs = await db
          .selectFrom("AuditLog")
          .where("eventType", "=", "UserCreate")
          .selectAll()
          .execute()
        permissionAuditLogs = await db
          .selectFrom("AuditLog")
          .where("eventType", "=", "PermissionCreate")
          .selectAll()
          .execute()
      })

      it("should create a new user record alongside the deleted one", () => {
        expect(dbUserResult).toHaveLength(2)
        expect(dbUserResult).toStrictEqual([
          expect.objectContaining({
            email: TEST_EMAIL,
            id: originalUserId,
            deletedAt: expect.any(Date),
          }),
          expect.objectContaining({
            email: TEST_EMAIL,
            id: expect.any(String),
            deletedAt: null,
          }),
        ])
      })

      it("should create resource permission for the new user", () => {
        expect(dbResourcePermissionResult).toHaveLength(1)
        expect(dbResourcePermissionResult).toStrictEqual([
          expect.objectContaining({
            userId: expect.any(String),
            siteId,
            role: roleToCreate,
          }),
        ])
      })

      it("should create a UserCreate audit log", () => {
        expect(userAuditLogs).toHaveLength(1)
        expect(userAuditLogs[0]).toMatchObject({
          eventType: "UserCreate",
          delta: expect.objectContaining({
            before: null,
            after: expect.objectContaining({
              id: createdUser.id,
              email: TEST_EMAIL,
            }),
          }),
        })
      })

      it("should create a PermissionCreate audit log", () => {
        expect(permissionAuditLogs).toHaveLength(1)
        expect(permissionAuditLogs[0]).toMatchObject({
          eventType: "PermissionCreate",
          delta: expect.objectContaining({
            before: null,
            after: expect.objectContaining(
              omit(resourcePermission, ["createdAt", "updatedAt"]),
            ),
          }),
        })
      })
    })

    it("should throw 403 if creating a non-whitelisted non-gov.sg email with any role", async () => {
      // Arrange
      const nonGovSgEmail = "test@coolvendor.com"

      // Act
      const result = db.transaction().execute((tx) => {
        return createUserWithPermission({
          byUserId: creatorUserId,
          email: nonGovSgEmail,
          role: RoleType.Editor,
          siteId,
          tx,
        })
      })
      // Assert
      await expect(result).rejects.toThrow(
        new TRPCError({
          code: "FORBIDDEN",
          message: "There are non-gov.sg domains that need to be whitelisted.",
        }),
      )

      // Assert DB - audit logs
      const auditLogs = await db.selectFrom("AuditLog").selectAll().execute()
      expect(auditLogs).toHaveLength(0)
    })

    it("should throw 403 if assigning a non-whitelisted non-gov.sg email with admin role", async () => {
      // Arrange
      const nonGovSgEmail = "test@coolvendor.com"

      // Act
      const result = db.transaction().execute((tx) => {
        return createUserWithPermission({
          byUserId: creatorUserId,
          email: nonGovSgEmail,
          role: RoleType.Admin,
          siteId,
          tx,
        })
      })

      // Assert
      await expect(result).rejects.toThrow(
        new TRPCError({
          code: "FORBIDDEN",
          message: "There are non-gov.sg domains that need to be whitelisted.",
        }),
      )

      // Assert DB - audit logs
      const auditLogs = await db.selectFrom("AuditLog").selectAll().execute()
      expect(auditLogs).toHaveLength(0)
    })

    it("should create a temporarily (vendor) whitelisted non-gov.sg email with admin role", async () => {
      // Arrange
      const nonGovSgEmail = "test-vendor-whitelisted@coolvendor.com"
      const oneYearFromNow = new Date()
      oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1)
      await setUpWhitelist({ email: nonGovSgEmail, expiry: oneYearFromNow })

      // Act
      const result = await db.transaction().execute((tx) => {
        return createUserWithPermission({
          byUserId: creatorUserId,
          email: nonGovSgEmail,
          role: RoleType.Admin,
          siteId,
          tx,
        })
      })

      // Assert
      expect(result).toStrictEqual(expect.anything())
    })

    it("should create a whitelisted non-gov.sg email with admin role", async () => {
      // Arrange
      const nonGovSgEmail = "test@coolvendor.com"
      await setUpWhitelist({ email: nonGovSgEmail })

      // Act
      const result = await db.transaction().execute((tx) => {
        return createUserWithPermission({
          byUserId: creatorUserId,
          email: nonGovSgEmail,
          role: RoleType.Admin,
          siteId,
          tx,
        })
      })

      // Assert
      expect(result).toStrictEqual(expect.anything())
    })

    it("should create a non-gov.sg email with non-admin role", async () => {
      // Arrange
      const nonGovSgEmail = "test@coolvendor.com"
      await setUpWhitelist({ email: nonGovSgEmail })

      // Act
      const result = await db.transaction().execute((tx) => {
        return createUserWithPermission({
          byUserId: creatorUserId,
          email: nonGovSgEmail,
          role: RoleType.Editor,
          siteId,
          tx,
        })
      })
      // Assert
      expect(result).toStrictEqual(expect.anything())

      // Assert DB - audit logs (user)
      const userAuditLogs = await db
        .selectFrom("AuditLog")
        .where("eventType", "=", "UserCreate")
        .selectAll()
        .execute()
      expect(userAuditLogs).toHaveLength(1)
      expect(userAuditLogs[0]).toMatchObject({
        eventType: "UserCreate",
        delta: expect.objectContaining({
          before: null,
          after: expect.objectContaining(
            omit(result.user, ["createdAt", "updatedAt"]),
          ),
        }),
      })

      // Assert DB - audit logs (permission)
      const permissionAuditLogs = await db
        .selectFrom("AuditLog")
        .where("eventType", "=", "PermissionCreate")
        .selectAll()
        .execute()
      expect(permissionAuditLogs).toHaveLength(1)
      expect(permissionAuditLogs[0]).toMatchObject({
        eventType: "PermissionCreate",
        delta: expect.objectContaining({
          before: null,
          after: expect.objectContaining(
            omit(result.resourcePermission, ["createdAt", "updatedAt"]),
          ),
        }),
      })
    })

    describe("should create a new user with default values", () => {
      let user: Awaited<ReturnType<typeof createUserWithPermission>>["user"]
      let resourcePermission: Awaited<
        ReturnType<typeof createUserWithPermission>
      >["resourcePermission"]
      let dbUserResult: Awaited<
        ReturnType<ReturnType<typeof db.selectFrom<"User">>["execute"]>
      >
      let dbResourcePermissionResult: Awaited<
        ReturnType<
          ReturnType<typeof db.selectFrom<"ResourcePermission">>["execute"]
        >
      >
      let userAuditLogs: Awaited<
        ReturnType<ReturnType<typeof db.selectFrom<"AuditLog">>["execute"]>
      >
      let permissionAuditLogs: Awaited<
        ReturnType<ReturnType<typeof db.selectFrom<"AuditLog">>["execute"]>
      >

      beforeEach(async () => {
        const result = await db.transaction().execute((tx) => {
          return createUserWithPermission({
            byUserId: creatorUserId,
            email: TEST_EMAIL,
            name: "",
            phone: "",
            role: RoleType.Editor,
            siteId,
            tx,
          })
        })
        user = result.user
        resourcePermission = result.resourcePermission

        dbUserResult = await db
          .selectFrom("User")
          .where("id", "=", user.id)
          .selectAll()
          .execute()
        dbResourcePermissionResult = await db
          .selectFrom("ResourcePermission")
          .where("userId", "=", user.id)
          .where("siteId", "=", siteId)
          .selectAll()
          .execute()
        userAuditLogs = await db
          .selectFrom("AuditLog")
          .where("eventType", "=", "UserCreate")
          .selectAll()
          .execute()
        permissionAuditLogs = await db
          .selectFrom("AuditLog")
          .where("eventType", "=", "PermissionCreate")
          .selectAll()
          .execute()
      })

      it("should persist the user with default name and empty phone", () => {
        expect(dbUserResult).toHaveLength(1)
        expect(dbUserResult[0]).toMatchObject({
          id: user.id,
          email: TEST_EMAIL,
          name: TEST_EMAIL.split("@")[0],
          phone: "",
        })
      })

      it("should persist the editor resource permission", () => {
        expect(dbResourcePermissionResult).toHaveLength(1)
        expect(dbResourcePermissionResult[0]).toMatchObject({
          userId: user.id,
          siteId,
          role: RoleType.Editor,
        })
      })

      it("should create a UserCreate audit log", () => {
        expect(userAuditLogs).toHaveLength(1)
        expect(userAuditLogs[0]).toMatchObject({
          eventType: "UserCreate",
          delta: expect.objectContaining({
            before: null,
            after: expect.objectContaining(
              omit(user, ["createdAt", "updatedAt"]),
            ),
          }),
        })
      })

      it("should create a PermissionCreate audit log", () => {
        expect(permissionAuditLogs).toHaveLength(1)
        expect(permissionAuditLogs[0]).toMatchObject({
          eventType: "PermissionCreate",
          delta: expect.objectContaining({
            before: null,
            after: expect.objectContaining(
              omit(resourcePermission, ["createdAt", "updatedAt"]),
            ),
          }),
        })
      })
    })

    describe("should create a new user with provided values", () => {
      const name = "Test User"
      const phone = "12345678"
      const role = RoleType.Admin
      let user: Awaited<ReturnType<typeof createUserWithPermission>>["user"]
      let resourcePermission: Awaited<
        ReturnType<typeof createUserWithPermission>
      >["resourcePermission"]
      let dbUserResult: Awaited<
        ReturnType<ReturnType<typeof db.selectFrom<"User">>["execute"]>
      >
      let dbResourcePermissionResult: Awaited<
        ReturnType<
          ReturnType<typeof db.selectFrom<"ResourcePermission">>["execute"]
        >
      >
      let userAuditLogs: Awaited<
        ReturnType<ReturnType<typeof db.selectFrom<"AuditLog">>["execute"]>
      >
      let permissionAuditLogs: Awaited<
        ReturnType<ReturnType<typeof db.selectFrom<"AuditLog">>["execute"]>
      >

      beforeEach(async () => {
        const result = await db.transaction().execute((tx) => {
          return createUserWithPermission({
            byUserId: creatorUserId,
            email: TEST_EMAIL,
            name,
            phone,
            role,
            siteId,
            tx,
          })
        })
        user = result.user
        resourcePermission = result.resourcePermission

        dbUserResult = await db
          .selectFrom("User")
          .where("id", "=", user.id)
          .selectAll()
          .execute()
        dbResourcePermissionResult = await db
          .selectFrom("ResourcePermission")
          .where("userId", "=", user.id)
          .where("siteId", "=", siteId)
          .selectAll()
          .execute()
        userAuditLogs = await db
          .selectFrom("AuditLog")
          .where("eventType", "=", "UserCreate")
          .selectAll()
          .execute()
        permissionAuditLogs = await db
          .selectFrom("AuditLog")
          .where("eventType", "=", "PermissionCreate")
          .selectAll()
          .execute()
      })

      it("should persist the user with the provided name and phone", () => {
        expect(dbUserResult).toHaveLength(1)
        expect(dbUserResult[0]).toMatchObject({
          id: user.id,
          email: TEST_EMAIL,
          name,
          phone,
        })
      })

      it("should persist the admin resource permission", () => {
        expect(dbResourcePermissionResult).toHaveLength(1)
        expect(dbResourcePermissionResult[0]).toMatchObject({
          userId: user.id,
          siteId,
          role,
        })
      })

      it("should create a UserCreate audit log", () => {
        expect(userAuditLogs).toHaveLength(1)
        expect(userAuditLogs[0]).toMatchObject({
          eventType: "UserCreate",
          delta: expect.objectContaining({
            before: null,
            after: expect.objectContaining(
              omit(user, ["createdAt", "updatedAt"]),
            ),
          }),
        })
      })

      it("should create a PermissionCreate audit log", () => {
        expect(permissionAuditLogs).toHaveLength(1)
        expect(permissionAuditLogs[0]).toMatchObject({
          eventType: "PermissionCreate",
          delta: expect.objectContaining({
            before: null,
            after: expect.objectContaining(
              omit(resourcePermission, ["createdAt", "updatedAt"]),
            ),
          }),
        })
      })
    })

    it("should create resource permission for the user if user already exists", async () => {
      // Arrange
      const existingUser = await setupUser({
        email: TEST_EMAIL,
        isDeleted: false,
      })

      // Act
      const { resourcePermission } = await db.transaction().execute((tx) => {
        return createUserWithPermission({
          byUserId: creatorUserId,
          email: TEST_EMAIL,
          role: RoleType.Admin,
          siteId,
          tx,
        })
      })

      // Assert: Verify resource permission in database
      const dbResourcePermissionResult = await db
        .selectFrom("ResourcePermission")
        .where("userId", "=", existingUser.id)
        .where("siteId", "=", siteId)
        .selectAll()
        .execute()

      expect(dbResourcePermissionResult).toHaveLength(1)
      expect(dbResourcePermissionResult[0]).toMatchObject({
        userId: existingUser.id,
        siteId,
        role: RoleType.Admin,
      })

      // Assert DB - audit logs (user)
      // should not create audit log for user create as user already exists
      const userAuditLogs = await db
        .selectFrom("AuditLog")
        .where("eventType", "=", "UserCreate")
        .selectAll()
        .execute()
      expect(userAuditLogs).toHaveLength(0)

      // Assert DB - audit logs (permission)
      const permissionAuditLogs = await db
        .selectFrom("AuditLog")
        .where("eventType", "=", "PermissionCreate")
        .selectAll()
        .execute()
      expect(permissionAuditLogs).toHaveLength(1)
      expect(permissionAuditLogs[0]).toMatchObject({
        eventType: "PermissionCreate",
        delta: expect.objectContaining({
          before: null,
          after: expect.objectContaining(
            omit(resourcePermission, ["createdAt", "updatedAt"]),
          ),
        }),
      })
    })
  })
})
