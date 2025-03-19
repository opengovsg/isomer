import { TRPCError } from "@trpc/server"
import { ISOMER_ADMINS_AND_MIGRATORS_EMAILS } from "~prisma/constants"
import _ from "lodash"
import { resetTables } from "tests/integration/helpers/db"
import {
  applyAuthedSession,
  applySession,
  createMockRequest,
} from "tests/integration/helpers/iron-session"
import {
  setupAdminPermissions,
  setupEditorPermissions,
  setupSite,
  setupUser,
  setUpWhitelist,
} from "tests/integration/helpers/seed"
import { MOCK_STORY_DATE, MOCK_TEST_USER_NAME } from "tests/msw/constants"
import { beforeAll, beforeEach, describe, expect, it } from "vitest"

import { db, RoleType } from "~/server/modules/database"
import { createCallerFactory } from "~/server/trpc"
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
      await expect(result).rejects.toThrowError(
        new TRPCError({ code: "UNAUTHORIZED" }),
      )

      // Assert DB - audit logs
      const auditLogs = await db.selectFrom("AuditLog").selectAll().execute()
      expect(auditLogs).toHaveLength(0)
    })

    it("should throw 403 if user is not admin of the site", async () => {
      // Arrange
      await setupAdminPermissions({ userId: session.userId, siteId })

      const { site: newSite } = await setupSite()

      // Act
      const result = caller.create({
        siteId: newSite.id,
        users: [{ email: TEST_EMAIL }],
      })

      // Assert
      await expect(result).rejects.toThrowError(
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
      await setupAdminPermissions({ userId: session.userId, siteId })

      // Act
      const result = caller.create({
        siteId,
        users: [{ email: "not-an-email" }],
      })

      // Assert
      await expect(result).rejects.toThrowError()

      // Assert DB - audit logs
      const auditLogs = await db.selectFrom("AuditLog").selectAll().execute()
      expect(auditLogs).toHaveLength(0)
    })

    it("should create user if user already exists but has non-null deletedAt", async () => {
      // Arrange
      await setupAdminPermissions({ userId: session.userId, siteId })

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
          userId: expect.any(String),
          siteId,
          role: roleToCreate,
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
        eventType: "UserCreate",
        delta: expect.objectContaining({
          before: null,
          after: expect.objectContaining({
            id: createdUser?.id,
            email: TEST_EMAIL,
          }),
        }),
      })

      // Assert DB - audit logs (permission)
      const permissionAuditEntry = await db
        .selectFrom("AuditLog")
        .where("eventType", "=", "PermissionCreate")
        .selectAll()
        .execute()
      expect(permissionAuditEntry).toHaveLength(1)
      expect(permissionAuditEntry[0]).toMatchObject({
        eventType: "PermissionCreate",
        delta: expect.objectContaining({
          before: null,
          after: expect.objectContaining(
            _.omit(resourcePermissions[0], ["createdAt", "updatedAt"]),
          ),
        }),
      })
    })

    it("should throw error if both user and permission already exists", async () => {
      // Arrange
      await setupAdminPermissions({ userId: session.userId, siteId })

      const user = await setupUser({ email: TEST_EMAIL, isDeleted: false })
      await setupAdminPermissions({ userId: user.id, siteId })

      // Act
      const result = caller.create({
        siteId,
        users: [{ email: TEST_EMAIL }],
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

    it("should throw 403 if creating a non-whitelisted non-gov.sg email with any role", async () => {
      // Arrange
      const nonGovSgEmail = "test@coolvendor.com"
      await setupAdminPermissions({ userId: session.userId, siteId })

      // Act
      const result = caller.create({
        siteId,
        users: [{ email: nonGovSgEmail, role: RoleType.Editor }],
      })

      // Assert
      await expect(result).rejects.toThrowError(
        new TRPCError({
          code: "FORBIDDEN",
          message: "There are non-gov.sg domains that need to be whitelisted.",
        }),
      )

      // Assert DB - audit logs
      const auditLogs = await db.selectFrom("AuditLog").selectAll().execute()
      expect(auditLogs).toHaveLength(0)
    })

    it("should throw 403 if assigning a whitelisted non-gov.sg email with admin role", async () => {
      // Arrange
      const nonGovSgEmail = "test@coolvendor.com"
      await setupAdminPermissions({ userId: session.userId, siteId })
      await setUpWhitelist({ email: nonGovSgEmail })

      // Act
      const result = caller.create({
        siteId,
        users: [{ email: nonGovSgEmail, role: RoleType.Admin }],
      })

      // Assert
      await expect(result).rejects.toThrowError(
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

    it("should create a whitelisted non-gov.sg email with non-admin role", async () => {
      // Arrange
      const nonGovSgEmail = "test@coolvendor.com"
      const role = RoleType.Editor
      await setupAdminPermissions({ userId: session.userId, siteId })
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
        eventType: "UserCreate",
        delta: expect.objectContaining({
          before: null,
          after: expect.objectContaining({
            id: result[0]?.id,
            email: nonGovSgEmail,
          }),
        }),
      })

      // Assert DB - audit logs (permission)
      const permissionAuditEntry = await db
        .selectFrom("AuditLog")
        .where("eventType", "=", "PermissionCreate")
        .selectAll()
        .execute()
      expect(permissionAuditEntry).toHaveLength(1)
      expect(permissionAuditEntry[0]).toMatchObject({
        eventType: "PermissionCreate",
        delta: expect.objectContaining({
          before: null,
          after: expect.objectContaining({
            userId: result[0]?.id,
            siteId,
            role,
          }),
        }),
      })
    })

    it("should create user permissions successfully if user already exists but permissions do not exist", async () => {
      // Arrange
      await setupAdminPermissions({ userId: session.userId, siteId })

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
          userId: createdUser?.id,
          siteId,
          role: RoleType.Editor,
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
        eventType: "PermissionCreate",
        delta: expect.objectContaining({
          before: null,
          after: expect.objectContaining(
            _.omit(resourcePermissions[0], ["createdAt", "updatedAt"]),
          ),
        }),
      })
    })

    it("should create both user and permissions successfully if user is admin", async () => {
      // Arrange
      await setupAdminPermissions({ userId: session.userId, siteId })

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
        email: TEST_EMAIL,
        id: createdUser?.id,
        deletedAt: null,
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
          userId: createdUser?.id,
          siteId,
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
        eventType: "UserCreate",
        delta: expect.objectContaining({
          before: null,
          after: expect.objectContaining({
            id: createdUser?.id,
            email: TEST_EMAIL,
          }),
        }),
      })

      // Assert: Verify audit logs (permission)
      const permissionAuditEntry = await db
        .selectFrom("AuditLog")
        .where("eventType", "=", "PermissionCreate")
        .selectAll()
        .execute()
      expect(permissionAuditEntry).toHaveLength(1)
      expect(permissionAuditEntry[0]).toMatchObject({
        eventType: "PermissionCreate",
        delta: expect.objectContaining({
          before: null,
          after: expect.objectContaining(
            _.omit(resourcePermissions[0], ["createdAt", "updatedAt"]),
          ),
        }),
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
      await expect(result).rejects.toThrowError(
        new TRPCError({ code: "UNAUTHORIZED" }),
      )
    })

    it("should throw 403 if user is not admin of the site", async () => {
      // Arrange
      await setupAdminPermissions({ userId: session.userId, siteId })

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
      await expect(result).rejects.toThrowError(
        new TRPCError({
          code: "FORBIDDEN",
          message:
            "You do not have sufficient permissions to perform this action",
        }),
      )
    })

    it("should throw 404 if user does not exist", async () => {
      // Arrange
      await setupAdminPermissions({ userId: session.userId, siteId })

      // Act
      const result = caller.delete({
        siteId,
        userId: "non-existent-id",
      })

      // Assert
      await expect(result).rejects.toThrowError(
        new TRPCError({
          code: "NOT_FOUND",
          message: "User not found",
        }),
      )
    })

    it("should throw 404 if user exist but the permissions do not exist", async () => {
      // Arrange
      await setupAdminPermissions({ userId: session.userId, siteId })

      const user = await setupUser({ email: TEST_EMAIL, isDeleted: false })

      // Act
      const result = caller.delete({ siteId, userId: user.id })

      // Assert
      await expect(result).rejects.toThrowError(
        new TRPCError({
          code: "NOT_FOUND",
          message: "User permissions not found",
        }),
      )
    })

    it("should throw 404 if user to delete is not from the same site", async () => {
      // Arrange
      await setupAdminPermissions({ userId: session.userId, siteId })

      const { site: newSite } = await setupSite()
      const newUser = await setupUser({
        email: TEST_EMAIL,
        isDeleted: false,
      })
      await setupAdminPermissions({ userId: newUser.id, siteId: newSite.id })

      // Act
      const result = caller.delete({
        siteId,
        userId: newUser.id,
      })

      // Assert
      await expect(result).rejects.toThrowError(
        new TRPCError({
          code: "NOT_FOUND",
          message: "User permissions not found",
        }),
      )
    })

    it("should throw 403 if user tries to delete their own account", async () => {
      // Arrange
      await setupAdminPermissions({ userId: session.userId, siteId })

      // Act
      const result = caller.delete({
        siteId,
        userId: session.userId!,
      })

      // Assert
      await expect(result).rejects.toThrowError(
        new TRPCError({
          code: "FORBIDDEN",
          message: "You cannot delete your own account",
        }),
      )
    })

    it("should throw 403 if non-isomer admins try to delete isomer admins", async () => {
      // Arrange
      await setupAdminPermissions({ userId: session.userId, siteId })

      const isomerAdmin = await setupUser({
        email: ISOMER_ADMINS_AND_MIGRATORS_EMAILS[0]!,
        isDeleted: false,
      })
      await setupAdminPermissions({ userId: isomerAdmin.id, siteId })

      // Act
      const result = caller.delete({ siteId, userId: isomerAdmin.id })

      // Assert
      await expect(result).rejects.toThrowError(
        new TRPCError({
          code: "FORBIDDEN",
          message: "You do not have permission to delete this user",
        }),
      )
    })

    it("should soft delete an existing user's permissions successfully", async () => {
      // Arrange
      await setupAdminPermissions({ userId: session.userId, siteId })

      const userToDelete = await setupUser({
        email: TEST_EMAIL,
        isDeleted: false,
      })
      await setupEditorPermissions({ userId: userToDelete.id, siteId })

      // Act
      const result = await caller.delete({
        siteId,
        userId: userToDelete.id,
      })

      // Assert
      expect(result).toEqual(
        expect.objectContaining({
          id: userToDelete.id,
          email: userToDelete.email,
        }),
      )

      // Verify in database
      const deletedUserPermissions = await db
        .selectFrom("ResourcePermission")
        .where("userId", "=", userToDelete.id)
        .where("siteId", "=", siteId)
        .select("deletedAt")
        .execute()
      expect(deletedUserPermissions).toHaveLength(1) // ensure it's not hard deleted
      expect(deletedUserPermissions[0]?.deletedAt).not.toBeNull()
    })

    // User might have permissions to multiple sites
    // We should only soft delete the permissions for the site that the user is being deleted from
    it("should soft delete a user's permissions and not their account", async () => {
      // Arrange
      await setupAdminPermissions({ userId: session.userId, siteId })

      const userToDelete = await setupUser({
        email: TEST_EMAIL,
        isDeleted: false,
      })
      await setupEditorPermissions({ userId: userToDelete.id, siteId })

      // Act
      const result = await caller.delete({
        siteId,
        userId: userToDelete.id,
      })

      // Assert
      expect(result).toEqual(
        expect.objectContaining({
          id: userToDelete.id,
          email: userToDelete.email,
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
      await expect(result).rejects.toThrowError(
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
      await expect(result).rejects.toThrowError(
        new TRPCError({
          code: "FORBIDDEN",
          message:
            "You do not have sufficient permissions to perform this action",
        }),
      )
    })

    it("should throw 404 if user does not exist", async () => {
      // Arrange
      await setupEditorPermissions({ userId: session.userId, siteId })

      // Act
      const result = caller.getUser({
        siteId,
        userId: "non-existent-id",
      })

      // Assert
      await expect(result).rejects.toThrowError(
        new TRPCError({
          code: "NOT_FOUND",
          message: "User not found",
        }),
      )
    })

    it("should throw 404 if user exists but has no permissions for the site", async () => {
      // Arrange
      await setupAdminPermissions({ userId: session.userId, siteId })

      const { site: newSite } = await setupSite()
      const user = await setupUser({ email: TEST_EMAIL, isDeleted: false })
      await setupEditorPermissions({ userId: user.id, siteId: newSite.id })

      // Act
      const result = caller.getUser({
        siteId,
        userId: user.id,
      })

      // Assert
      await expect(result).rejects.toThrowError(
        new TRPCError({
          code: "NOT_FOUND",
          message: "User not found",
        }),
      )
    })

    it("should not return user if all their permissions are deleted", async () => {
      // Arrange
      await setupAdminPermissions({ userId: session.userId, siteId })

      const user = await setupUser({ email: TEST_EMAIL, isDeleted: false })
      await setupEditorPermissions({ userId: user.id, siteId, isDeleted: true })

      // Act
      const result = caller.getUser({
        siteId,
        userId: user.id,
      })

      // Assert
      await expect(result).rejects.toThrowError(
        new TRPCError({
          code: "NOT_FOUND",
          message: "User not found",
        }),
      )
    })

    it("should return user with their last login date", async () => {
      // Arrange
      await setupAdminPermissions({ userId: session.userId, siteId })
      const user = await setupUser({ email: TEST_EMAIL, isDeleted: false })
      await setupEditorPermissions({ userId: user.id, siteId })
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
          id: user.id,
          email: TEST_EMAIL,
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
      await expect(result).rejects.toThrowError(
        new TRPCError({ code: "UNAUTHORIZED" }),
      )
    })

    it("should throw 403 if user does not have any permissions to the site", async () => {
      // Act
      const result = caller.list({ siteId })

      // Assert
      await expect(result).rejects.toThrowError(
        new TRPCError({
          code: "FORBIDDEN",
          message:
            "You do not have sufficient permissions to perform this action",
        }),
      )
    })

    it("should not return users with deletedAt set", async () => {
      // Arrange
      await setupEditorPermissions({ userId: session.userId, siteId })

      const user = await setupUser({ email: TEST_EMAIL, isDeleted: true })
      await setupEditorPermissions({ userId: user.id, siteId })

      // Act
      const result = await caller.list({ siteId })

      // Assert
      expect(result).toHaveLength(1) // only the current admin user
      expect(result).not.toContain(
        expect.objectContaining({
          id: user.id,
        }),
      )
    })

    it("should not return users with all permissions deleted", async () => {
      // Arrange
      await setupEditorPermissions({ userId: session.userId, siteId })

      const user = await setupUser({ email: TEST_EMAIL, isDeleted: false })
      await setupAdminPermissions({
        userId: user.id,
        siteId,
        isDeleted: true,
        useCurrentTime: true,
      })

      // Act
      const result = await caller.list({ siteId })

      // Assert
      expect(result).toHaveLength(1) // only the current admin user
      expect(result).not.toContain(
        expect.objectContaining({
          id: user.id,
        }),
      )
    })

    it("should return users with at least one non-deleted permission", async () => {
      // Arrange
      await setupEditorPermissions({ userId: session.userId, siteId })

      const user = await setupUser({ email: TEST_EMAIL, isDeleted: false })
      await setupEditorPermissions({
        userId: user.id,
        siteId,
        isDeleted: true, // assuming previously soft deleted
      })
      await setupEditorPermissions({
        userId: user.id,
        siteId,
        isDeleted: false, // assuming being granted new permissions
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
      await setupEditorPermissions({ userId: session.userId, siteId })

      // Act
      const result = await caller.list({ siteId })

      // Assert
      expect(result).toHaveLength(1) // only the current admin user
      expect(result).toEqual([
        expect.objectContaining({
          id: session.userId,
          name: MOCK_TEST_USER_NAME,
          lastLoginAt: null,
        }),
      ])
    })

    it("should return users with their last login date", async () => {
      // Arrange
      await setupEditorPermissions({ userId: session.userId, siteId })
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
      await setupEditorPermissions({ userId: session.userId, siteId })
      await setupIsomerAdmins({ siteId })

      // Act
      const result = await caller.list({ siteId })

      // Assert
      expect(result).toHaveLength(1) // only the current admin user
      expect(result).not.toContain(
        expect.objectContaining({
          id: session.userId,
          role: RoleType.Admin,
        }),
      )
    })

    it("should not return isomer admins if adminType is set to agency", async () => {
      // Arrange
      await setupEditorPermissions({ userId: session.userId, siteId })
      await setupIsomerAdmins({ siteId })

      // Act
      const result = await caller.list({ siteId, adminType: "agency" })

      // Assert
      expect(result).toHaveLength(1) // only the current admin user
      expect(result).not.toContain(
        expect.objectContaining({
          id: session.userId,
          role: RoleType.Admin,
        }),
      )
    })

    it("should only return isomer admins if adminType is set as isomer", async () => {
      // Arrange
      await setupEditorPermissions({ userId: session.userId, siteId })
      await setupIsomerAdmins({ siteId })

      // Act
      const result = await caller.list({ siteId, adminType: "isomer" })

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
      await setupEditorPermissions({ userId: session.userId, siteId })

      for (let i = 0; i < 15; i++) {
        const editorUser = await setupUser({
          email: `editor.user.${i}@open.gov.sg`,
          isDeleted: false,
        })
        await setupEditorPermissions({ userId: editorUser.id, siteId })
      }

      // Act
      const result = await caller.list({ siteId })

      // Assert
      expect(result).toHaveLength(10)
    })

    it("should return paginated results (10 users per page) with offset", async () => {
      // Arrange
      await setupEditorPermissions({ userId: session.userId, siteId })

      for (let i = 0; i < 15; i++) {
        const editorUser = await setupUser({
          email: `editor.user.${i}@open.gov.sg`,
          isDeleted: false,
        })
        await setupEditorPermissions({ userId: editorUser.id, siteId })
      }

      // Act
      const result = await caller.list({ siteId, offset: 10 })

      // Assert
      expect(result).toHaveLength(6)
    })
  })

  describe("count", () => {
    it("should throw 401 if not logged in", async () => {
      const unauthedSession = applySession()
      const unauthedCaller = createCaller(createMockRequest(unauthedSession))

      // Act
      const result = unauthedCaller.count({ siteId })

      // Assert
      await expect(result).rejects.toThrowError(
        new TRPCError({ code: "UNAUTHORIZED" }),
      )
    })

    it("should throw 403 if user does not have any permissions to the site", async () => {
      // Act
      const result = caller.count({ siteId })

      // Assert
      await expect(result).rejects.toThrowError(
        new TRPCError({
          code: "FORBIDDEN",
          message:
            "You do not have sufficient permissions to perform this action",
        }),
      )
    })

    it("should not return users with deletedAt set", async () => {
      // Arrange
      await setupEditorPermissions({ userId: session.userId, siteId })

      const user = await setupUser({ email: TEST_EMAIL, isDeleted: true })
      await setupEditorPermissions({ userId: user.id, siteId })

      // Act
      const result = await caller.count({ siteId })

      // Assert
      expect(result).toBe(1) // only the current admin user
    })

    it("should not return users with all permissions deleted", async () => {
      // Arrange
      await setupEditorPermissions({ userId: session.userId, siteId })

      const user = await setupUser({ email: TEST_EMAIL, isDeleted: false })
      await setupEditorPermissions({
        userId: user.id,
        siteId,
        isDeleted: true,
        useCurrentTime: true,
      })
      await setupAdminPermissions({
        userId: user.id,
        siteId,
        isDeleted: true,
        useCurrentTime: true,
      })

      // Act
      const result = await caller.count({ siteId })

      // Assert
      expect(result).toBe(1) // only the current admin user
    })

    it("should return users with at least one non-deleted permission", async () => {
      // Arrange
      await setupEditorPermissions({ userId: session.userId, siteId })

      const user = await setupUser({ email: TEST_EMAIL, isDeleted: false })
      await setupEditorPermissions({
        userId: user.id,
        siteId,
        isDeleted: true, // assuming previously soft deleted
      })
      await setupAdminPermissions({
        userId: user.id,
        siteId,
        isDeleted: false, // assuming being granted new permissions
      })
      // Act
      const result = await caller.count({ siteId })

      // Assert
      expect(result).toBe(2)
    })

    it("should return array with self when no other users exist", async () => {
      // Arrange
      await setupEditorPermissions({ userId: session.userId, siteId })

      // Act
      const result = await caller.count({ siteId })

      // Assert
      expect(result).toBe(1) // only the current admin user
    })

    it("should not return isomer admins if adminType is not set", async () => {
      // Arrange
      await setupEditorPermissions({ userId: session.userId, siteId })
      await setupIsomerAdmins({ siteId })

      // Act
      const result = await caller.count({ siteId })

      // Assert
      expect(result).toBe(1) // only the current admin user
    })

    it("should not return isomer admins if adminType is set to agency", async () => {
      // Arrange
      await setupEditorPermissions({ userId: session.userId, siteId })
      await setupIsomerAdmins({ siteId })

      // Act
      const result = await caller.count({ siteId, adminType: "agency" })

      // Assert
      expect(result).toBe(1) // only the current admin user
    })

    describe("activityType", () => {
      it("if inactive, do not count users who have not logged in at all", async () => {
        // Arrange
        await setupEditorPermissions({ userId: session.userId, siteId })

        const user = await setupUser({ email: TEST_EMAIL, isDeleted: false })
        await setupEditorPermissions({ userId: user.id, siteId })

        // Act
        const result = await caller.count({ siteId, activityType: "inactive" })

        // Assert
        expect(result).toBe(0)
      })

      it("if inactive, do not count active users (logged in within 90 days)", async () => {
        // Arrange
        await setupEditorPermissions({ userId: session.userId, siteId })

        const user = await setupUser({
          email: TEST_EMAIL,
          isDeleted: false,
          hasLoggedIn: true,
        })
        await setupEditorPermissions({ userId: user.id, siteId })

        // Set last login to be within 90 days
        const thirtyDaysAgo = new Date()
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
        await db
          .updateTable("User")
          .set({ lastLoginAt: thirtyDaysAgo })
          .execute()

        // Act
        const result = await caller.count({ siteId, activityType: "inactive" })

        // Assert
        expect(result).toBe(0)
      })
    })

    it("should only return isomer admins if adminType is set as isomer", async () => {
      // Arrange
      await setupEditorPermissions({ userId: session.userId, siteId })
      await setupIsomerAdmins({ siteId })

      // Act
      const result = await caller.count({ siteId, adminType: "isomer" })

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
        siteId,
        userId: "test-user-id",
        role: RoleType.Editor,
      })

      // Assert
      await expect(result).rejects.toThrowError(
        new TRPCError({ code: "UNAUTHORIZED" }),
      )
    })

    it("should throw 403 if user is not admin of the site", async () => {
      // Arrange
      await setupAdminPermissions({ userId: session.userId, siteId })

      const { site: newSite } = await setupSite()

      // Act
      const result = caller.update({
        siteId: newSite.id,
        userId: "test-user-id",
        role: RoleType.Editor,
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

    it("should throw 404 if user does not exist", async () => {
      // Arrange
      await setupAdminPermissions({ userId: session.userId, siteId })

      // Act
      const result = caller.update({
        siteId,
        userId: "non-existent-id",
        role: RoleType.Editor,
      })

      // Assert
      await expect(result).rejects.toThrowError(
        new TRPCError({
          code: "NOT_FOUND",
          message: "User not found",
        }),
      )
    })

    it("should throw 404 if user exist but the permissions do not exist", async () => {
      // Arrange
      await setupAdminPermissions({ userId: session.userId, siteId })

      const user = await setupUser({ email: TEST_EMAIL, isDeleted: false })

      // Act
      const result = caller.update({
        siteId,
        userId: user.id,
        role: RoleType.Editor,
      })

      // Assert
      await expect(result).rejects.toThrowError(
        new TRPCError({
          code: "NOT_FOUND",
          message: "User permissions not found",
        }),
      )
    })

    it("should throw 404 if user to update is not from the same site", async () => {
      // Arrange
      await setupAdminPermissions({ userId: session.userId, siteId })

      const { site: newSite } = await setupSite()
      const newUser = await setupUser({
        email: TEST_EMAIL,
        isDeleted: false,
      })
      await setupAdminPermissions({ userId: newUser.id, siteId: newSite.id })

      // Act
      const result = caller.update({
        siteId,
        userId: newUser.id,
        role: RoleType.Editor,
      })

      // Assert
      await expect(result).rejects.toThrowError(
        new TRPCError({
          code: "NOT_FOUND",
          message: "User permissions not found",
        }),
      )
    })

    it("should throw 404 if user exists but only has non-null deletedAt", async () => {
      // Arrange
      await setupAdminPermissions({ userId: session.userId, siteId })

      const user = await setupUser({ email: TEST_EMAIL, isDeleted: true })

      // Act
      const result = caller.update({
        siteId,
        userId: user.id,
        role: RoleType.Editor,
      })

      // Assert
      await expect(result).rejects.toThrowError(
        new TRPCError({
          code: "NOT_FOUND",
          message: "User not found",
        }),
      )
    })

    it("should throw 403 if user tries to update their own role", async () => {
      // Arrange
      await setupAdminPermissions({ userId: session.userId, siteId })

      // Act
      const result = caller.update({
        siteId,
        userId: session.userId!,
        role: RoleType.Editor,
      })

      // Assert
      await expect(result).rejects.toThrowError(
        new TRPCError({
          code: "FORBIDDEN",
          message: "You cannot update your own role",
        }),
      )
    })

    it("should throw 403 if assigning a non-gov.sg email with admin role", async () => {
      // Arrange
      await setupAdminPermissions({ userId: session.userId, siteId })

      const userToUpdate = await setupUser({
        email: "test@coolvendor.com",
        isDeleted: false,
      })
      await setupEditorPermissions({ userId: userToUpdate.id, siteId })

      // Act
      const result = caller.update({
        siteId,
        userId: userToUpdate.id,
        role: RoleType.Admin,
      })

      // Assert
      await expect(result).rejects.toThrowError(
        new TRPCError({
          code: "FORBIDDEN",
          message:
            "Non-gov.sg emails cannot be added as admin. Select another role.",
        }),
      )
    })

    it("should update a non-gov.sg email with non-admin role successfully", async () => {
      // Arrange
      await setupAdminPermissions({ userId: session.userId, siteId })

      const userToUpdate = await setupUser({
        email: "test@coolvendor.com",
        isDeleted: false,
      })
      await setupEditorPermissions({ userId: userToUpdate.id, siteId })
      const newRole = RoleType.Publisher

      // Act
      const result = await caller.update({
        siteId,
        userId: userToUpdate.id,
        role: newRole,
      })

      // Assert
      expect(result).toEqual(
        expect.objectContaining({
          siteId,
          userId: userToUpdate.id,
          role: newRole,
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
    })

    it("should update a user's role successfully", async () => {
      // Arrange
      await setupAdminPermissions({ userId: session.userId, siteId })

      const userToUpdate = await setupUser({
        email: TEST_EMAIL,
        isDeleted: false,
      })
      await setupEditorPermissions({ userId: userToUpdate.id, siteId })
      const newRole = RoleType.Admin

      // Act
      const result = await caller.update({
        siteId,
        userId: userToUpdate.id,
        role: newRole,
      })

      // Assert
      expect(result).toEqual(
        expect.objectContaining({
          siteId,
          userId: userToUpdate.id,
          role: newRole,
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
    })

    it("when updating a user's role, create a new permission for the user and update the old permission's deletedAt", async () => {
      // Arrange
      await setupAdminPermissions({ userId: session.userId, siteId })

      const userToUpdate = await setupUser({
        email: TEST_EMAIL,
        isDeleted: false,
      })
      // If deletedAt is set, it should not be overwritten
      const originalDeletedPermission = await setupEditorPermissions({
        userId: userToUpdate.id,
        siteId,
      })
      const originalDeletedPermissionDeletedAt = new Date()
      await db
        .updateTable("ResourcePermission")
        .where("id", "=", originalDeletedPermission.id)
        .set({ deletedAt: originalDeletedPermissionDeletedAt })
        .execute()
      // original active permission
      const originalPermission = await setupEditorPermissions({
        userId: userToUpdate.id,
        siteId,
      })
      const newRole = RoleType.Publisher

      // Act
      const result = await caller.update({
        siteId,
        userId: userToUpdate.id,
        role: newRole,
      })

      // Assert
      expect(result).toEqual({
        id: expect.not.stringContaining(originalPermission.id),
        siteId,
        userId: userToUpdate.id,
        role: newRole,
      })

      // Assert: Verify in DB
      const userPermissions = await db
        .selectFrom("ResourcePermission")
        .where("userId", "=", userToUpdate.id)
        .where("siteId", "=", siteId)
        .selectAll()
        .execute()
      expect(userPermissions).toHaveLength(3) // 1 old (deleted) + 1 old (active) + 1 new
      expect(userPermissions).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            id: originalDeletedPermission.id,
            role: RoleType.Editor,
            deletedAt: originalDeletedPermissionDeletedAt,
          }),
          expect.objectContaining({
            id: originalPermission.id,
            role: RoleType.Editor,
            deletedAt: expect.any(Date),
          }),
          expect.objectContaining({
            id: result.id,
            role: RoleType.Publisher,
            deletedAt: null,
          }),
        ]),
      )
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
      await expect(result).rejects.toThrowError(
        new TRPCError({ code: "UNAUTHORIZED" }),
      )
    })

    describe("name validation", () => {
      it("should throw error if name is empty", async () => {
        // Arrange
        const emptyNames = ["", " ", "  "]

        // Act & Assert
        for (const name of emptyNames) {
          await expect(
            caller.updateDetails({ name, phone: "81234567" }),
          ).rejects.toThrow("Name is required")
        }
      })

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
      })
    })

    describe("phone validation", () => {
      const testUserName = "Test User"

      it("should throw error if phone is empty", async () => {
        // Arrange
        const emptyPhones = ["", " ", "  "]

        // Act & Assert
        for (const phone of emptyPhones) {
          await expect(
            caller.updateDetails({ name: "Test User", phone }),
          ).rejects.toThrow("Phone number is required")
        }
      })

      it("should throw error if phone number has incorrect length", async () => {
        // Arrange
        const invalidPhones = ["1234567", "123456789", "812345"]

        // Act & Assert
        for (const phone of invalidPhones) {
          await expect(
            caller.updateDetails({ name: "Test User", phone }),
          ).rejects.toThrow("Phone number must be exactly 8 digits")
        }
      })

      it("should throw error if phone number starts with invalid digit", async () => {
        // Arrange
        const invalidPhones = ["12345678", "23456789", "45678901", "78901234"]

        // Act & Assert
        for (const phone of invalidPhones) {
          await expect(
            caller.updateDetails({ name: "Test User", phone }),
          ).rejects.toThrow("Phone number must start with 6, 8, or 9")
        }
      })

      it("should handle phone numbers with whitespace", async () => {
        // Arrange
        const validPhonesWithSpaces = [
          " 81234567 ",
          "8123 4567",
          " 8123 4567 ",
          "  81234567  ",
        ]

        // Act & Assert
        for (const phone of validPhonesWithSpaces) {
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
        }
      })

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
      })

      it("should accept valid Singapore phone numbers", async () => {
        // Arrange
        const validPhones = ["61234567", "81234567", "91234567"]

        // Act & Assert
        for (const phone of validPhones) {
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
        }
      })
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
      await expect(result).rejects.toThrowError(
        new TRPCError({ code: "UNAUTHORIZED" }),
      )
    })

    it("should throw 403 if user does not have any permissions to the site", async () => {
      // Act
      const result = caller.resendInvite({ siteId, userId: "123" })

      // Assert
      await expect(result).rejects.toThrowError(
        new TRPCError({
          code: "FORBIDDEN",
          message:
            "You do not have sufficient permissions to perform this action",
        }),
      )
    })

    it("should throw 404 if user does not exist", async () => {
      // Arrange
      await setupAdminPermissions({ userId: session.userId, siteId })

      // Act
      const result = caller.resendInvite({ siteId, userId: "123" })

      // Assert
      await expect(result).rejects.toThrowError(
        new TRPCError({
          code: "NOT_FOUND",
          message: "User not found",
        }),
      )
    })

    it("should throw 400 if user has already logged in", async () => {
      // Arrange
      await setupAdminPermissions({ userId: session.userId, siteId })

      const user = await setupUser({
        email: TEST_EMAIL,
        isDeleted: false,
        hasLoggedIn: true,
      })
      await setupEditorPermissions({ userId: user.id, siteId })

      // Act
      const result = caller.resendInvite({ siteId, userId: user.id })

      // Assert
      await expect(result).rejects.toThrowError(
        new TRPCError({
          code: "BAD_REQUEST",
          message: "User has already logged in",
        }),
      )
    })

    it("should throw 400 if user has not logged in and was created before user management launch", async () => {
      // Arrange
      await setupAdminPermissions({ userId: session.userId, siteId })

      const user = await setupUser({
        email: TEST_EMAIL,
        isDeleted: false,
        hasLoggedIn: false,
      })
      await db
        .updateTable("User")
        .where("id", "=", user.id)
        .set({ createdAt: new Date("2025-03-01") })
        .execute()
      await setupEditorPermissions({ userId: user.id, siteId })

      // Act
      const result = caller.resendInvite({ siteId, userId: user.id })

      // Assert
      await expect(result).rejects.toThrowError(
        new TRPCError({
          code: "BAD_REQUEST",
          message: "User has already logged in",
        }),
      )
    })

    it("should throw 400 if user does not have any permissions to the site", async () => {
      // Arrange
      await setupAdminPermissions({ userId: session.userId, siteId })

      const user = await setupUser({
        email: TEST_EMAIL,
        isDeleted: false,
        hasLoggedIn: false,
      })
      await db
        .updateTable("User")
        .where("id", "=", user.id)
        .set({ createdAt: new Date("2025-03-10") })
        .execute()

      // Act
      const result = caller.resendInvite({ siteId, userId: user.id })

      // Assert
      await expect(result).rejects.toThrowError(
        new TRPCError({
          code: "BAD_REQUEST",
          message: "User has no permissions",
        }),
      )
    })

    it("should send invite successfully", async () => {
      // Arrange
      await setupAdminPermissions({ userId: session.userId, siteId })

      const user = await setupUser({
        email: TEST_EMAIL,
        isDeleted: false,
        hasLoggedIn: false,
      })
      await db
        .updateTable("User")
        .where("id", "=", user.id)
        .set({ createdAt: new Date("2025-03-10") })
        .execute()
      await setupEditorPermissions({ userId: user.id, siteId })

      // Act
      const result = await caller.resendInvite({ siteId, userId: user.id })

      // Assert
      expect(result).toEqual({ email: user.email })
    })
  })
})
