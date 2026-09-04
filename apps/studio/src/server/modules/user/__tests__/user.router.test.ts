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
import { db, jsonb, RoleType } from "~/server/modules/database"
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
      await setupAdminPermissions({ userId: session.userId, siteId })

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
      await setupAdminPermissions({ userId: session.userId, siteId })

      // Act
      const result = caller.create({
        siteId,
        users: [{ email: "not-an-email" }],
      })

      // Assert
      await expect(result).rejects.toThrow(/./)

      // Assert DB - audit logs
      const auditLogs = await db.selectFrom("AuditLog").selectAll().execute()
      expect(auditLogs).toHaveLength(0)
    })

    describe("should create user if user already exists but has non-null deletedAt", () => {
      const roleToCreate = RoleType.Editor
      let user: Awaited<ReturnType<typeof setupUser>>
      let createdUsers: Awaited<ReturnType<typeof caller.create>>
      let createdUser: (typeof createdUsers)[number]
      let dbUserResult: Awaited<
        ReturnType<ReturnType<typeof db.selectFrom<"User">>["execute"]>
      >
      let resourcePermissions: Awaited<
        ReturnType<
          ReturnType<typeof db.selectFrom<"ResourcePermission">>["execute"]
        >
      >
      let userAuditEntry: Awaited<
        ReturnType<ReturnType<typeof db.selectFrom<"AuditLog">>["execute"]>
      >
      let permissionAuditEntry: Awaited<
        ReturnType<ReturnType<typeof db.selectFrom<"AuditLog">>["execute"]>
      >

      beforeEach(async () => {
        await setupAdminPermissions({ userId: session.userId, siteId })
        user = await setupUser({ email: TEST_EMAIL, isDeleted: true })

        createdUsers = await caller.create({
          siteId,
          users: [{ email: user.email, role: roleToCreate }],
        })
        createdUser = createdUsers[0]!

        dbUserResult = await db
          .selectFrom("User")
          .where("email", "=", TEST_EMAIL)
          .selectAll()
          .execute()
        resourcePermissions = await db
          .selectFrom("ResourcePermission")
          .where("userId", "=", createdUser?.id ?? "")
          .where("siteId", "=", siteId)
          .selectAll()
          .execute()
        userAuditEntry = await db
          .selectFrom("AuditLog")
          .where("eventType", "=", "UserCreate")
          .selectAll()
          .execute()
        permissionAuditEntry = await db
          .selectFrom("AuditLog")
          .where("eventType", "=", "PermissionCreate")
          .selectAll()
          .execute()
      })

      it("should return the newly created user", () => {
        expect(createdUsers).toHaveLength(1)
        expect(createdUser).toStrictEqual(
          expect.objectContaining({
            email: TEST_EMAIL,
            id: expect.any(String),
          }),
        )
      })

      it("should create a new user record alongside the deleted one", () => {
        expect(dbUserResult).toHaveLength(2)
        expect(dbUserResult).toStrictEqual([
          expect.objectContaining({
            email: TEST_EMAIL,
            id: user.id,
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
        expect(resourcePermissions).toHaveLength(1)
        expect(resourcePermissions).toStrictEqual([
          expect.objectContaining({
            userId: expect.any(String),
            siteId,
            role: roleToCreate,
          }),
        ])
      })

      it("should create a UserCreate audit log", () => {
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
      })

      it("should create a PermissionCreate audit log", () => {
        expect(permissionAuditEntry).toHaveLength(1)
        expect(permissionAuditEntry[0]).toMatchObject({
          eventType: "PermissionCreate",
          delta: expect.objectContaining({
            before: null,
            after: expect.objectContaining(
              omit(resourcePermissions[0], ["createdAt", "updatedAt"]),
            ),
          }),
        })
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
      await setupAdminPermissions({ userId: session.userId, siteId })

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
      await setupAdminPermissions({ userId: session.userId, siteId })

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
      await setupAdminPermissions({ userId: session.userId, siteId })
      await setUpWhitelist({ email: nonGovSgEmail, expiry: oneYearFromNow })

      // Act
      const result = await caller.create({
        siteId,
        users: [{ email: nonGovSgEmail, role: RoleType.Admin }],
      })

      // Assert
      expect(result).toStrictEqual(expect.anything())
    })

    it("should create a whitelisted non-gov.sg email with admin role", async () => {
      // Arrange
      const nonGovSgEmail = "test@coolvendor.com"
      await setupAdminPermissions({ userId: session.userId, siteId })
      await setUpWhitelist({ email: nonGovSgEmail })

      // Act
      const result = await caller.create({
        siteId,
        users: [{ email: nonGovSgEmail, role: RoleType.Admin }],
      })

      // Assert
      expect(result).toStrictEqual(expect.anything())
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
      expect(result).toStrictEqual(expect.anything())

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

    describe("should create user permissions successfully if user already exists but permissions do not exist", () => {
      let existingUser: Awaited<ReturnType<typeof setupUser>>
      let result: Awaited<ReturnType<typeof caller.create>>
      let createdUser: (typeof result)[number]
      let dbUserResult: Awaited<
        ReturnType<ReturnType<typeof db.selectFrom<"User">>["execute"]>
      >
      let resourcePermissions: Awaited<
        ReturnType<
          ReturnType<typeof db.selectFrom<"ResourcePermission">>["execute"]
        >
      >
      let userAuditEntries: Awaited<
        ReturnType<ReturnType<typeof db.selectFrom<"AuditLog">>["execute"]>
      >
      let permissionAuditEntry: Awaited<
        ReturnType<ReturnType<typeof db.selectFrom<"AuditLog">>["execute"]>
      >

      beforeEach(async () => {
        await setupAdminPermissions({ userId: session.userId, siteId })
        existingUser = await setupUser({ email: TEST_EMAIL, isDeleted: false })

        result = await caller.create({
          siteId,
          users: [{ email: TEST_EMAIL }],
        })
        createdUser = result[0]!

        dbUserResult = await db
          .selectFrom("User")
          .where("email", "=", TEST_EMAIL)
          .selectAll()
          .execute()
        resourcePermissions = await db
          .selectFrom("ResourcePermission")
          .where("userId", "=", existingUser.id)
          .where("siteId", "=", siteId)
          .selectAll()
          .execute()
        userAuditEntries = await db
          .selectFrom("AuditLog")
          .where("eventType", "=", "UserCreate")
          .selectAll()
          .execute()
        permissionAuditEntry = await db
          .selectFrom("AuditLog")
          .where("eventType", "=", "PermissionCreate")
          .selectAll()
          .execute()
      })

      it("should return the existing user", () => {
        expect(result).toHaveLength(1)
        expect(createdUser).toStrictEqual(
          expect.objectContaining({
            email: TEST_EMAIL,
            id: expect.any(String),
          }),
        )
      })

      it("should not create a new user record", () => {
        expect(dbUserResult).toHaveLength(1)
      })

      it("should create resource permission for the existing user", () => {
        expect(resourcePermissions).toHaveLength(1)
        expect(resourcePermissions).toStrictEqual([
          expect.objectContaining({
            userId: createdUser?.id,
            siteId,
            role: RoleType.Editor,
          }),
        ])
      })

      it("should not create a UserCreate audit log", () => {
        expect(userAuditEntries).toHaveLength(0)
      })

      it("should create a PermissionCreate audit log", () => {
        expect(permissionAuditEntry).toHaveLength(1)
        expect(permissionAuditEntry[0]).toMatchObject({
          eventType: "PermissionCreate",
          delta: expect.objectContaining({
            before: null,
            after: expect.objectContaining(
              omit(resourcePermissions[0], ["createdAt", "updatedAt"]),
            ),
          }),
        })
      })
    })

    describe("should create both user and permissions successfully if user is admin", () => {
      let createdUsers: Awaited<ReturnType<typeof caller.create>>
      let createdUser: (typeof createdUsers)[number]
      let user: Awaited<
        ReturnType<
          ReturnType<typeof db.selectFrom<"User">>["executeTakeFirstOrThrow"]
        >
      >
      let resourcePermissions: Awaited<
        ReturnType<
          ReturnType<typeof db.selectFrom<"ResourcePermission">>["execute"]
        >
      >
      let userAuditEntries: Awaited<
        ReturnType<ReturnType<typeof db.selectFrom<"AuditLog">>["execute"]>
      >
      let permissionAuditEntry: Awaited<
        ReturnType<ReturnType<typeof db.selectFrom<"AuditLog">>["execute"]>
      >

      beforeEach(async () => {
        await setupAdminPermissions({ userId: session.userId, siteId })

        createdUsers = await caller.create({
          siteId,
          users: [{ email: TEST_EMAIL }],
        })
        createdUser = createdUsers[0]!

        user = await db
          .selectFrom("User")
          .where("email", "=", TEST_EMAIL)
          .selectAll()
          .executeTakeFirstOrThrow()
        resourcePermissions = await db
          .selectFrom("ResourcePermission")
          .where("userId", "=", user.id)
          .where("siteId", "=", siteId)
          .selectAll()
          .execute()
        userAuditEntries = await db
          .selectFrom("AuditLog")
          .where("eventType", "=", "UserCreate")
          .selectAll()
          .execute()
        permissionAuditEntry = await db
          .selectFrom("AuditLog")
          .where("eventType", "=", "PermissionCreate")
          .selectAll()
          .execute()
      })

      it("should return the newly created user", () => {
        expect(createdUsers).toHaveLength(1)
        expect(createdUser).toStrictEqual(
          expect.objectContaining({
            email: TEST_EMAIL,
            id: expect.any(String),
          }),
        )
      })

      it("should persist the user in the database", () => {
        expect(user).toMatchObject({
          email: TEST_EMAIL,
          id: createdUser?.id,
          deletedAt: null,
        })
      })

      it("should create resource permission for the user", () => {
        expect(resourcePermissions).toHaveLength(1)
        expect(resourcePermissions).toStrictEqual([
          expect.objectContaining({
            userId: createdUser?.id,
            siteId,
          }),
        ])
      })

      it("should create a UserCreate audit log", () => {
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
      })

      it("should create a PermissionCreate audit log", () => {
        expect(permissionAuditEntry).toHaveLength(1)
        expect(permissionAuditEntry[0]).toMatchObject({
          eventType: "PermissionCreate",
          delta: expect.objectContaining({
            before: null,
            after: expect.objectContaining(
              omit(resourcePermissions[0], ["createdAt", "updatedAt"]),
            ),
          }),
        })
      })
    })

    // Skip for now as we aren't working on multiple users creation yet
    // oxlint-disable-next-line vitest/warn-todo
    it.todo("should create multiple users successfully if user is admin")

    // oxlint-disable-next-line vitest/warn-todo
    it.todo("should not create any users if one of the emails is invalid")
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
      await setupAdminPermissions({ userId: session.userId, siteId })

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
      await setupAdminPermissions({ userId: session.userId, siteId })

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
      await setupAdminPermissions({ userId: session.userId, siteId })

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
      await setupAdminPermissions({ userId: session.userId, siteId })

      const isomerAdmin = await setupUser({
        email: "testisomeradmin@open.gov.sg",
        isDeleted: false,
      })
      await setupAdminPermissions({ userId: isomerAdmin.id, siteId })
      await db
        .insertInto("IsomerAdmin")
        .values({
          userId: isomerAdmin.id,
          role: IsomerAdminRole.Core,
          expiry: null,
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

    describe("should soft delete an existing user's permissions successfully", () => {
      let userToDelete: Awaited<ReturnType<typeof setupUser>>
      let result: Awaited<ReturnType<typeof caller.delete>>
      let deletedUserPermissions: Awaited<
        ReturnType<
          ReturnType<typeof db.selectFrom<"ResourcePermission">>["execute"]
        >
      >
      let userDeleteAuditLogs: Awaited<
        ReturnType<ReturnType<typeof db.selectFrom<"AuditLog">>["execute"]>
      >
      let permissionsAuditLogs: Awaited<
        ReturnType<ReturnType<typeof db.selectFrom<"AuditLog">>["execute"]>
      >

      beforeEach(async () => {
        await setupAdminPermissions({ userId: session.userId, siteId })
        userToDelete = await setupUser({
          email: TEST_EMAIL,
          isDeleted: false,
        })
        await setupEditorPermissions({ userId: userToDelete.id, siteId })

        result = await caller.delete({
          siteId,
          userId: userToDelete.id,
        })

        deletedUserPermissions = await db
          .selectFrom("ResourcePermission")
          .where("userId", "=", userToDelete.id)
          .where("siteId", "=", siteId)
          .select("deletedAt")
          .execute()
        userDeleteAuditLogs = await db
          .selectFrom("AuditLog")
          .where("eventType", "=", "UserDelete")
          .selectAll()
          .execute()
        permissionsAuditLogs = await db
          .selectFrom("AuditLog")
          .where("eventType", "=", "PermissionDelete")
          .selectAll()
          .execute()
      })

      it("should return the deleted user", () => {
        expect(result).toStrictEqual(
          expect.objectContaining({
            id: userToDelete.id,
            email: userToDelete.email,
          }),
        )
      })

      it("should soft-delete the user's permissions", () => {
        expect(deletedUserPermissions).toHaveLength(1)
        expect(deletedUserPermissions[0]?.deletedAt).not.toBeNull()
      })

      it("should not create a UserDelete audit log", () => {
        expect(userDeleteAuditLogs).toHaveLength(0)
      })

      it("should create a PermissionDelete audit log", () => {
        expect(permissionsAuditLogs).toHaveLength(1)
        expect(permissionsAuditLogs[0]).toMatchObject({
          eventType: "PermissionDelete",
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
        })
      })
    })

    describe("should soft delete a user's permissions and not their account", () => {
      let userToDelete: Awaited<ReturnType<typeof setupUser>>
      let result: Awaited<ReturnType<typeof caller.delete>>
      let dbUsers: Awaited<
        ReturnType<ReturnType<typeof db.selectFrom<"User">>["execute"]>
      >
      let userDeleteAuditLogs: Awaited<
        ReturnType<ReturnType<typeof db.selectFrom<"AuditLog">>["execute"]>
      >
      let deletedUserPermission: Awaited<
        ReturnType<
          ReturnType<
            typeof db.selectFrom<"ResourcePermission">
          >["executeTakeFirst"]
        >
      >
      let permissionsAuditLogs: Awaited<
        ReturnType<ReturnType<typeof db.selectFrom<"AuditLog">>["execute"]>
      >

      beforeEach(async () => {
        await setupAdminPermissions({ userId: session.userId, siteId })
        userToDelete = await setupUser({
          email: TEST_EMAIL,
          isDeleted: false,
        })
        await setupEditorPermissions({ userId: userToDelete.id, siteId })

        result = await caller.delete({
          siteId,
          userId: userToDelete.id,
        })

        dbUsers = await db
          .selectFrom("User")
          .where("id", "=", userToDelete.id)
          .select("deletedAt")
          .execute()
        userDeleteAuditLogs = await db
          .selectFrom("AuditLog")
          .where("eventType", "=", "UserDelete")
          .selectAll()
          .execute()
        deletedUserPermission = await db
          .selectFrom("ResourcePermission")
          .where("userId", "=", userToDelete.id)
          .where("siteId", "=", siteId)
          .select("deletedAt")
          .executeTakeFirst()
        permissionsAuditLogs = await db
          .selectFrom("AuditLog")
          .where("eventType", "=", "PermissionDelete")
          .selectAll()
          .execute()
      })

      it("should return the user without deleting their account", () => {
        expect(result).toStrictEqual(
          expect.objectContaining({
            id: userToDelete.id,
            email: userToDelete.email,
          }),
        )
      })

      it("should leave the user account active", () => {
        expect(dbUsers).toHaveLength(1)
        expect(dbUsers[0]?.deletedAt).toBeNull()
      })

      it("should not create a UserDelete audit log", () => {
        expect(userDeleteAuditLogs).toHaveLength(0)
      })

      it("should create a PermissionDelete audit log", () => {
        expect(permissionsAuditLogs).toHaveLength(1)
        expect(permissionsAuditLogs[0]).toMatchObject({
          eventType: "PermissionDelete",
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
        })
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
      await setupEditorPermissions({ userId: session.userId, siteId })

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
      await expect(result).rejects.toThrow(
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
      await expect(result).rejects.toThrow(
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
      expect(result).toStrictEqual(
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
      expect(result).toStrictEqual(
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
      expect(result).toStrictEqual([
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
      expect(result).toStrictEqual([
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

    it("should return users with emails in ascending alphabetical order", async () => {
      // Arrange
      await setupEditorPermissions({ userId: session.userId, siteId })

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
        [userA, userB, userC].map((user) =>
          setupEditorPermissions({ userId: user.id, siteId }),
        ),
      )

      // Act
      const result = await caller.list({ siteId })

      // Assert
      expect(result).toHaveLength(4) // current user + 3 new users
      expect(result.map((user) => user.email).slice(0, 3)).toStrictEqual([
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
      await expect(result).rejects.toThrow(
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
      const result = caller.update({
        siteId: newSite.id,
        userId: "test-user-id",
        role: RoleType.Editor,
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
      await setupAdminPermissions({ userId: session.userId, siteId })

      // Act
      const result = caller.update({
        siteId,
        userId: "non-existent-id",
        role: RoleType.Editor,
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
      await setupAdminPermissions({ userId: session.userId, siteId })

      const user = await setupUser({ email: TEST_EMAIL, isDeleted: false })

      // Act
      const result = caller.update({
        siteId,
        userId: user.id,
        role: RoleType.Editor,
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
      await setupAdminPermissions({ userId: session.userId, siteId })

      const user = await setupUser({ email: TEST_EMAIL, isDeleted: true })

      // Act
      const result = caller.update({
        siteId,
        userId: user.id,
        role: RoleType.Editor,
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
      await setupAdminPermissions({ userId: session.userId, siteId })

      // Act
      const result = caller.update({
        siteId,
        userId: session.userId!,
        role: RoleType.Editor,
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
      await setupAdminPermissions({ userId: session.userId, siteId })

      const userToUpdate = await setupUser({
        email: "test-not-whitelisted@coolvendor.com",
        isDeleted: false,
      })
      await setupEditorPermissions({ userId: userToUpdate.id, siteId })

      // Act
      const result = await caller.update({
        siteId,
        userId: userToUpdate.id,
        role: RoleType.Admin,
      })

      // Assert
      expect(result).toStrictEqual(
        expect.objectContaining({
          siteId,
          userId: userToUpdate.id,
          role: RoleType.Admin,
        }),
      )
    })

    it("should update a whitelisted non-gov.sg email to admin role successfully", async () => {
      // Arrange
      await setupAdminPermissions({ userId: session.userId, siteId })

      const userToUpdate = await setupUser({
        email: "test@coolvendor.com",
        isDeleted: false,
      })
      await setupEditorPermissions({ userId: userToUpdate.id, siteId })
      await setUpWhitelist({ email: userToUpdate.email })

      // Act
      const result = await caller.update({
        siteId,
        userId: userToUpdate.id,
        role: RoleType.Admin,
      })

      // Assert
      expect(result).toStrictEqual(
        expect.objectContaining({
          siteId,
          userId: userToUpdate.id,
          role: RoleType.Admin,
        }),
      )
    })

    it("should update a temporarily (vendor) whitelisted non-gov.sg email to admin role successfully", async () => {
      // Arrange
      await setupAdminPermissions({ userId: session.userId, siteId })

      const userToUpdate = await setupUser({
        email: "test-vendor-whitelisted@coolvendor.com",
        isDeleted: false,
      })
      await setupEditorPermissions({ userId: userToUpdate.id, siteId })
      const oneYearFromNow = new Date()
      oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1)
      await setUpWhitelist({
        email: userToUpdate.email,
        expiry: oneYearFromNow,
      })

      // Act
      const result = await caller.update({
        siteId,
        userId: userToUpdate.id,
        role: RoleType.Admin,
      })

      // Assert
      expect(result).toStrictEqual(
        expect.objectContaining({
          siteId,
          userId: userToUpdate.id,
          role: RoleType.Admin,
        }),
      )
    })

    describe("should update a non-gov.sg email with non-admin role successfully", () => {
      const newRole = RoleType.Publisher
      let userToUpdate: Awaited<ReturnType<typeof setupUser>>
      let currentPermission: Awaited<ReturnType<typeof setupEditorPermissions>>
      let result: Awaited<ReturnType<typeof caller.update>>
      let deletedPermissionAuditLogs: Awaited<
        ReturnType<ReturnType<typeof db.selectFrom<"AuditLog">>["execute"]>
      >
      let newPermission: Awaited<
        ReturnType<
          ReturnType<
            typeof db.selectFrom<"ResourcePermission">
          >["executeTakeFirst"]
        >
      >
      let newPermissionAuditLogs: Awaited<
        ReturnType<ReturnType<typeof db.selectFrom<"AuditLog">>["execute"]>
      >

      beforeEach(async () => {
        await setupAdminPermissions({ userId: session.userId, siteId })
        userToUpdate = await setupUser({
          email: "test@coolvendor.com",
          isDeleted: false,
        })
        currentPermission = await setupEditorPermissions({
          userId: userToUpdate.id,
          siteId,
        })

        result = await caller.update({
          siteId,
          userId: userToUpdate.id,
          role: newRole,
        })

        deletedPermissionAuditLogs = await db
          .selectFrom("AuditLog")
          .where("eventType", "=", "PermissionDelete")
          .selectAll()
          .execute()
        newPermission = await db
          .selectFrom("ResourcePermission")
          .where("userId", "=", userToUpdate.id)
          .where("siteId", "=", siteId)
          .where("role", "=", newRole)
          .selectAll()
          .executeTakeFirst()
        newPermissionAuditLogs = await db
          .selectFrom("AuditLog")
          .where("eventType", "=", "PermissionCreate")
          .selectAll()
          .execute()
      })

      it("should return the updated permission", () => {
        expect(result).toStrictEqual(
          expect.objectContaining({
            siteId,
            userId: userToUpdate.id,
            role: newRole,
          }),
        )
      })

      it("should persist the new role in the database", async () => {
        const updatedUser = await db
          .selectFrom("ResourcePermission")
          .where("userId", "=", userToUpdate.id)
          .where("siteId", "=", siteId)
          .where("role", "=", newRole)
          .select("role")
          .executeTakeFirst()
        expect(updatedUser).not.toBeNull()
      })

      it("should create a PermissionDelete audit log for the old permission", () => {
        expect(deletedPermissionAuditLogs).toHaveLength(1)
        expect(deletedPermissionAuditLogs[0]).toMatchObject({
          eventType: "PermissionDelete",
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
        })
      })

      it("should create a PermissionCreate audit log for the new permission", () => {
        expect(newPermissionAuditLogs).toHaveLength(1)
        expect(newPermissionAuditLogs[0]).toMatchObject({
          eventType: "PermissionCreate",
          delta: expect.objectContaining({
            before: null,
            after: expect.objectContaining({
              ...omit(newPermission, ["createdAt", "updatedAt"]),
            }),
          }),
        })
      })
    })

    describe("should update a user's role successfully", () => {
      const newRole = RoleType.Admin
      let userToUpdate: Awaited<ReturnType<typeof setupUser>>
      let currentPermission: Awaited<ReturnType<typeof setupEditorPermissions>>
      let result: Awaited<ReturnType<typeof caller.update>>
      let deletedPermissionAuditLogs: Awaited<
        ReturnType<ReturnType<typeof db.selectFrom<"AuditLog">>["execute"]>
      >
      let newPermission: Awaited<
        ReturnType<
          ReturnType<
            typeof db.selectFrom<"ResourcePermission">
          >["executeTakeFirst"]
        >
      >
      let newPermissionAuditLogs: Awaited<
        ReturnType<ReturnType<typeof db.selectFrom<"AuditLog">>["execute"]>
      >

      beforeEach(async () => {
        await setupAdminPermissions({ userId: session.userId, siteId })
        userToUpdate = await setupUser({
          email: TEST_EMAIL,
          isDeleted: false,
        })
        currentPermission = await setupEditorPermissions({
          userId: userToUpdate.id,
          siteId,
        })

        result = await caller.update({
          siteId,
          userId: userToUpdate.id,
          role: newRole,
        })

        deletedPermissionAuditLogs = await db
          .selectFrom("AuditLog")
          .where("eventType", "=", "PermissionDelete")
          .selectAll()
          .execute()
        newPermission = await db
          .selectFrom("ResourcePermission")
          .where("userId", "=", userToUpdate.id)
          .where("siteId", "=", siteId)
          .where("role", "=", newRole)
          .selectAll()
          .executeTakeFirst()
        newPermissionAuditLogs = await db
          .selectFrom("AuditLog")
          .where("eventType", "=", "PermissionCreate")
          .selectAll()
          .execute()
      })

      it("should return the updated permission", () => {
        expect(result).toStrictEqual(
          expect.objectContaining({
            siteId,
            userId: userToUpdate.id,
            role: newRole,
          }),
        )
      })

      it("should persist the new role in the database", async () => {
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

      it("should create a PermissionDelete audit log for the old permission", () => {
        expect(deletedPermissionAuditLogs).toHaveLength(1)
        expect(deletedPermissionAuditLogs[0]).toMatchObject({
          eventType: "PermissionDelete",
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
        })
      })

      it("should create a PermissionCreate audit log for the new permission", () => {
        expect(newPermissionAuditLogs).toHaveLength(1)
        expect(newPermissionAuditLogs[0]).toMatchObject({
          eventType: "PermissionCreate",
          delta: expect.objectContaining({
            before: null,
            after: expect.objectContaining({
              ...omit(newPermission, ["createdAt", "updatedAt"]),
            }),
          }),
        })
      })
    })

    describe("when updating a user's role, create a new permission for the user and update the old permission's deletedAt", () => {
      const newRole = RoleType.Publisher
      let userToUpdate: Awaited<ReturnType<typeof setupUser>>
      let originalDeletedPermission: Awaited<
        ReturnType<typeof setupEditorPermissions>
      >
      let originalDeletedPermissionDeletedAt: Date
      let originalPermission: Awaited<ReturnType<typeof setupEditorPermissions>>
      let result: Awaited<ReturnType<typeof caller.update>>
      let userPermissions: Awaited<
        ReturnType<
          ReturnType<typeof db.selectFrom<"ResourcePermission">>["execute"]
        >
      >
      let deletedPermissionAuditLogs: Awaited<
        ReturnType<ReturnType<typeof db.selectFrom<"AuditLog">>["execute"]>
      >
      let createdPermissionAuditLogs: Awaited<
        ReturnType<ReturnType<typeof db.selectFrom<"AuditLog">>["execute"]>
      >

      beforeEach(async () => {
        await setupAdminPermissions({ userId: session.userId, siteId })
        userToUpdate = await setupUser({
          email: TEST_EMAIL,
          isDeleted: false,
        })
        originalDeletedPermission = await setupEditorPermissions({
          userId: userToUpdate.id,
          siteId,
        })
        originalDeletedPermissionDeletedAt = new Date()
        await db
          .updateTable("ResourcePermission")
          .where("id", "=", originalDeletedPermission.id)
          .set({ deletedAt: originalDeletedPermissionDeletedAt })
          .execute()
        originalPermission = await setupEditorPermissions({
          userId: userToUpdate.id,
          siteId,
        })

        result = await caller.update({
          siteId,
          userId: userToUpdate.id,
          role: newRole,
        })

        userPermissions = await db
          .selectFrom("ResourcePermission")
          .where("userId", "=", userToUpdate.id)
          .where("siteId", "=", siteId)
          .selectAll()
          .execute()
        deletedPermissionAuditLogs = await db
          .selectFrom("AuditLog")
          .where("eventType", "=", "PermissionDelete")
          .selectAll()
          .execute()
        createdPermissionAuditLogs = await db
          .selectFrom("AuditLog")
          .where("eventType", "=", "PermissionCreate")
          .selectAll()
          .execute()
      })

      it("should return a new permission with the updated role", () => {
        expect(result).toStrictEqual({
          id: expect.not.stringContaining(originalPermission.id),
          siteId,
          userId: userToUpdate.id,
          role: newRole,
        })
      })

      it("should soft-delete the active permission and preserve prior deleted permissions", () => {
        expect(userPermissions).toHaveLength(3)
        expect(userPermissions).toStrictEqual(
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

      it("should create a PermissionDelete audit log for the active permission", () => {
        expect(deletedPermissionAuditLogs).toHaveLength(1)
        expect(deletedPermissionAuditLogs[0]).toMatchObject({
          eventType: "PermissionDelete",
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
            }),
          }),
        })
      })

      it("should create a PermissionCreate audit log for the new permission", () => {
        expect(createdPermissionAuditLogs).toHaveLength(1)
        expect(createdPermissionAuditLogs[0]).toMatchObject({
          eventType: "PermissionCreate",
          delta: expect.objectContaining({
            before: null,
            after: expect.objectContaining({
              ...omit(
                userPermissions.find((p) => p.deletedAt === null),
                ["createdAt", "updatedAt"],
              ),
            }),
          }),
        })
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
      it.each(["", " ", "  "])(
        "should throw error if name is empty: %s",
        async (emptyName) => {
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
        },
      )

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
          eventType: "UserUpdate",
          delta: expect.objectContaining({
            before: expect.objectContaining({
              name: MOCK_TEST_USER_NAME,
              phone: MOCK_TEST_PHONE,
            }),
            after: expect.objectContaining(
              omit(updatedUser, ["createdAt", "updatedAt", "deletedAt"]),
            ),
          }),
        })
      })
    })

    describe("phone validation", () => {
      const testUserName = "Test User"

      it.each(["", " ", "  "])(
        "should throw error if phone is empty: %s",
        async (emptyPhone) => {
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
        },
      )

      it.each(["1234567", "123456789", "812345"])(
        "should throw error if phone number has incorrect length: %s",
        async (phone) => {
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
        },
      )

      it.each(["12345678", "23456789", "45678901", "78901234"])(
        "should throw error if phone number starts with invalid digit: %s",
        async (phone) => {
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
        },
      )

      it.each([
        " 81234567 ",
        "8123 4567",
        " 8123 4567 ",
        "  81234567  ",
      ])("should handle phone numbers with whitespace: %s", async (phone) => {
          // Act & Assert
          const result = await caller.updateDetails({
            name: testUserName,
            phone,
          })
          expect(result).toStrictEqual({ name: testUserName, phone: "81234567" })

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
            eventType: "UserUpdate",
            delta: expect.objectContaining({
              before: expect.objectContaining({
                name: MOCK_TEST_USER_NAME,
                phone: MOCK_TEST_PHONE,
              }),
              after: expect.objectContaining(
                omit(updatedUser, ["createdAt", "updatedAt", "deletedAt"]),
              ),
            }),
          })
        })

      it("should remove +65 country code if present", async () => {
        // Arrange
        const phone = "+6581234567"

        // Act
        const result = await caller.updateDetails({ name: testUserName, phone })

        // Assert
        expect(result).toStrictEqual({ name: testUserName, phone: "81234567" })

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
          eventType: "UserUpdate",
          delta: expect.objectContaining({
            before: expect.objectContaining({
              name: MOCK_TEST_USER_NAME,
              phone: MOCK_TEST_PHONE,
            }),
            after: expect.objectContaining(
              omit(updatedUser, ["createdAt", "updatedAt", "deletedAt"]),
            ),
          }),
        })
      })

      it.each(["61234567", "81234567", "91234567"])(
        "should accept valid Singapore phone numbers: %s",
        async (phone) => {
          // Act & Assert
          const result = await caller.updateDetails({
            name: testUserName,
            phone,
          })
          expect(result).toStrictEqual({ name: testUserName, phone })

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
            eventType: "UserUpdate",
            delta: expect.objectContaining({
              before: expect.objectContaining({
                name: MOCK_TEST_USER_NAME,
                phone: MOCK_TEST_PHONE,
              }),
              after: expect.objectContaining(
                omit(updatedUser, ["createdAt", "updatedAt", "deletedAt"]),
              ),
            }),
          })
        },
      )
    })

    it("should update user details successfully", async () => {
      // Arrange
      const name = "Test User"
      const phone = "81234567"

      // Act
      const result = await caller.updateDetails({ name, phone })

      // Assert
      expect(result).toStrictEqual({ name, phone })

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
        eventType: "UserUpdate",
        delta: expect.objectContaining({
          before: expect.objectContaining({
            name: MOCK_TEST_USER_NAME,
            phone: MOCK_TEST_PHONE,
          }),
          after: expect.objectContaining(
            omit(updatedUser, ["createdAt", "updatedAt", "deletedAt"]),
          ),
        }),
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
      await setupPublisherPermissions({ userId: session.userId, siteId })

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
      await setupAdminPermissions({ userId: session.userId, siteId })

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
      await setupAdminPermissions({ userId: session.userId, siteId })

      const user = await setupUser({
        email: TEST_EMAIL,
        isDeleted: false,
        lastLoginAt: MOCK_STORY_DATE,
      })
      await setupEditorPermissions({ userId: user.id, siteId })

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
      await setupAdminPermissions({ userId: session.userId, siteId })

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
      await setupEditorPermissions({ userId: user.id, siteId })

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
      await setupAdminPermissions({ userId: session.userId, siteId })

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
      await setupAdminPermissions({ userId: session.userId, siteId })

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
      await setupEditorPermissions({ userId: user.id, siteId })

      // Act
      const result = await caller.resendInvite({ siteId, userId: user.id })

      // Assert
      expect(result).toStrictEqual({ email: user.email })
    })

    it("should fall back to Site.name when Site.config is JSON null", async () => {
      // Arrange
      await setupAdminPermissions({ userId: session.userId, siteId })

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
      await setupEditorPermissions({ userId: user.id, siteId })

      // Simulate malformed-but-allowed JSONB payload written by admin JSON API.
      await db
        .updateTable("Site")
        .where("id", "=", siteId)
        .set({ config: jsonb(null) })
        .execute()

      // Act
      const result = await caller.resendInvite({ siteId, userId: user.id })

      // Assert
      expect(result).toStrictEqual({ email: user.email })
    })
  })
})
