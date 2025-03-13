import { TRPCError } from "@trpc/server"
import { RoleType } from "~prisma/generated/generatedEnums"
import { resetTables } from "tests/integration/helpers/db"
import {
  setupAdminPermissions,
  setupSite,
  setupUser,
  setUpWhitelist,
} from "tests/integration/helpers/seed"

import { db } from "~/server/modules/database"
import { createUser, isUserDeleted } from "../user.service"

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

  describe("createUser", () => {
    const TEST_EMAIL = "test@open.gov.sg"
    let siteId: number

    beforeAll(async () => {
      await setUpWhitelist({ email: TEST_EMAIL })
    })

    beforeEach(async () => {
      await resetTables("User", "ResourcePermission", "Site")
      const { site } = await setupSite()
      siteId = site.id
    })

    it("should throw error if email is invalid", async () => {
      // Act
      const result = createUser({
        email: "invalid-email",
        role: RoleType.Editor,
        siteId,
      })

      // Assert
      await expect(result).rejects.toThrow(
        new TRPCError({
          code: "BAD_REQUEST",
          message: "Invalid email",
        }),
      )
    })

    it("should throw error if site does not exist", async () => {
      // Act
      const result = createUser({
        email: TEST_EMAIL,
        role: RoleType.Editor,
        siteId: 9999,
      })

      // Assert
      await expect(result).rejects.toThrowError()
    })

    it("should throw error if both user and permission already exists", async () => {
      // Arrange
      const user = await setupUser({ email: TEST_EMAIL, isDeleted: false })
      await setupAdminPermissions({ userId: user.id, siteId })

      // Act
      const result = createUser({
        email: TEST_EMAIL,
        role: RoleType.Editor,
        siteId,
      })

      // Assert
      await expect(result).rejects.toThrowError(
        new TRPCError({
          code: "CONFLICT",
          message: "User already has permission for this site",
        }),
      )
    })

    it("should create user if user already exists but has non-null deletedAt", async () => {
      // Arrange
      const user = await setupUser({ email: TEST_EMAIL, isDeleted: true })
      await setupAdminPermissions({ userId: user.id, siteId })

      // Act
      const roleToCreate = RoleType.Editor
      const { user: createdUser } = await createUser({
        email: TEST_EMAIL,
        role: roleToCreate,
        siteId,
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
    })

    it("should throw 403 if creating a non-whitelisted non-gov.sg email with any role", async () => {
      // Arrange
      const nonGovSgEmail = "test@coolvendor.com"

      // Act
      const result = createUser({
        email: nonGovSgEmail,
        role: RoleType.Editor,
        siteId,
      })

      // Assert
      await expect(result).rejects.toThrow(
        new TRPCError({
          code: "FORBIDDEN",
          message: "There are non-gov.sg domains that need to be whitelisted.",
        }),
      )
    })

    it("should throw 403 if assigning a non-gov.sg email with admin role", async () => {
      // Arrange
      const nonGovSgEmail = "test@coolvendor.com"
      await setUpWhitelist({ email: nonGovSgEmail })

      // Act
      const result = createUser({
        email: nonGovSgEmail,
        role: RoleType.Admin,
        siteId,
      })

      // Assert
      await expect(result).rejects.toThrow(
        new TRPCError({
          code: "FORBIDDEN",
          message:
            "Non-gov.sg emails cannot be added as admin. Select another role.",
        }),
      )
    })

    it("should create a non-gov.sg email with non-admin role", async () => {
      // Arrange
      const nonGovSgEmail = "test@coolvendor.com"
      await setUpWhitelist({ email: nonGovSgEmail })

      // Act
      const result = await createUser({
        email: nonGovSgEmail,
        role: RoleType.Editor,
        siteId,
      })

      // Assert
      expect(result).toEqual(expect.anything())
    })

    it("should create a new user with default values", async () => {
      // Act
      const { user } = await createUser({
        email: TEST_EMAIL,
        name: "",
        phone: "",
        role: RoleType.Editor,
        siteId,
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
    })

    it("should create a new user with provided values", async () => {
      // Arrange
      const name = "Test User"
      const phone = "12345678"
      const role = RoleType.Admin

      // Act
      const { user } = await createUser({
        email: TEST_EMAIL,
        name,
        phone,
        role,
        siteId,
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
    })

    it("should update existing user's email if there's a conflict", async () => {
      // Arrange
      await setupUser({ email: TEST_EMAIL, isDeleted: false })

      // Act
      await createUser({
        email: TEST_EMAIL,
        name: "",
        phone: "",
        role: RoleType.Editor,
        siteId,
      })

      // Assert: Verify user in database
      const dbUserResult = await db
        .selectFrom("User")
        .where("email", "=", TEST_EMAIL)
        .selectAll()
        .execute()

      // Should only have one user with this email
      expect(dbUserResult).toHaveLength(1)
      expect(dbUserResult[0]).toMatchObject({
        email: TEST_EMAIL,
      })
    })

    it("should create resource permission for the user if user already exists", async () => {
      // Arrange
      const existingUser = await setupUser({
        email: TEST_EMAIL,
        isDeleted: false,
      })

      // Act
      await createUser({ email: TEST_EMAIL, role: RoleType.Admin, siteId })

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
    })
  })
})
