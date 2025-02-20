import { TRPCError } from "@trpc/server"
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

  beforeAll(async () => {
    await setUpWhitelist({ email: TEST_EMAIL })
  })

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
    })

    it("should create a whitelisted non-gov.sg email with non-admin role", async () => {
      // Arrange
      const nonGovSgEmail = "test@coolvendor.com"
      await setupAdminPermissions({ userId: session.userId, siteId })
      await setUpWhitelist({ email: nonGovSgEmail })

      // Act
      const result = caller.create({
        siteId,
        users: [{ email: nonGovSgEmail, role: RoleType.Editor }],
      })

      // Assert
      await expect(result).resolves.toEqual(expect.anything())
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
      await setupEditorPermissions({ userId: userToDelete.id, siteId })

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
      await setupEditorPermissions({ userId: userToDelete.id, siteId })

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
      await setupEditorPermissions({ userId: session.userId, siteId })

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

      // Act
      const result = await caller.update({
        siteId,
        userId: userToUpdate.id,
        role: RoleType.Publisher,
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
      expect(updatedUser?.role).toBe(RoleType.Publisher)
    })

    it("should update a user's role successfully", async () => {
      // Arrange
      await setupAdminPermissions({ userId: session.userId, siteId })

      const userToUpdate = await setupUser({
        email: TEST_EMAIL,
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
          expect(updatedUser.phone).toBe("81234567")
        }
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
          expect(updatedUser.phone).toBe(phone)
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
      expect(updatedUser.name).toBe(name)
      expect(updatedUser.phone).toBe(phone)
    })
  })
})
