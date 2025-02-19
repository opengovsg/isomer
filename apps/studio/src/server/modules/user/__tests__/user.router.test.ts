import { TRPCError } from "@trpc/server"
import { resetTables } from "tests/integration/helpers/db"
import {
  applyAuthedSession,
  applySession,
  createMockRequest,
} from "tests/integration/helpers/iron-session"
import {
  setupAdminPermissions,
  setUpEditorPermissions,
  setupSite,
  setupUser,
} from "tests/integration/helpers/seed"
import { MOCK_TEST_USER_NAME } from "tests/msw/constants"
import { beforeEach, describe, expect, it } from "vitest"

import { db, RoleType } from "~/server/modules/database"
import { createCallerFactory } from "~/server/trpc"
import { userRouter } from "../user.router"

const createCaller = createCallerFactory(userRouter)

describe("user.router", () => {
  const TEST_EMAIL = "test@open.gov.sg"

  let caller: ReturnType<typeof createCaller>
  let session: Awaited<ReturnType<typeof applyAuthedSession>>
  let siteId: number

  beforeEach(async () => {
    await resetTables("User", "Site", "ResourcePermission")

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
    })

    it("should throw error if email is empty string", async () => {
      // Arrange
      await setupAdminPermissions({ userId: session.userId, siteId })

      // Act
      const result = caller.create({
        siteId,
        users: [{ email: "" }],
      })

      // Assert
      await expect(result).rejects.toThrowError()
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
    })

    it("should throw 409 if user already exists but has non-null deletedAt", async () => {
      // Arrange
      await setupAdminPermissions({ userId: session.userId, siteId })

      const user = await setupUser({ email: TEST_EMAIL, isDeleted: true })

      // Act
      const result = caller.create({
        siteId,
        users: [{ email: user.email }],
      })

      // Assert
      await expect(result).rejects.toThrowError(
        new TRPCError({
          code: "CONFLICT",
          message: "User was deleted before. Contact support to restore.",
        }),
      )
    })

    it("should throw 409 if both user and permissions already exists", async () => {
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
          message: "User and permissions already exists",
        }),
      )
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
      expect(result).toEqual([
        expect.objectContaining({
          email: TEST_EMAIL,
          id: expect.any(String),
        }),
      ])

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
          userId: user.id,
          siteId,
          role: RoleType.Editor,
        }),
      ])
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
      expect(createdUsers).toEqual([
        expect.objectContaining({
          email: TEST_EMAIL,
          id: expect.any(String),
        }),
      ])

      // Assert: Verify user in database
      const user = await db
        .selectFrom("User")
        .where("email", "=", TEST_EMAIL)
        .selectAll()
        .executeTakeFirstOrThrow()
      expect(user).toMatchObject({
        email: TEST_EMAIL,
        id: createdUsers[0]?.id,
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
          userId: user.id,
          siteId,
        }),
      ])
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
          message: "User permissions not found",
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

    it("should soft delete an existing user's permissions successfully", async () => {
      // Arrange
      await setupAdminPermissions({ userId: session.userId, siteId })

      const userToDelete = await setupUser({
        email: TEST_EMAIL,
        isDeleted: false,
      })
      await setUpEditorPermissions({ userId: userToDelete.id, siteId })

      // Act
      const result = await caller.delete({
        siteId,
        userId: userToDelete.id,
      })

      // Assert
      expect(result).toBe(true)

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
      await setUpEditorPermissions({ userId: userToDelete.id, siteId })

      // Act
      const result = await caller.delete({
        siteId,
        userId: userToDelete.id,
      })

      // Assert
      expect(result).toBe(true)

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

    it("should return array with self when no other users exist", async () => {
      // Arrange
      await setUpEditorPermissions({ userId: session.userId, siteId })

      // Act
      const result = await caller.list({ siteId })

      // Assert
      expect(result).toHaveLength(1)
      expect(result).toEqual([
        expect.objectContaining({
          id: session.userId,
          name: MOCK_TEST_USER_NAME,
          lastLoginAt: null,
        }),
      ])
    })

    it("should return paginated results (10 users per page)", async () => {
      // Arrange
      await setUpEditorPermissions({ userId: session.userId, siteId })

      for (let i = 0; i < 15; i++) {
        const editorUser = await setupUser({
          email: `editor.user.${i}@open.gov.sg`,
          isDeleted: false,
        })
        await setUpEditorPermissions({ userId: editorUser.id, siteId })
      }

      // Act
      const result = await caller.list({ siteId })

      // Assert
      expect(result).toHaveLength(10)
    })

    it("should return paginated results (10 users per page) with offset", async () => {
      // Arrange
      await setUpEditorPermissions({ userId: session.userId, siteId })

      for (let i = 0; i < 15; i++) {
        const editorUser = await setupUser({
          email: `editor.user.${i}@open.gov.sg`,
          isDeleted: false,
        })
        await setUpEditorPermissions({ userId: editorUser.id, siteId })
      }

      // Act
      const result = await caller.list({ siteId, offset: 10 })

      // Assert
      expect(result).toHaveLength(6)
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

    it("should throw 409 if user exists but has non-null deletedAt", async () => {
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
          code: "CONFLICT",
          message: "User was deleted before. Contact support to restore.",
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

    it("should update a user's role successfully", async () => {
      // Arrange
      await setupAdminPermissions({ userId: session.userId, siteId })

      const userToUpdate = await setupUser({
        email: TEST_EMAIL,
        isDeleted: false,
      })

      await setUpEditorPermissions({ userId: userToUpdate.id, siteId })

      // Act
      const result = await caller.update({
        siteId,
        userId: userToUpdate.id,
        role: RoleType.Admin,
      })

      // Assert
      expect(result).toBe(true)

      // Verify in database
      const updatedUser = await db
        .selectFrom("ResourcePermission")
        .where("userId", "=", userToUpdate.id)
        .where("siteId", "=", siteId)
        .select("role")
        .executeTakeFirst()
      expect(updatedUser?.role).toBe(RoleType.Admin)
    })
  })
})
