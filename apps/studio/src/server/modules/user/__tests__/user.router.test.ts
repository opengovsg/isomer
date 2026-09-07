/* oxlint-disable eslint/no-loop-func, eslint/prefer-destructuring -- server lint cleanup */
import { TRPCError } from "@trpc/server"
import { omit } from "lodash-es"
import { resetTables } from "tests/integration/helpers/db"
import {
  applyAuthedSession,
  applySession,
  createMockRequest,
} from "tests/integration/helpers/iron-session"
import {
  setupAdminPermissions,
  setupEditorPermissions,
  setupPublisherPermissions,
  setupSite,
  setupUser,
  setUpWhitelist,
} from "tests/integration/helpers/seed"
import {
  MOCK_STORY_DATE,
  MOCK_TEST_PHONE,
  MOCK_TEST_USER_NAME,
} from "tests/msw/constants"
import { beforeAll, beforeEach, describe, expect, it } from "vitest"
import { db } from "~/server/modules/database/database"
import { RoleType } from "~/server/modules/database/types"
import { jsonb } from "~/server/modules/database/utils"
import { createCallerFactory } from "~/server/trpc"
import { IsomerAdminRole } from "~prisma/generated/generatedEnums"

import { userRouter } from "../user.router"
import { isomerAdminsCount, setupIsomerAdmins } from "./utils"

const createCaller = createCallerFactory(userRouter)

describe("user.router", () => {
  const TEST_EMAIL = "test@open.gov.sg"

  let caller: ReturnType<typeof createCaller>
  let session: Awaited<ReturnType<typeof applyAuthedSession>>
  let siteId: number

  beforeAll(async () => {
    await setUpWhitelist({ email: TEST_EMAIL })
  })

  beforeEach(async () => {
    await resetTables("User", "Site", "ResourcePermission", "AuditLog")

    const { site } = await setupSite()
    siteId = site.id
    session = await applyAuthedSession()
    caller = createCaller(createMockRequest(session))
  })

  describe("create", () => {
    it("should throw 401 if not logged in", async () => {
      const unauthedSession = applySession()
      const unauthedCaller = createCaller(createMockRequest(unauthedSession))

      // Act
      const result = unauthedCaller.create({
        siteId,
        users: [{ email: TEST_EMAIL }],
      })

      // Assert
      await expect(result).rejects.toThrow(
        new TRPCError({ code: "UNAUTHORIZED" }),
      )

      // Assert DB - audit logs
      const auditLogs = await db.selectFrom("AuditLog").selectAll().execute()
      expect(auditLogs).toHaveLength(0)
    })

    it("should throw 403 if user is not admin of the site", async () => {
      // Arrange
      await setupAdminPermissions({ siteId, userId: session.userId })

      const { site: newSite } = await setupSite()

      // Act
      const result = caller.create({
        siteId: newSite.id,
        users: [{ email: TEST_EMAIL }],
      })

      // Assert
      await expect(result).rejects.toThrow(
        new TRPCError({
          code: "FORBIDDEN",
          message:
            "You do not have sufficient permissions to perform this action",
        }),
      )

      // Assert DB - audit logs
      const auditLogs = await db.selectFrom("AuditLog").selectAll().execute()
      expect(auditLogs).toHaveLength(0)
    })

    it("should throw error if email is invalid", async () => {
      // Arrange
      await setupAdminPermissions({ siteId, userId: session.userId })

      // Act
      const result = caller.create({
        siteId,
        users: [{ email: "not-an-email" }],
      })

      // Assert
      await expect(result).rejects.toThrow()

      // Assert DB - audit logs
      const auditLogs = await db.selectFrom("AuditLog").selectAll().execute()
      expect(auditLogs).toHaveLength(0)
    })

    it("should create user if user already exists but has non-null deletedAt", async () => {
      // Arrange
      await setupAdminPermissions({ siteId, userId: session.userId })

      const user = await setupUser({ email: TEST_EMAIL, isDeleted: true })

      // Act
      const roleToCreate = RoleType.Editor
      const createdUsers = await caller.create({
        siteId,
        users: [{ email: user.email, role: roleToCreate }],
      })

      // Assert
      expect(createdUsers).toHaveLength(1)
      const createdUser = createdUsers[0]
      expect(createdUser).toEqual(
        expect.objectContaining({
          email: TEST_EMAIL,
          id: expect.any(String),
        }),
      )

      // Assert: Verify user in database
      const dbUserResult = await db
        .selectFrom("User")
        .where("email", "=", TEST_EMAIL)
        .selectAll()
        .execute()
      expect(dbUserResult).toHaveLength(2)
      // original + newly created record
      expect(dbUserResult).toEqual([
        expect.objectContaining({
          deletedAt: expect.any(Date),
          email: TEST_EMAIL,
          id: user.id,
          // original record,
        }),
        expect.objectContaining({
          deletedAt: null,
          email: TEST_EMAIL,
          id: expect.any(String),
        }),
      ])

      // Assert: Verify permissions in database
      const resourcePermissions = await db
        .selectFrom("ResourcePermission")
        .where("userId", "=", createdUser?.id ?? "")
        .where("siteId", "=", siteId)
        .selectAll()
        .execute()
      expect(resourcePermissions).toHaveLength(1)
      expect(resourcePermissions).toEqual([
        expect.objectContaining({
          role: roleToCreate,
          siteId,
          userId: expect.any(String),
        }),
      ])

      // Assert DB - audit logs (user)
      const userAuditEntry = await db
        .selectFrom("AuditLog")
        .where("eventType", "=", "UserCreate")
        .selectAll()
        .execute()
      expect(userAuditEntry).toHaveLength(1)
      expect(userAuditEntry[0]).toMatchObject({
        delta: expect.objectContaining({
          before: null,
          after: expect.objectContaining({
            id: createdUser?.id,
            email: TEST_EMAIL,
          }),
        }),
        eventType: "UserCreate",
      })

      // Assert DB - audit logs (permission)
      const permissionAuditEntry = await db
        .selectFrom("AuditLog")
        .where("eventType", "=", "PermissionCreate")
        .selectAll()
        .execute()
      expect(permissionAuditEntry).toHaveLength(1)
      expect(permissionAuditEntry[0]).toMatchObject({
        delta: expect.objectContaining({
          before: null,
          after: expect.objectContaining(
            omit(resourcePermissions[0], ["createdAt", "updatedAt"]),
          ),
        }),
        eventType: "PermissionCreate",
      })
    })

    it("should throw error if both user and permission already exists", async () => {
      // Arrange
      await setupAdminPermissions({ siteId, userId: session.userId })

      const user = await setupUser({ email: TEST_EMAIL, isDeleted: false })
      await setupAdminPermissions({ siteId, userId: user.id })

      // Act
      const result = caller.create({
        siteId,
        users: [{ email: TEST_EMAIL }],
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

    it("should throw 403 if creating a non-whitelisted non-gov.sg email with any role", async () => {
      // Arrange
      const nonGovSgEmail = "test@coolvendor.com"
      await setupAdminPermissions({ siteId, userId: session.userId })

      // Act
      const result = caller.create({
        siteId,
        users: [{ email: nonGovSgEmail, role: RoleType.Editor }],
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
      await setupAdminPermissions({ siteId, userId: session.userId })

      // Act
      const result = caller.create({
        siteId,
        users: [{ email: nonGovSgEmail, role: RoleType.Admin }],
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
      await setupAdminPermissions({ siteId, userId: session.userId })
      await setUpWhitelist({ email: nonGovSgEmail, expiry: oneYearFromNow })

      // Act
      const result = await caller.create({
        siteId,
        users: [{ email: nonGovSgEmail, role: RoleType.Admin }],
      })

      // Assert
      expect(result).toEqual(expect.anything())
    })

    it("should create a whitelisted non-gov.sg email with admin role", async () => {
      // Arrange
      const nonGovSgEmail = "test@coolvendor.com"
      await setupAdminPermissions({ siteId, userId: session.userId })
      await setUpWhitelist({ email: nonGovSgEmail })

      // Act
      const result = await caller.create({
        siteId,
        users: [{ email: nonGovSgEmail, role: RoleType.Admin }],
      })

      // Assert
      expect(result).toEqual(expect.anything())
    })

    it("should create a whitelisted non-gov.sg email with non-admin role", async () => {
      // Arrange
      const nonGovSgEmail = "test@coolvendor.com"
      const role = RoleType.Editor
      await setupAdminPermissions({ siteId, userId: session.userId })
      await setUpWhitelist({ email: nonGovSgEmail })

      // Act
      const result = await caller.create({
        siteId,
        users: [{ email: nonGovSgEmail, role }],
      })

      // Assert
      expect(result).toEqual(expect.anything())

      // Assert DB - audit logs (user)
      const userAuditEntry = await db
        .selectFrom("AuditLog")
        .where("eventType", "=", "UserCreate")
        .selectAll()
        .execute()
      expect(userAuditEntry).toHaveLength(1)
      expect(userAuditEntry[0]).toMatchObject({
        delta: expect.objectContaining({
          before: null,
          after: expect.objectContaining({
            id: result[0]?.id,
            email: nonGovSgEmail,
          }),
        }),
        eventType: "UserCreate",
      })

      // Assert DB - audit logs (permission)
      const permissionAuditEntry = await db
        .selectFrom("AuditLog")
        .where("eventType", "=", "PermissionCreate")
        .selectAll()
        .execute()
      expect(permissionAuditEntry).toHaveLength(1)
      expect(permissionAuditEntry[0]).toMatchObject({
        delta: expect.objectContaining({
          before: null,
          after: expect.objectContaining({
            userId: result[0]?.id,
            siteId,
            role,
          }),
        }),
        eventType: "PermissionCreate",
      })
    })

    it("should create user permissions successfully if user already exists but permissions do not exist", async () => {
      // Arrange
      await setupAdminPermissions({ siteId, userId: session.userId })

      const user = await setupUser({ email: TEST_EMAIL, isDeleted: false })

      // Act
      const result = await caller.create({
        siteId,
        users: [{ email: TEST_EMAIL }],
      })

      // Assert
      expect(result).toHaveLength(1)
      const createdUser = result[0]
      expect(createdUser).toEqual(
        expect.objectContaining({
          email: TEST_EMAIL,
          id: expect.any(String),
        }),
      )

      // Assert: No new user was created
      const dbUserResult = await db
        .selectFrom("User")
        .where("email", "=", TEST_EMAIL)
        .selectAll()
        .execute()
      expect(dbUserResult).toHaveLength(1)

      // Assert: Verify permissions in database
      const resourcePermissions = await db
        .selectFrom("ResourcePermission")
        .where("userId", "=", user.id)
        .where("siteId", "=", siteId)
        .selectAll()
        .execute()
      expect(resourcePermissions).toHaveLength(1)
      expect(resourcePermissions).toEqual([
        expect.objectContaining({
          role: RoleType.Editor,
          siteId,
          userId: createdUser?.id,
        }),
      ])

      // Assert: Verify audit logs (user)
      // should not create audit log for user create as user already exists
      const userAuditEntries = await db
        .selectFrom("AuditLog")
        .where("eventType", "=", "UserCreate")
        .selectAll()
        .execute()
      expect(userAuditEntries).toHaveLength(0)

      // Assert: Verify audit logs (permission)
      const permissionAuditEntry = await db
        .selectFrom("AuditLog")
        .where("eventType", "=", "PermissionCreate")
        .selectAll()
        .execute()
      expect(permissionAuditEntry).toHaveLength(1)
      expect(permissionAuditEntry[0]).toMatchObject({
        delta: expect.objectContaining({
          before: null,
          after: expect.objectContaining(
            omit(resourcePermissions[0], ["createdAt", "updatedAt"]),
          ),
        }),
        eventType: "PermissionCreate",
      })
    })

    it("should create both user and permissions successfully if user is admin", async () => {
      // Arrange
      await setupAdminPermissions({ siteId, userId: session.userId })

      // Act
      const createdUsers = await caller.create({
        siteId,
        users: [{ email: TEST_EMAIL }],
      })

      // Assert
      expect(createdUsers).toHaveLength(1)
      const createdUser = createdUsers[0]
      expect(createdUser).toEqual(
        expect.objectContaining({
          email: TEST_EMAIL,
          id: expect.any(String),
        }),
      )

      // Assert: Verify user in database
      const user = await db
        .selectFrom("User")
        .where("email", "=", TEST_EMAIL)
        .selectAll()
        .executeTakeFirstOrThrow()
      expect(user).toMatchObject({
        deletedAt: null,
        email: TEST_EMAIL,
        id: createdUser?.id,
      })

      // Assert: Verify permissions in database
      const resourcePermissions = await db
        .selectFrom("ResourcePermission")
        .where("userId", "=", user.id)
        .where("siteId", "=", siteId)
        .selectAll()
        .execute()
      expect(resourcePermissions).toHaveLength(1)
      expect(resourcePermissions).toEqual([
        expect.objectContaining({
          siteId,
          userId: createdUser?.id,
        }),
      ])

      // Assert: Verify audit logs (user)
      const userAuditEntries = await db
        .selectFrom("AuditLog")
        .where("eventType", "=", "UserCreate")
        .selectAll()
        .execute()
      expect(userAuditEntries).toHaveLength(1)
      expect(userAuditEntries[0]).toMatchObject({
        delta: expect.objectContaining({
          before: null,
          after: expect.objectContaining({
            id: createdUser?.id,
            email: TEST_EMAIL,
          }),
        }),
        eventType: "UserCreate",
      })

      // Assert: Verify audit logs (permission)
      const permissionAuditEntry = await db
        .selectFrom("AuditLog")
        .where("eventType", "=", "PermissionCreate")
        .selectAll()
        .execute()
      expect(permissionAuditEntry).toHaveLength(1)
      expect(permissionAuditEntry[0]).toMatchObject({
        delta: expect.objectContaining({
          before: null,
          after: expect.objectContaining(
            omit(resourcePermissions[0], ["createdAt", "updatedAt"]),
          ),
        }),
        eventType: "PermissionCreate",
      })
    })

    // Skip for now as we aren't working on multiple users creation yet
    it.skip("should create multiple users successfully if user is admin", async () => {})
    it.skip("should not create any users if one of the emails is invalid", async () => {})
  })

  describe("delete", () => {
    it("should throw 401 if not logged in", async () => {
      const unauthedSession = applySession()
      const unauthedCaller = createCaller(createMockRequest(unauthedSession))

      // Act
      const result = unauthedCaller.delete({
        siteId,
        userId: "test-user-id",
      })

      // Assert
      await expect(result).rejects.toThrow(
        new TRPCError({ code: "UNAUTHORIZED" }),
      )

      // Assert DB - audit logs
      const auditLogs = await db.selectFrom("AuditLog").selectAll().execute()
      expect(auditLogs).toHaveLength(0)
    })

    it("should throw 403 if user is not admin of the site", async () => {
      // Arrange
      await setupAdminPermissions({ siteId, userId: session.userId })

      const { site: newSite } = await setupSite()
      const newUser = await setupUser({
        email: TEST_EMAIL,
        isDeleted: false,
      })

      // Act
      const result = caller.delete({
        siteId: newSite.id,
        userId: newUser.id,
      })

      // Assert
      await expect(result).rejects.toThrow(
        new TRPCError({
          code: "FORBIDDEN",
          message:
            "You do not have sufficient permissions to perform this action",
        }),
      )

      // Assert DB - audit logs
      const auditLogs = await db.selectFrom("AuditLog").selectAll().execute()
      expect(auditLogs).toHaveLength(0)
    })

    it("should throw 404 if user does not exist", async () => {
      // Arrange
      await setupAdminPermissions({ siteId, userId: session.userId })

      // Act
      const result = caller.delete({
        siteId,
        userId: "non-existent-id",
      })

      // Assert
      await expect(result).rejects.toThrow(
        new TRPCError({
          code: "NOT_FOUND",
          message: "User not found",
        }),
      )

      // Assert DB - audit logs
      const auditLogs = await db.selectFrom("AuditLog").selectAll().execute()
      expect(auditLogs).toHaveLength(0)
    })

    it("should throw 404 if user exist but the permissions do not exist", async () => {
      // Arrange
      await setupAdminPermissions({ siteId, userId: session.userId })

      const user = await setupUser({ email: TEST_EMAIL, isDeleted: false })

      // Act
      const result = caller.delete({ siteId, userId: user.id })

      // Assert
      await expect(result).rejects.toThrow(
        new TRPCError({
          code: "NOT_FOUND",
          message: "User permissions not found",
        }),
      )

      // Assert DB - audit logs
      const auditLogs = await db.selectFrom("AuditLog").selectAll().execute()
      expect(auditLogs).toHaveLength(0)
    })

    it("should throw 404 if user to delete is not from the same site", async () => {
      // Arrange
      await setupAdminPermissions({ siteId, userId: session.userId })

      const { site: newSite } = await setupSite()
      const newUser = await setupUser({
        email: TEST_EMAIL,
        isDeleted: false,
      })
      await setupAdminPermissions({ siteId: newSite.id, userId: newUser.id })

      // Act
      const result = caller.delete({
        siteId,
        userId: newUser.id,
      })

      // Assert
      await expect(result).rejects.toThrow(
        new TRPCError({
          code: "NOT_FOUND",
          message: "User permissions not found",
        }),
      )

      // Assert DB - audit logs
      const auditLogs = await db.selectFrom("AuditLog").selectAll().execute()
      expect(auditLogs).toHaveLength(0)
    })

    it("should throw 403 if user tries to delete their own account", async () => {
      // Arrange
      await setupAdminPermissions({ siteId, userId: session.userId })

      // Act
      const result = caller.delete({
        siteId,
        userId: session.userId!,
      })

      // Assert
      await expect(result).rejects.toThrow(
        new TRPCError({
          code: "FORBIDDEN",
          message: "You cannot delete your own account",
        }),
      )

      // Assert DB - audit logs
      const auditLogs = await db.selectFrom("AuditLog").selectAll().execute()
      expect(auditLogs).toHaveLength(0)
    })

    it("should throw 403 if non-isomer admins try to delete isomer admins", async () => {
      // Arrange
      await setupAdminPermissions({ siteId, userId: session.userId })

      const isomerAdmin = await setupUser({
        email: "testisomeradmin@open.gov.sg",
        isDeleted: false,
      })
      await setupAdminPermissions({ siteId, userId: isomerAdmin.id })
      await db
        .insertInto("IsomerAdmin")
        .values({
          expiry: null,
          role: IsomerAdminRole.Core,
          userId: isomerAdmin.id,
        })
        .execute()

      // Act
      const result = caller.delete({ siteId, userId: isomerAdmin.id })

      // Assert
      await expect(result).rejects.toThrow(
        new TRPCError({
          code: "FORBIDDEN",
          message: "You do not have permission to delete this user",
        }),
      )

      // Assert DB - audit logs
      const auditLogs = await db.selectFrom("AuditLog").selectAll().execute()
      expect(auditLogs).toHaveLength(0)
    })

    it("should soft delete an existing user's permissions successfully", async () => {
      // Arrange
      await setupAdminPermissions({ siteId, userId: session.userId })

      const userToDelete = await setupUser({
        email: TEST_EMAIL,
        isDeleted: false,
      })
      await setupEditorPermissions({ siteId, userId: userToDelete.id })

      // Act
      const result = await caller.delete({
        siteId,
        userId: userToDelete.id,
      })

      // Assert
      expect(result).toEqual(
        expect.objectContaining({
          email: userToDelete.email,
          id: userToDelete.id,
        }),
      )

      // Verify in database
      const deletedUserPermissions = await db
        .selectFrom("ResourcePermission")
        .where("userId", "=", userToDelete.id)
        .where("siteId", "=", siteId)
        .select("deletedAt")
        .execute()
      expect(deletedUserPermissions).toHaveLength(1)
      // ensure it's not hard deleted
      expect(deletedUserPermissions[0]?.deletedAt).not.toBeNull()

      // Assert DB - audit logs (user)
      // Should not have any audit logs as user is not being deleted
      const auditLogs = await db
        .selectFrom("AuditLog")
        .where("eventType", "=", "UserDelete")
        .selectAll()
        .execute()
      expect(auditLogs).toHaveLength(0)

      // Assert DB - audit logs (permissions)
      const permissionsAuditLogs = await db
        .selectFrom("AuditLog")
        .where("eventType", "=", "PermissionDelete")
        .selectAll()
        .execute()
      expect(permissionsAuditLogs).toHaveLength(1)
      expect(permissionsAuditLogs[0]).toMatchObject({
        delta: expect.objectContaining({
          before: expect.objectContaining({
            ...omit(deletedUserPermissions[0], [
              "createdAt",
              "updatedAt",
              "deletedAt",
            ]),
            deletedAt: null,
          }),
          after: expect.objectContaining({
            ...omit(deletedUserPermissions[0], [
              "createdAt",
              "updatedAt",
              "deletedAt",
            ]),
            deletedAt: expect.anything(),
          }),
        }),
        eventType: "PermissionDelete",
      })
    })

    // User might have permissions to multiple sites
    // We should only soft delete the permissions for the site that the user is being deleted from
    it("should soft delete a user's permissions and not their account", async () => {
      // Arrange
      await setupAdminPermissions({ siteId, userId: session.userId })

      const userToDelete = await setupUser({
        email: TEST_EMAIL,
        isDeleted: false,
      })
      await setupEditorPermissions({ siteId, userId: userToDelete.id })

      // Act
      const result = await caller.delete({
        siteId,
        userId: userToDelete.id,
      })

      // Assert
      expect(result).toEqual(
        expect.objectContaining({
          email: userToDelete.email,
          id: userToDelete.id,
        }),
      )

      // Verify in database
      const dbUsers = await db
        .selectFrom("User")
        .where("id", "=", userToDelete.id)
        .select("deletedAt")
        .execute()
      expect(dbUsers).toHaveLength(1)
      expect(dbUsers[0]?.deletedAt).toBeNull()

      // Assert DB - audit logs (user)
      // Should not have any audit logs as user is not being deleted
      const auditLogs = await db
        .selectFrom("AuditLog")
        .where("eventType", "=", "UserDelete")
        .selectAll()
        .execute()
      expect(auditLogs).toHaveLength(0)

      // Assert DB - audit logs (permissions)
      const deletedUserPermission = await db
        .selectFrom("ResourcePermission")
        .where("userId", "=", userToDelete.id)
        .where("siteId", "=", siteId)
        .select("deletedAt")
        .executeTakeFirst()
      const permissionsAuditLogs = await db
        .selectFrom("AuditLog")
        .where("eventType", "=", "PermissionDelete")
        .selectAll()
        .execute()
      expect(permissionsAuditLogs).toHaveLength(1)
      expect(permissionsAuditLogs[0]).toMatchObject({
        delta: expect.objectContaining({
          before: expect.objectContaining({
            ...omit(deletedUserPermission, [
              "createdAt",
              "updatedAt",
              "deletedAt",
            ]),
            deletedAt: null,
          }),
          after: expect.objectContaining({
            ...omit(deletedUserPermission, [
              "createdAt",
              "updatedAt",
              "deletedAt",
            ]),
            deletedAt: expect.anything(),
          }),
        }),
        eventType: "PermissionDelete",
      })
    })
  })

  describe("getUser", () => {
    it("should throw 401 if not logged in", async () => {
      const unauthedSession = applySession()
      const unauthedCaller = createCaller(createMockRequest(unauthedSession))

      // Act
      const result = unauthedCaller.getUser({
        siteId,
        userId: "test-user-id",
      })

      // Assert
      await expect(result).rejects.toThrow(
        new TRPCError({ code: "UNAUTHORIZED" }),
      )
    })

    it("should throw 403 if user does not have any permissions to the site", async () => {
      // Act
      const result = caller.getUser({
        siteId,
        userId: "test-user-id",
      })

      // Assert
      await expect(result).rejects.toThrow(
        new TRPCError({
          code: "FORBIDDEN",
          message:
            "You do not have sufficient permissions to perform this action",
        }),
      )
    })

    it("should throw 404 if user does not exist", async () => {
      // Arrange
      await setupEditorPermissions({ siteId, userId: session.userId })

      // Act
      const result = caller.getUser({
        siteId,
        userId: "non-existent-id",
      })

      // Assert
      await expect(result).rejects.toThrow(
        new TRPCError({
          code: "NOT_FOUND",
          message: "User not found",
        }),
      )
    })

    it("should throw 404 if user exists but has no permissions for the site", async () => {
      // Arrange
      await setupAdminPermissions({ siteId, userId: session.userId })

      const { site: newSite } = await setupSite()
      const user = await setupUser({ email: TEST_EMAIL, isDeleted: false })
      await setupEditorPermissions({ siteId: newSite.id, userId: user.id })

      // Act
      const result = caller.getUser({
        siteId,
        userId: user.id,
      })

      // Assert
      await expect(result).rejects.toThrow(
        new TRPCError({
          code: "NOT_FOUND",
          message: "User not found",
        }),
      )
    })

    it("should not return user if all their permissions are deleted", async () => {
      // Arrange
      await setupAdminPermissions({ siteId, userId: session.userId })

      const user = await setupUser({ email: TEST_EMAIL, isDeleted: false })
      await setupEditorPermissions({ isDeleted: true, siteId, userId: user.id })

      // Act
      const result = caller.getUser({
        siteId,
        userId: user.id,
      })

      // Assert
      await expect(result).rejects.toThrow(
        new TRPCError({
          code: "NOT_FOUND",
          message: "User not found",
        }),
      )
    })

    it("should return user with their last login date", async () => {
      // Arrange
      await setupAdminPermissions({ siteId, userId: session.userId })
      const user = await setupUser({ email: TEST_EMAIL, isDeleted: false })
      await setupEditorPermissions({ siteId, userId: user.id })
      await db
        .updateTable("User")
        .where("id", "=", user.id)
        .set({ lastLoginAt: MOCK_STORY_DATE })
        .execute()

      // Act
      const result = await caller.getUser({
        siteId,
        userId: user.id,
      })

      // Assert
      expect(result).toEqual(
        expect.objectContaining({
          email: TEST_EMAIL,
          id: user.id,
          lastLoginAt: MOCK_STORY_DATE,
        }),
      )
    })
  })

  describe("list", () => {
    it("should throw 401 if not logged in", async () => {
      const unauthedSession = applySession()
      const unauthedCaller = createCaller(createMockRequest(unauthedSession))

      // Act
      const result = unauthedCaller.list({ siteId })

      // Assert
      await expect(result).rejects.toThrow(
        new TRPCError({ code: "UNAUTHORIZED" }),
      )
    })

    it("should throw 403 if user does not have any permissions to the site", async () => {
      // Act
      const result = caller.list({ siteId })

      // Assert
      await expect(result).rejects.toThrow(
        new TRPCError({
          code: "FORBIDDEN",
          message:
            "You do not have sufficient permissions to perform this action",
        }),
      )
    })

    it("should not return users with deletedAt set", async () => {
      // Arrange
      await setupEditorPermissions({ siteId, userId: session.userId })

      const user = await setupUser({ email: TEST_EMAIL, isDeleted: true })
      await setupEditorPermissions({ siteId, userId: user.id })

      // Act
      const result = await caller.list({ siteId })

      // Assert
      expect(result).toHaveLength(1)
      // only the current admin user
      expect(result).not.toContain(
        expect.objectContaining({
          id: user.id,
        }),
      )
    })

    it("should not return users with all permissions deleted", async () => {
      // Arrange
      await setupEditorPermissions({ siteId, userId: session.userId })

      const user = await setupUser({ email: TEST_EMAIL, isDeleted: false })
      await setupAdminPermissions({
        isDeleted: true,
        siteId,
        useCurrentTime: true,
        userId: user.id,
      })

      // Act
      const result = await caller.list({ siteId })

      // Assert
      expect(result).toHaveLength(1)
      // only the current admin user
      expect(result).not.toContain(
        expect.objectContaining({
          id: user.id,
        }),
      )
    })

    it("should return users with at least one non-deleted permission", async () => {
      // Arrange
      await setupEditorPermissions({ siteId, userId: session.userId })

      const user = await setupUser({ email: TEST_EMAIL, isDeleted: false })
      await setupEditorPermissions({
        isDeleted: true,
        // assuming previously soft deleted
        siteId,
        userId: user.id,
      })
      await setupEditorPermissions({
        isDeleted: false,
        // assuming being granted new permissions
        siteId,
        userId: user.id,
      })

      // Act
      const result = await caller.list({ siteId })

      // Assert
      expect(result).toHaveLength(2)
      expect(result).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            id: user.id,
          }),
        ]),
      )
    })

    it("should return array with self when no other users exist", async () => {
      // Arrange
      await setupEditorPermissions({ siteId, userId: session.userId })

      // Act
      const result = await caller.list({ siteId })

      // Assert
      expect(result).toHaveLength(1)
      // only the current admin user
      expect(result).toEqual([
        expect.objectContaining({
          id: session.userId,
          lastLoginAt: null,
          name: MOCK_TEST_USER_NAME,
        }),
      ])
    })

    it("should return users with their last login date", async () => {
      // Arrange
      await setupEditorPermissions({ siteId, userId: session.userId })
      await db
        .updateTable("User")
        .where("id", "=", session.userId!)
        .set({ lastLoginAt: MOCK_STORY_DATE })
        .execute()

      // Act
      const result = await caller.list({ siteId })

      // Assert
      expect(result).toEqual([
        expect.objectContaining({
          id: session.userId,
          lastLoginAt: MOCK_STORY_DATE,
        }),
      ])
    })

    it("should not return isomer admins if adminType is not set", async () => {
      // Arrange
      await setupEditorPermissions({ siteId, userId: session.userId })
      await setupIsomerAdmins({ siteId })

      // Act
      const result = await caller.list({ siteId })

      // Assert
      expect(result).toHaveLength(1)
      // only the current admin user
      expect(result).not.toContain(
        expect.objectContaining({
          id: session.userId,
          role: RoleType.Admin,
        }),
      )
    })

    it("should not return isomer admins if adminType is set to agency", async () => {
      // Arrange
      await setupEditorPermissions({ siteId, userId: session.userId })
      await setupIsomerAdmins({ siteId })

      // Act
      const result = await caller.list({ adminType: "agency", siteId })

      // Assert
      expect(result).toHaveLength(1)
      // only the current admin user
      expect(result).not.toContain(
        expect.objectContaining({
          id: session.userId,
          role: RoleType.Admin,
        }),
      )
    })

    it("should only return isomer admins if adminType is set as isomer", async () => {
      // Arrange
      await setupEditorPermissions({ siteId, userId: session.userId })
      await setupIsomerAdmins({ siteId })

      // Act
      const result = await caller.list({ adminType: "isomer", siteId })

      // Assert
      expect(result).toHaveLength(Math.min(isomerAdminsCount, 10))
      expect(result).not.toContain(
        expect.objectContaining({
          id: session.userId,
          role: RoleType.Admin,
        }),
      )
    })

    it("should return paginated results (10 users per page)", async () => {
      // Arrange
      await setupEditorPermissions({ siteId, userId: session.userId })

      for (let i = 0; i < 15; i++) {
        const editorUser = await setupUser({
          email: `editor.user.${i}@open.gov.sg`,
          isDeleted: false,
        })
        // oxlint-disable-next-line eslint/no-await-in-loop -- sequential integration setup
        await setupEditorPermissions({ siteId, userId: editorUser.id })
      }

      // Act
      const result = await caller.list({ siteId })

      // Assert
      expect(result).toHaveLength(10)
    })

    it("should return paginated results (10 users per page) with offset", async () => {
      // Arrange
      await setupEditorPermissions({ siteId, userId: session.userId })

      for (let i = 0; i < 15; i++) {
        const editorUser = await setupUser({
          email: `editor.user.${i}@open.gov.sg`,
          isDeleted: false,
        })
        // oxlint-disable-next-line eslint/no-await-in-loop -- sequential integration setup
        await setupEditorPermissions({ siteId, userId: editorUser.id })
      }

      // Act
      const result = await caller.list({ offset: 10, siteId })

      // Assert
      expect(result).toHaveLength(6)
    })

    it("should return users with emails in ascending alphabetical order", async () => {
      // Arrange
      await setupEditorPermissions({ siteId, userId: session.userId })

      // Create users with emails in non-alphabetical order
      const userC = await setupUser({
        email: "charlie@example.gov.sg",
        isDeleted: false,
      })
      const userA = await setupUser({
        email: "alice@example.gov.sg",
        isDeleted: false,
      })
      const userB = await setupUser({
        email: "bob@example.gov.sg",
        isDeleted: false,
      })
      await Promise.all(
        [userA, userB, userC].map(
          async (user) =>
            await setupEditorPermissions({ siteId, userId: user.id }),
        ),
      )

      // Act
      const result = await caller.list({ siteId })

      // Assert
      expect(result).toHaveLength(4)
      // current user + 3 new users
      expect(result.map((user) => user.email).slice(0, 3)).toEqual([
        "alice@example.gov.sg",
        "bob@example.gov.sg",
        "charlie@example.gov.sg",
      ])
    })
  })

  describe("count", () => {
    it("should throw 401 if not logged in", async () => {
      const unauthedSession = applySession()
      const unauthedCaller = createCaller(createMockRequest(unauthedSession))

      // Act
      const result = unauthedCaller.count({ siteId })

      // Assert
      await expect(result).rejects.toThrow(
        new TRPCError({ code: "UNAUTHORIZED" }),
      )
    })

    it("should throw 403 if user does not have any permissions to the site", async () => {
      // Act
      const result = caller.count({ siteId })

      // Assert
      await expect(result).rejects.toThrow(
        new TRPCError({
          code: "FORBIDDEN",
          message:
            "You do not have sufficient permissions to perform this action",
        }),
      )
    })

    it("should not return users with deletedAt set", async () => {
      // Arrange
      await setupEditorPermissions({ siteId, userId: session.userId })

      const user = await setupUser({ email: TEST_EMAIL, isDeleted: true })
      await setupEditorPermissions({ siteId, userId: user.id })

      // Act
      const result = await caller.count({ siteId })

      // Assert
      expect(result).toBe(1)
      // only the current admin user
    })

    it("should not return users with all permissions deleted", async () => {
      // Arrange
      await setupEditorPermissions({ siteId, userId: session.userId })

      const user = await setupUser({ email: TEST_EMAIL, isDeleted: false })
      await setupAdminPermissions({
        isDeleted: true,
        siteId,
        useCurrentTime: true,
        userId: user.id,
      })

      // Act
      const result = await caller.count({ siteId })

      // Assert
      expect(result).toBe(1)
      // only the current admin user
    })

    it("should return users with at least one non-deleted permission", async () => {
      // Arrange
      await setupEditorPermissions({ siteId, userId: session.userId })

      const user = await setupUser({ email: TEST_EMAIL, isDeleted: false })
      await setupEditorPermissions({
        isDeleted: true,
        // assuming previously soft deleted
        siteId,
        userId: user.id,
      })
      await setupAdminPermissions({
        isDeleted: false,
        // assuming being granted new permissions
        siteId,
        userId: user.id,
      })
      // Act
      const result = await caller.count({ siteId })

      // Assert
      expect(result).toBe(2)
    })

    it("should return array with self when no other users exist", async () => {
      // Arrange
      await setupEditorPermissions({ siteId, userId: session.userId })

      // Act
      const result = await caller.count({ siteId })

      // Assert
      expect(result).toBe(1)
      // only the current admin user
    })

    it("should not return isomer admins if adminType is not set", async () => {
      // Arrange
      await setupEditorPermissions({ siteId, userId: session.userId })
      await setupIsomerAdmins({ siteId })

      // Act
      const result = await caller.count({ siteId })

      // Assert
      expect(result).toBe(1)
      // only the current admin user
    })

    it("should not return isomer admins if adminType is set to agency", async () => {
      // Arrange
      await setupEditorPermissions({ siteId, userId: session.userId })
      await setupIsomerAdmins({ siteId })

      // Act
      const result = await caller.count({ adminType: "agency", siteId })

      // Assert
      expect(result).toBe(1)
      // only the current admin user
    })

    it("should only return isomer admins if adminType is set as isomer", async () => {
      // Arrange
      await setupEditorPermissions({ siteId, userId: session.userId })
      await setupIsomerAdmins({ siteId })

      // Act
      const result = await caller.count({ adminType: "isomer", siteId })

      // Assert
      expect(result).toBe(isomerAdminsCount)
    })
  })

  describe("update", () => {
    it("should throw 401 if not logged in", async () => {
      const unauthedSession = applySession()
      const unauthedCaller = createCaller(createMockRequest(unauthedSession))

      // Act
      const result = unauthedCaller.update({
        role: RoleType.Editor,
        siteId,
        userId: "test-user-id",
      })

      // Assert
      await expect(result).rejects.toThrow(
        new TRPCError({ code: "UNAUTHORIZED" }),
      )

      // Assert DB - audit logs
      const auditLogs = await db.selectFrom("AuditLog").selectAll().execute()
      expect(auditLogs).toHaveLength(0)
    })

    it("should throw 403 if user is not admin of the site", async () => {
      // Arrange
      await setupAdminPermissions({ siteId, userId: session.userId })

      const { site: newSite } = await setupSite()

      // Act
      const result = caller.update({
        role: RoleType.Editor,
        siteId: newSite.id,
        userId: "test-user-id",
      })

      // Assert
      await expect(result).rejects.toThrow(
        new TRPCError({
          code: "FORBIDDEN",
          message:
            "You do not have sufficient permissions to perform this action",
        }),
      )

      // Assert DB - audit logs
      const auditLogs = await db.selectFrom("AuditLog").selectAll().execute()
      expect(auditLogs).toHaveLength(0)
    })

    it("should throw 404 if user does not exist", async () => {
      // Arrange
      await setupAdminPermissions({ siteId, userId: session.userId })

      // Act
      const result = caller.update({
        role: RoleType.Editor,
        siteId,
        userId: "non-existent-id",
      })

      // Assert
      await expect(result).rejects.toThrow(
        new TRPCError({
          code: "NOT_FOUND",
          message: "User not found",
        }),
      )

      // Assert DB - audit logs
      const auditLogs = await db.selectFrom("AuditLog").selectAll().execute()
      expect(auditLogs).toHaveLength(0)
    })

    it("should throw 404 if user exist but the permissions do not exist", async () => {
      // Arrange
      await setupAdminPermissions({ siteId, userId: session.userId })

      const user = await setupUser({ email: TEST_EMAIL, isDeleted: false })

      // Act
      const result = caller.update({
        role: RoleType.Editor,
        siteId,
        userId: user.id,
      })

      // Assert
      await expect(result).rejects.toThrow(
        new TRPCError({
          code: "NOT_FOUND",
          message: "User permission not found",
        }),
      )

      // Assert DB - audit logs
      const auditLogs = await db.selectFrom("AuditLog").selectAll().execute()
      expect(auditLogs).toHaveLength(0)
    })

    it("should throw 404 if user to update is not from the same site", async () => {
      // Arrange
      await setupAdminPermissions({ siteId, userId: session.userId })

      const { site: newSite } = await setupSite()
      const newUser = await setupUser({
        email: TEST_EMAIL,
        isDeleted: false,
      })
      await setupAdminPermissions({ siteId: newSite.id, userId: newUser.id })

      // Act
      const result = caller.update({
        role: RoleType.Editor,
        siteId,
        userId: newUser.id,
      })

      // Assert
      await expect(result).rejects.toThrow(
        new TRPCError({
          code: "NOT_FOUND",
          message: "User permission not found",
        }),
      )

      // Assert DB - audit logs
      const auditLogs = await db.selectFrom("AuditLog").selectAll().execute()
      expect(auditLogs).toHaveLength(0)
    })

    it("should throw 404 if user exists but only has non-null deletedAt", async () => {
      // Arrange
      await setupAdminPermissions({ siteId, userId: session.userId })

      const user = await setupUser({ email: TEST_EMAIL, isDeleted: true })

      // Act
      const result = caller.update({
        role: RoleType.Editor,
        siteId,
        userId: user.id,
      })

      // Assert
      await expect(result).rejects.toThrow(
        new TRPCError({
          code: "NOT_FOUND",
          message: "User not found",
        }),
      )

      // Assert DB - audit logs
      const auditLogs = await db.selectFrom("AuditLog").selectAll().execute()
      expect(auditLogs).toHaveLength(0)
    })

    it("should throw 403 if user tries to update their own role", async () => {
      // Arrange
      await setupAdminPermissions({ siteId, userId: session.userId })

      // Act
      const result = caller.update({
        role: RoleType.Editor,
        siteId,
        userId: session.userId!,
      })

      // Assert
      await expect(result).rejects.toThrow(
        new TRPCError({
          code: "FORBIDDEN",
          message: "You cannot update your own role",
        }),
      )

      // Assert DB - audit logs
      const auditLogs = await db.selectFrom("AuditLog").selectAll().execute()
      expect(auditLogs).toHaveLength(0)
    })

    // Unlike createUserWithPermission, the update flow has never checked
    // whitelist status for any role, including Admin -- it only cares that
    // the caller has permission to manage users on the site. This means a
    // user whose whitelist entry later expires keeps whatever role they
    // already have, and if they're re-whitelisted (even temporarily), they
    // don't need to go through this check again to keep/regain that role.
    it("should update a non-whitelisted non-gov.sg email to admin role successfully", async () => {
      // Arrange
      await setupAdminPermissions({ siteId, userId: session.userId })

      const userToUpdate = await setupUser({
        email: "test-not-whitelisted@coolvendor.com",
        isDeleted: false,
      })
      await setupEditorPermissions({ siteId, userId: userToUpdate.id })

      // Act
      const result = await caller.update({
        role: RoleType.Admin,
        siteId,
        userId: userToUpdate.id,
      })

      // Assert
      expect(result).toEqual(
        expect.objectContaining({
          role: RoleType.Admin,
          siteId,
          userId: userToUpdate.id,
        }),
      )
    })

    it("should update a whitelisted non-gov.sg email to admin role successfully", async () => {
      // Arrange
      await setupAdminPermissions({ siteId, userId: session.userId })

      const userToUpdate = await setupUser({
        email: "test@coolvendor.com",
        isDeleted: false,
      })
      await setupEditorPermissions({ siteId, userId: userToUpdate.id })
      await setUpWhitelist({ email: userToUpdate.email })

      // Act
      const result = await caller.update({
        role: RoleType.Admin,
        siteId,
        userId: userToUpdate.id,
      })

      // Assert
      expect(result).toEqual(
        expect.objectContaining({
          role: RoleType.Admin,
          siteId,
          userId: userToUpdate.id,
        }),
      )
    })

    it("should update a temporarily (vendor) whitelisted non-gov.sg email to admin role successfully", async () => {
      // Arrange
      await setupAdminPermissions({ siteId, userId: session.userId })

      const userToUpdate = await setupUser({
        email: "test-vendor-whitelisted@coolvendor.com",
        isDeleted: false,
      })
      await setupEditorPermissions({ siteId, userId: userToUpdate.id })
      const oneYearFromNow = new Date()
      oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1)
      await setUpWhitelist({
        email: userToUpdate.email,
        expiry: oneYearFromNow,
      })

      // Act
      const result = await caller.update({
        role: RoleType.Admin,
        siteId,
        userId: userToUpdate.id,
      })

      // Assert
      expect(result).toEqual(
        expect.objectContaining({
          role: RoleType.Admin,
          siteId,
          userId: userToUpdate.id,
        }),
      )
    })

    it("should update a non-gov.sg email with non-admin role successfully", async () => {
      // Arrange
      await setupAdminPermissions({ siteId, userId: session.userId })

      const userToUpdate = await setupUser({
        email: "test@coolvendor.com",
        isDeleted: false,
      })
      const currentPermission = await setupEditorPermissions({
        siteId,
        userId: userToUpdate.id,
      })
      const newRole = RoleType.Publisher

      // Act
      const result = await caller.update({
        role: newRole,
        siteId,
        userId: userToUpdate.id,
      })

      // Assert
      expect(result).toEqual(
        expect.objectContaining({
          role: newRole,
          siteId,
          userId: userToUpdate.id,
        }),
      )

      // Verify in database
      const updatedUser = await db
        .selectFrom("ResourcePermission")
        .where("userId", "=", userToUpdate.id)
        .where("siteId", "=", siteId)
        .where("role", "=", newRole)
        .select("role")
        .executeTakeFirst()
      expect(updatedUser).not.toBeNull()

      // Assert DB - audit logs (soft-deleted permission)
      const deletedPermissionAuditLogs = await db
        .selectFrom("AuditLog")
        .where("eventType", "=", "PermissionDelete")
        .selectAll()
        .execute()
      expect(deletedPermissionAuditLogs).toHaveLength(1)
      expect(deletedPermissionAuditLogs[0]).toMatchObject({
        delta: expect.objectContaining({
          before: expect.objectContaining({
            ...omit(currentPermission, ["createdAt", "updatedAt", "deletedAt"]),
            deletedAt: null,
          }),
          after: expect.objectContaining({
            ...omit(currentPermission, ["createdAt", "updatedAt", "deletedAt"]),
            deletedAt: expect.anything(),
          }),
        }),
        eventType: "PermissionDelete",
      })

      // Assert DB - audit logs (new permission)
      const newPermission = await db
        .selectFrom("ResourcePermission")
        .where("userId", "=", userToUpdate.id)
        .where("siteId", "=", siteId)
        .where("role", "=", newRole)
        .selectAll()
        .executeTakeFirst()
      const newPermissionAuditLogs = await db
        .selectFrom("AuditLog")
        .where("eventType", "=", "PermissionCreate")
        .selectAll()
        .execute()
      expect(newPermissionAuditLogs).toHaveLength(1)
      expect(newPermissionAuditLogs[0]).toMatchObject({
        delta: expect.objectContaining({
          before: null,
          after: expect.objectContaining({
            ...omit(newPermission, ["createdAt", "updatedAt"]),
          }),
        }),
        eventType: "PermissionCreate",
      })
    })

    it("should update a user's role successfully", async () => {
      // Arrange
      await setupAdminPermissions({ siteId, userId: session.userId })

      const userToUpdate = await setupUser({
        email: TEST_EMAIL,
        isDeleted: false,
      })
      const currentPermission = await setupEditorPermissions({
        siteId,
        userId: userToUpdate.id,
      })
      const newRole = RoleType.Admin

      // Act
      const result = await caller.update({
        role: newRole,
        siteId,
        userId: userToUpdate.id,
      })

      // Assert
      expect(result).toEqual(
        expect.objectContaining({
          role: newRole,
          siteId,
          userId: userToUpdate.id,
        }),
      )

      // Verify in database
      const updatedUser = await db
        .selectFrom("ResourcePermission")
        .where("userId", "=", userToUpdate.id)
        .where("siteId", "=", siteId)
        .where("resourceId", "is", null)
        .where("deletedAt", "is", null)
        .select("role")
        .executeTakeFirst()
      expect(updatedUser?.role).toBe(newRole)

      // Assert DB - audit logs (soft-deleted permission)
      const deletedPermissionAuditLogs = await db
        .selectFrom("AuditLog")
        .where("eventType", "=", "PermissionDelete")
        .selectAll()
        .execute()
      expect(deletedPermissionAuditLogs).toHaveLength(1)
      expect(deletedPermissionAuditLogs[0]).toMatchObject({
        delta: expect.objectContaining({
          before: expect.objectContaining({
            ...omit(currentPermission, ["createdAt", "updatedAt", "deletedAt"]),
            deletedAt: null,
          }),
          after: expect.objectContaining({
            ...omit(currentPermission, ["createdAt", "updatedAt", "deletedAt"]),
            deletedAt: expect.anything(),
            // should be set to a new date
          }),
        }),
        eventType: "PermissionDelete",
      })

      // Assert DB - audit logs (new permission)
      const newPermission = await db
        .selectFrom("ResourcePermission")
        .where("userId", "=", userToUpdate.id)
        .where("siteId", "=", siteId)
        .where("role", "=", newRole)
        .selectAll()
        .executeTakeFirst()
      const newPermissionAuditLogs = await db
        .selectFrom("AuditLog")
        .where("eventType", "=", "PermissionCreate")
        .selectAll()
        .execute()
      expect(newPermissionAuditLogs).toHaveLength(1)
      expect(newPermissionAuditLogs[0]).toMatchObject({
        delta: expect.objectContaining({
          before: null,
          after: expect.objectContaining({
            ...omit(newPermission, ["createdAt", "updatedAt"]),
          }),
        }),
        eventType: "PermissionCreate",
      })
    })

    it("when updating a user's role, create a new permission for the user and update the old permission's deletedAt", async () => {
      // Arrange
      await setupAdminPermissions({ siteId, userId: session.userId })

      const userToUpdate = await setupUser({
        email: TEST_EMAIL,
        isDeleted: false,
      })
      // If deletedAt is set, it should not be overwritten
      const originalDeletedPermission = await setupEditorPermissions({
        siteId,
        userId: userToUpdate.id,
      })
      const originalDeletedPermissionDeletedAt = new Date()
      await db
        .updateTable("ResourcePermission")
        .where("id", "=", originalDeletedPermission.id)
        .set({ deletedAt: originalDeletedPermissionDeletedAt })
        .execute()
      // original active permission
      const originalPermission = await setupEditorPermissions({
        siteId,
        userId: userToUpdate.id,
      })
      const newRole = RoleType.Publisher

      // Act
      const result = await caller.update({
        role: newRole,
        siteId,
        userId: userToUpdate.id,
      })

      // Assert
      expect(result).toEqual({
        id: expect.not.stringContaining(originalPermission.id),
        role: newRole,
        siteId,
        userId: userToUpdate.id,
      })

      // Assert: Verify in DB
      const userPermissions = await db
        .selectFrom("ResourcePermission")
        .where("userId", "=", userToUpdate.id)
        .where("siteId", "=", siteId)
        .selectAll()
        .execute()
      expect(userPermissions).toHaveLength(3)
      // 1 old (deleted) + 1 old (active) + 1 new
      expect(userPermissions).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            deletedAt: originalDeletedPermissionDeletedAt,
            id: originalDeletedPermission.id,
            role: RoleType.Editor,
          }),
          expect.objectContaining({
            deletedAt: expect.any(Date),
            id: originalPermission.id,
            role: RoleType.Editor,
          }),
          expect.objectContaining({
            deletedAt: null,
            id: result.id,
            role: RoleType.Publisher,
          }),
        ]),
      )

      // Assert DB - audit logs (soft-deleted permission)
      const deletedPermissionAuditLogs = await db
        .selectFrom("AuditLog")
        .where("eventType", "=", "PermissionDelete")
        .selectAll()
        .execute()
      expect(deletedPermissionAuditLogs).toHaveLength(1)
      expect(deletedPermissionAuditLogs[0]).toMatchObject({
        delta: expect.objectContaining({
          before: expect.objectContaining({
            ...omit(originalPermission, [
              "createdAt",
              "updatedAt",
              "deletedAt",
            ]),
            deletedAt: null,
          }),
          after: expect.objectContaining({
            ...omit(originalPermission, [
              "createdAt",
              "updatedAt",
              "deletedAt",
            ]),
            deletedAt: expect.anything(),
            // should be set to a new date
          }),
        }),
        eventType: "PermissionDelete",
      })

      // Assert DB - audit logs (new permission)
      const createdPermissionAuditLogs = await db
        .selectFrom("AuditLog")
        .where("eventType", "=", "PermissionCreate")
        .selectAll()
        .execute()
      expect(createdPermissionAuditLogs).toHaveLength(1)
      expect(createdPermissionAuditLogs[0]).toMatchObject({
        delta: expect.objectContaining({
          before: null,
          after: expect.objectContaining({
            ...omit(
              userPermissions.find((p) => p.deletedAt === null),
              ["createdAt", "updatedAt"],
            ),
          }),
        }),
        eventType: "PermissionCreate",
      })
    })
  })

  describe("updateDetails", () => {
    it("should throw 401 if not logged in", async () => {
      const unauthedSession = applySession()
      const unauthedCaller = createCaller(createMockRequest(unauthedSession))

      // Act
      const result = unauthedCaller.updateDetails({
        name: "Test User",
        phone: "1234567890",
      })

      // Assert
      await expect(result).rejects.toThrow(
        new TRPCError({ code: "UNAUTHORIZED" }),
      )

      // Assert DB - audit logs
      const auditLogs = await db.selectFrom("AuditLog").selectAll().execute()
      expect(auditLogs).toHaveLength(0)
    })

    describe("name validation", () => {
      const emptyNames = ["", " ", "  "]
      for (const emptyName of emptyNames) {
        it(`should throw error if name is empty: ${emptyName}`, async () => {
          // Act & Assert
          await expect(
            caller.updateDetails({ name: emptyName, phone: "81234567" }),
          ).rejects.toThrow("Name is required")

          // Assert DB - audit logs
          const auditLogs = await db
            .selectFrom("AuditLog")
            .selectAll()
            .execute()
          expect(auditLogs).toHaveLength(0)
        })
      }

      it("should trim whitespace from name", async () => {
        // Arrange
        const name = "  John Doe  "
        const phone = "81234567"

        // Act
        await caller.updateDetails({ name, phone })

        // Assert
        const updatedUser = await db
          .selectFrom("User")
          .where("id", "=", session.userId!)
          .selectAll()
          .executeTakeFirstOrThrow()
        expect(updatedUser.name).toBe("John Doe")

        // Assert DB - audit logs
        const auditLogs = await db
          .selectFrom("AuditLog")
          .where("eventType", "=", "UserUpdate")
          .selectAll()
          .execute()
        expect(auditLogs).toHaveLength(1)
        expect(auditLogs[0]).toMatchObject({
          delta: expect.objectContaining({
            before: expect.objectContaining({
              name: MOCK_TEST_USER_NAME,
              phone: MOCK_TEST_PHONE,
            }),
            after: expect.objectContaining(
              omit(updatedUser, ["createdAt", "updatedAt", "deletedAt"]),
            ),
          }),
          eventType: "UserUpdate",
        })
      })
    })

    describe("phone validation", () => {
      const testUserName = "Test User"

      const emptyPhones = ["", " ", "  "]
      for (const emptyPhone of emptyPhones) {
        it(`should throw error if phone is empty: ${emptyPhone}`, async () => {
          // Act & Assert
          await expect(
            caller.updateDetails({ name: testUserName, phone: emptyPhone }),
          ).rejects.toThrow("Phone number is required")

          // Assert DB - audit logs
          const auditLogs = await db
            .selectFrom("AuditLog")
            .where("eventType", "=", "UserUpdate")
            .selectAll()
            .execute()
          expect(auditLogs).toHaveLength(0)
        })
      }

      const incorrectLengthPhones = ["1234567", "123456789", "812345"]
      for (const phone of incorrectLengthPhones) {
        it(`should throw error if phone number has incorrect length: ${phone}`, async () => {
          // Act & Assert
          await expect(
            caller.updateDetails({ name: testUserName, phone }),
          ).rejects.toThrow("Phone number must be exactly 8 digits")

          // Assert DB - audit logs
          const auditLogs = await db
            .selectFrom("AuditLog")
            .where("eventType", "=", "UserUpdate")
            .selectAll()
            .execute()
          expect(auditLogs).toHaveLength(0)
        })
      }

      const invalidPhones = ["12345678", "23456789", "45678901", "78901234"]
      for (const phone of invalidPhones) {
        it(`should throw error if phone number starts with invalid digit: ${phone}`, async () => {
          // Act & Assert
          await expect(
            caller.updateDetails({ name: testUserName, phone }),
          ).rejects.toThrow("Phone number must start with 6, 8, or 9")

          // Assert DB - audit logs
          const auditLogs = await db
            .selectFrom("AuditLog")
            .where("eventType", "=", "UserUpdate")
            .selectAll()
            .execute()
          expect(auditLogs).toHaveLength(0)
        })
      }

      const validPhonesWithSpaces = [
        " 81234567 ",
        "8123 4567",
        " 8123 4567 ",
        "  81234567  ",
      ]
      for (const phone of validPhonesWithSpaces) {
        it(`should handle phone numbers with whitespace: ${phone}`, async () => {
          // Act & Assert
          const result = await caller.updateDetails({
            name: testUserName,
            phone,
          })
          expect(result).toEqual({ name: testUserName, phone: "81234567" })

          const updatedUser = await db
            .selectFrom("User")
            .where("id", "=", session.userId!)
            .selectAll()
            .executeTakeFirstOrThrow()
          expect(updatedUser).toMatchObject(result)

          // Assert DB - audit logs
          const auditLogs = await db
            .selectFrom("AuditLog")
            .where("eventType", "=", "UserUpdate")
            .selectAll()
            .execute()
          expect(auditLogs).toHaveLength(1)
          expect(auditLogs[0]).toMatchObject({
            delta: expect.objectContaining({
              before: expect.objectContaining({
                name: MOCK_TEST_USER_NAME,
                phone: MOCK_TEST_PHONE,
              }),
              after: expect.objectContaining(
                omit(updatedUser, ["createdAt", "updatedAt", "deletedAt"]),
              ),
            }),
            eventType: "UserUpdate",
          })
        })
      }
      it("should remove +65 country code if present", async () => {
        // Arrange
        const phone = "+6581234567"

        // Act
        const result = await caller.updateDetails({ name: testUserName, phone })

        // Assert
        expect(result).toEqual({ name: testUserName, phone: "81234567" })

        // Verify in database
        const updatedUser = await db
          .selectFrom("User")
          .where("id", "=", session.userId!)
          .selectAll()
          .executeTakeFirstOrThrow()
        expect(updatedUser).toMatchObject(result)

        // Assert DB - audit logs
        const auditLogs = await db
          .selectFrom("AuditLog")
          .where("eventType", "=", "UserUpdate")
          .selectAll()
          .execute()
        expect(auditLogs).toHaveLength(1)
        expect(auditLogs[0]).toMatchObject({
          delta: expect.objectContaining({
            before: expect.objectContaining({
              name: MOCK_TEST_USER_NAME,
              phone: MOCK_TEST_PHONE,
            }),
            after: expect.objectContaining(
              omit(updatedUser, ["createdAt", "updatedAt", "deletedAt"]),
            ),
          }),
          eventType: "UserUpdate",
        })
      })

      const validSingaporePhones = ["61234567", "81234567", "91234567"]
      for (const phone of validSingaporePhones) {
        it(`should accept valid Singapore phone numbers: ${phone}`, async () => {
          // Act & Assert
          const result = await caller.updateDetails({
            name: testUserName,
            phone,
          })
          expect(result).toEqual({ name: testUserName, phone })

          const updatedUser = await db
            .selectFrom("User")
            .where("id", "=", session.userId!)
            .selectAll()
            .executeTakeFirstOrThrow()
          expect(updatedUser).toMatchObject(result)

          // Assert DB - audit logs
          const auditLogs = await db
            .selectFrom("AuditLog")
            .where("eventType", "=", "UserUpdate")
            .selectAll()
            .execute()
          expect(auditLogs).toHaveLength(1)
          expect(auditLogs[0]).toMatchObject({
            delta: expect.objectContaining({
              before: expect.objectContaining({
                name: MOCK_TEST_USER_NAME,
                phone: MOCK_TEST_PHONE,
              }),
              after: expect.objectContaining(
                omit(updatedUser, ["createdAt", "updatedAt", "deletedAt"]),
              ),
            }),
            eventType: "UserUpdate",
          })
        })
      }
    })

    it("should update user details successfully", async () => {
      // Arrange
      const name = "Test User"
      const phone = "81234567"

      // Act
      const result = await caller.updateDetails({ name, phone })

      // Assert
      expect(result).toEqual({ name, phone })

      // Assert: Verify in database
      const updatedUser = await db
        .selectFrom("User")
        .where("id", "=", session.userId!)
        .selectAll()
        .executeTakeFirstOrThrow()
      expect(updatedUser).toMatchObject(result)

      // Assert DB - audit logs
      const auditLogs = await db
        .selectFrom("AuditLog")
        .where("eventType", "=", "UserUpdate")
        .selectAll()
        .execute()
      expect(auditLogs).toHaveLength(1)
      expect(auditLogs[0]).toMatchObject({
        delta: expect.objectContaining({
          before: expect.objectContaining({
            name: MOCK_TEST_USER_NAME,
            phone: MOCK_TEST_PHONE,
          }),
          after: expect.objectContaining(
            omit(updatedUser, ["createdAt", "updatedAt", "deletedAt"]),
          ),
        }),
        eventType: "UserUpdate",
      })
    })
  })

  describe("resendInvite", () => {
    it("should throw 401 if not logged in", async () => {
      const unauthedSession = applySession()
      const unauthedCaller = createCaller(createMockRequest(unauthedSession))

      // Act
      const result = unauthedCaller.resendInvite({
        siteId,
        userId: "123",
      })

      // Assert
      await expect(result).rejects.toThrow(
        new TRPCError({ code: "UNAUTHORIZED" }),
      )
    })

    it("should throw 403 if user does not have admin permissions", async () => {
      // Arrange
      await setupPublisherPermissions({ siteId, userId: session.userId })

      // Act
      const result = caller.resendInvite({ siteId, userId: "123" })

      // Assert
      await expect(result).rejects.toThrow(
        new TRPCError({
          code: "FORBIDDEN",
          message:
            "You do not have sufficient permissions to perform this action",
        }),
      )
    })

    it("should throw 404 if user does not exist", async () => {
      // Arrange
      await setupAdminPermissions({ siteId, userId: session.userId })

      // Act
      const result = caller.resendInvite({ siteId, userId: "123" })

      // Assert
      await expect(result).rejects.toThrow(
        new TRPCError({
          code: "NOT_FOUND",
          message: "User not found",
        }),
      )
    })

    it("should throw 400 if user has already logged in", async () => {
      // Arrange
      await setupAdminPermissions({ siteId, userId: session.userId })

      const user = await setupUser({
        email: TEST_EMAIL,
        isDeleted: false,
        lastLoginAt: MOCK_STORY_DATE,
      })
      await setupEditorPermissions({ siteId, userId: user.id })

      // Act
      const result = caller.resendInvite({ siteId, userId: user.id })

      // Assert
      await expect(result).rejects.toThrow(
        new TRPCError({
          code: "BAD_REQUEST",
          message: "User has already logged in",
        }),
      )
    })

    it("should throw 400 if user has not logged in and was created before user management launch", async () => {
      // Arrange
      await setupAdminPermissions({ siteId, userId: session.userId })

      const user = await setupUser({
        email: TEST_EMAIL,
        isDeleted: false,
        lastLoginAt: null,
      })
      await db
        .updateTable("User")
        .where("id", "=", user.id)
        .set({ createdAt: new Date("2025-03-01") })
        .execute()
      await setupEditorPermissions({ siteId, userId: user.id })

      // Act
      const result = caller.resendInvite({ siteId, userId: user.id })

      // Assert
      await expect(result).rejects.toThrow(
        new TRPCError({
          code: "BAD_REQUEST",
          message: "User has already logged in",
        }),
      )
    })

    it("should throw 400 if user does not have any permissions to the site", async () => {
      // Arrange
      await setupAdminPermissions({ siteId, userId: session.userId })

      const user = await setupUser({
        email: TEST_EMAIL,
        isDeleted: false,
        lastLoginAt: null,
      })
      await db
        .updateTable("User")
        .where("id", "=", user.id)
        .set({ createdAt: new Date("2025-03-10") })
        .execute()

      // Act
      const result = caller.resendInvite({ siteId, userId: user.id })

      // Assert
      await expect(result).rejects.toThrow(
        new TRPCError({
          code: "BAD_REQUEST",
          message: "User has no permissions",
        }),
      )
    })

    it("should send invite successfully", async () => {
      // Arrange
      await setupAdminPermissions({ siteId, userId: session.userId })

      const user = await setupUser({
        email: TEST_EMAIL,
        isDeleted: false,
        lastLoginAt: null,
      })
      await db
        .updateTable("User")
        .where("id", "=", user.id)
        .set({ createdAt: new Date("2025-03-10") })
        .execute()
      await setupEditorPermissions({ siteId, userId: user.id })

      // Act
      const result = await caller.resendInvite({ siteId, userId: user.id })

      // Assert
      expect(result).toEqual({ email: user.email })
    })

    it("should fall back to Site.name when Site.config is JSON null", async () => {
      // Arrange
      await setupAdminPermissions({ siteId, userId: session.userId })

      const user = await setupUser({
        email: TEST_EMAIL,
        isDeleted: false,
        lastLoginAt: null,
      })
      await db
        .updateTable("User")
        .where("id", "=", user.id)
        .set({ createdAt: new Date("2025-03-10") })
        .execute()
      await setupEditorPermissions({ siteId, userId: user.id })

      // Simulate malformed-but-allowed JSONB payload written by admin JSON API.
      await db
        .updateTable("Site")
        .where("id", "=", siteId)
        .set({ config: jsonb(null) })
        .execute()

      // Act
      const result = await caller.resendInvite({ siteId, userId: user.id })

      // Assert
      expect(result).toEqual({ email: user.email })
    })
  })
})
