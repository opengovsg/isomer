import { TRPCError } from "@trpc/server"
import { RoleType } from "~prisma/generated/generatedEnums"
import _ from "lodash"
import { resetTables } from "tests/integration/helpers/db"
import {
  setupAdminPermissions,
  setupSite,
  setupUser,
  setUpWhitelist,
} from "tests/integration/helpers/seed"
import { beforeAll, beforeEach, describe, expect, it } from "vitest"

import { db } from "~/server/modules/database"
import { createUserWithPermission, isUserDeleted } from "../user.service"

describe("user.service", () => {
  describe("isUserDeleted", () => {
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

  describe("createUserWithPermission", () => {
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
      await expect(result).rejects.toThrowError()

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
      await expect(result).rejects.toThrowError(
        new TRPCError({
          code: "CONFLICT",
          message: "User already has permission for this site",
        }),
      )

      // Assert DB - audit logs
      const auditLogs = await db.selectFrom("AuditLog").selectAll().execute()
      expect(auditLogs).toHaveLength(0)
    })

    it("should create user if user already exists but has non-null deletedAt", async () => {
      // Arrange
      const user = await setupUser({ email: TEST_EMAIL, isDeleted: true })
      await setupAdminPermissions({ userId: user.id, siteId })

      // Act
      const roleToCreate = RoleType.Editor
      const { user: createdUser, resourcePermission } = await db
        .transaction()
        .execute((tx) => {
          return createUserWithPermission({
            byUserId: creatorUserId,
            email: TEST_EMAIL,
            role: roleToCreate,
            siteId,
            tx,
          })
        })

      // Assert: Verify user in database
      const dbUserResult = await db
        .selectFrom("User")
        .where("email", "=", TEST_EMAIL)
        .selectAll()
        .execute()
      expect(dbUserResult).toHaveLength(2) // original + newly created record
      expect(dbUserResult).toEqual([
        expect.objectContaining({
          email: TEST_EMAIL,
          id: user.id, // original record
          deletedAt: expect.any(Date),
        }),
        expect.objectContaining({
          email: TEST_EMAIL,
          id: expect.any(String),
          deletedAt: null,
        }),
      ])

      // Assert: Verify resource permission in database
      const dbResourcePermissionResult = await db
        .selectFrom("ResourcePermission")
        .where("userId", "=", createdUser.id)
        .where("siteId", "=", siteId)
        .selectAll()
        .execute()
      expect(dbResourcePermissionResult).toHaveLength(1)
      expect(dbResourcePermissionResult).toEqual([
        expect.objectContaining({
          userId: expect.any(String),
          siteId,
          role: roleToCreate,
        }),
      ])

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
          after: expect.objectContaining({
            id: createdUser.id,
            email: TEST_EMAIL,
          }),
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
            _.omit(resourcePermission, ["createdAt", "updatedAt"]),
          ),
        }),
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

    it("should throw 403 if assigning a non-gov.sg email with admin role", async () => {
      // Arrange
      const nonGovSgEmail = "test@coolvendor.com"
      await setUpWhitelist({ email: nonGovSgEmail })

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
          message:
            "Non-gov.sg emails cannot be added as admin. Select another role.",
        }),
      )

      // Assert DB - audit logs
      const auditLogs = await db.selectFrom("AuditLog").selectAll().execute()
      expect(auditLogs).toHaveLength(0)
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
      expect(result).toEqual(expect.anything())

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
            _.omit(result.user, ["createdAt", "updatedAt"]),
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
            _.omit(result.resourcePermission, ["createdAt", "updatedAt"]),
          ),
        }),
      })
    })

    it("should create a new user with default values", async () => {
      // Act
      const { user, resourcePermission } = await db
        .transaction()
        .execute((tx) => {
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
      // Assert: Verify user in database
      const dbUserResult = await db
        .selectFrom("User")
        .where("id", "=", user.id)
        .selectAll()
        .execute()

      expect(dbUserResult).toHaveLength(1)
      expect(dbUserResult[0]).toMatchObject({
        id: user.id,
        email: TEST_EMAIL,
        name: TEST_EMAIL.split("@")[0],
        phone: "",
      })

      // Assert: Verify resource permission in database
      const dbResourcePermissionResult = await db
        .selectFrom("ResourcePermission")
        .where("userId", "=", user.id)
        .where("siteId", "=", siteId)
        .selectAll()
        .execute()

      expect(dbResourcePermissionResult).toHaveLength(1)
      expect(dbResourcePermissionResult[0]).toMatchObject({
        userId: user.id,
        siteId,
        role: RoleType.Editor,
      })

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
            _.omit(user, ["createdAt", "updatedAt"]),
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
            _.omit(resourcePermission, ["createdAt", "updatedAt"]),
          ),
        }),
      })
    })

    it("should create a new user with provided values", async () => {
      // Arrange
      const name = "Test User"
      const phone = "12345678"
      const role = RoleType.Admin

      // Act
      const { user, resourcePermission } = await db
        .transaction()
        .execute((tx) => {
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
      // Assert: Verify user in database
      const dbUserResult = await db
        .selectFrom("User")
        .where("id", "=", user.id)
        .selectAll()
        .execute()

      expect(dbUserResult).toHaveLength(1)
      expect(dbUserResult[0]).toMatchObject({
        id: user.id,
        email: TEST_EMAIL,
        name,
        phone,
      })

      // Assert: Verify resource permission in database
      const dbResourcePermissionResult = await db
        .selectFrom("ResourcePermission")
        .where("userId", "=", user.id)
        .where("siteId", "=", siteId)
        .selectAll()
        .execute()

      expect(dbResourcePermissionResult).toHaveLength(1)
      expect(dbResourcePermissionResult[0]).toMatchObject({
        userId: user.id,
        siteId,
        role,
      })

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
            _.omit(user, ["createdAt", "updatedAt"]),
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
            _.omit(resourcePermission, ["createdAt", "updatedAt"]),
          ),
        }),
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
            _.omit(resourcePermission, ["createdAt", "updatedAt"]),
          ),
        }),
      })
    })
  })
})
