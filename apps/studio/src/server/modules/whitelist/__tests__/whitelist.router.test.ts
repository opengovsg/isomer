import { TRPCError } from "@trpc/server"
import { auth } from "tests/integration/helpers/auth"
import { resetTables } from "tests/integration/helpers/db"
import {
  applyAuthedSession,
  applySession,
  createMockRequest,
} from "tests/integration/helpers/iron-session"
import {
  setupAdminPermissions,
  setupIsomerAdmin,
  setupPublisherPermissions,
  setupSite,
  setupUser,
  setUpWhitelist,
} from "tests/integration/helpers/seed"
import { createCallerFactory } from "~/server/trpc"
import { IsomerAdminRole } from "~prisma/generated/generatedEnums"

import type { User } from "../../database"
import { db } from "../../database"
import { whitelistRouter } from "../whitelist.router"

const createCaller = createCallerFactory(whitelistRouter)

describe("whitelist.router", async () => {
  let caller: ReturnType<typeof createCaller>
  let unauthedCaller: ReturnType<typeof createCaller>
  const session = await applyAuthedSession()

  describe("isEmailWhitelisted", () => {
    beforeEach(async () => {
      await resetTables("User", "Whitelist")
      caller = createCaller(createMockRequest(session))
      unauthedCaller = createCaller(createMockRequest(applySession()))
      const user = await setupUser({
        userId: session.userId,
        email: "test@mock.com",
      })
      await auth(user)
    })

    it("should throw 401 if not logged in", async () => {
      // Act
      const result = unauthedCaller.isEmailWhitelisted({
        siteId: 1,
        email: "test@mock.com",
      })

      // Assert
      await expect(result).rejects.toThrow(
        new TRPCError({ code: "UNAUTHORIZED" }),
      )
    })

    it("should throw 403 if user does not have manage permissions", async () => {
      // Arrange
      const { site } = await setupSite()
      await setUpWhitelist({ email: "another-test@mock.com" })
      await setupPublisherPermissions({
        userId: session.userId,
        siteId: site.id,
      })

      // Act
      const result = caller.isEmailWhitelisted({
        siteId: site.id,
        email: "another-test@mock.com",
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

    it("should return false if email is not whitelisted", async () => {
      // Arrange
      const { site } = await setupSite()
      await setupAdminPermissions({ userId: session.userId, siteId: site.id })

      // Act
      const result = await caller.isEmailWhitelisted({
        siteId: site.id,
        email: "another-test@mock.com",
      })

      // Assert
      expect(result).toBe(false)
    })

    it("should return true if email is whitelisted", async () => {
      // Arrange
      const { site } = await setupSite()
      await setUpWhitelist({ email: "another-test@mock.com" })
      await setupAdminPermissions({ userId: session.userId, siteId: site.id })
      // Act
      const result = await caller.isEmailWhitelisted({
        siteId: site.id,
        email: "another-test@mock.com",
      })

      // Assert
      expect(result).toBe(true)
    })
  })

  describe("whitelistEmails", () => {
    let user: User

    beforeEach(async () => {
      await resetTables("User", "Whitelist", "IsomerAdmin")
      caller = createCaller(createMockRequest(session))
      unauthedCaller = createCaller(createMockRequest(applySession()))
      user = await setupUser({
        userId: session.userId,
        email: "test@mock.com",
      })
      await auth(user)
    })

    it("should throw 401 if not logged in", async () => {
      // Act
      const result = unauthedCaller.whitelistEmails({
        adminEmails: ["admin@test.com"],
        vendorEmails: [],
      })

      // Assert
      await expect(result).rejects.toThrow(
        new TRPCError({ code: "UNAUTHORIZED" }),
      )
    })

    it("should throw 403 if user is not an Isomer Core Admin or Migrator", async () => {
      // Arrange - user is not set up as IsomerAdmin, so should be rejected

      // Act
      const result = caller.whitelistEmails({
        adminEmails: ["admin@test.com"],
        vendorEmails: [],
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

    it("should whitelist admin emails successfully if user is an Isomer Core Admin", async () => {
      // Arrange
      await setupIsomerAdmin({ userId: user.id, role: IsomerAdminRole.Core })
      const adminEmail = "admin@test.com"

      // Act
      const result = await caller.whitelistEmails({
        adminEmails: [adminEmail],
        vendorEmails: [],
      })

      // Assert
      expect(result).toEqual({
        adminCount: 1,
        vendorCount: 0,
      })

      // Verify database state
      const whitelistEntry = await db
        .selectFrom("Whitelist")
        .where("email", "=", adminEmail)
        .selectAll()
        .executeTakeFirst()

      expect(whitelistEntry).toBeDefined()
      expect(whitelistEntry?.email).toBe(adminEmail)
      expect(whitelistEntry?.expiry).toBeNull() // Admin emails have no expiry
    })

    it("should whitelist vendor emails with 90-day expiry if user is an Isomer Core Admin", async () => {
      // Arrange
      await setupIsomerAdmin({ userId: user.id, role: IsomerAdminRole.Core })
      const vendorEmail = "vendor@test.com"

      // Act
      const result = await caller.whitelistEmails({
        adminEmails: [],
        vendorEmails: [vendorEmail],
      })

      // Assert
      expect(result).toEqual({
        adminCount: 0,
        vendorCount: 1,
      })

      // Verify database state
      const whitelistEntry = await db
        .selectFrom("Whitelist")
        .where("email", "=", vendorEmail)
        .selectAll()
        .executeTakeFirst()

      expect(whitelistEntry).toBeDefined()
      expect(whitelistEntry?.email).toBe(vendorEmail)
      expect(whitelistEntry?.expiry).not.toBeNull()

      // Verify expiry is approximately 90 days from now
      const expectedExpiry = new Date()
      expectedExpiry.setDate(expectedExpiry.getDate() + 90)
      expectedExpiry.setHours(0, 0, 0, 0)
      expect(whitelistEntry?.expiry).toEqual(expectedExpiry)
    })

    it("should whitelist emails successfully if user is an Isomer Migrator", async () => {
      // Arrange
      await setupIsomerAdmin({
        userId: user.id,
        role: IsomerAdminRole.Migrator,
      })
      const adminEmail = "admin@test.com"
      const vendorEmail = "vendor@test.com"

      // Act
      const result = await caller.whitelistEmails({
        adminEmails: [adminEmail],
        vendorEmails: [vendorEmail],
      })

      // Assert
      expect(result).toEqual({
        adminCount: 1,
        vendorCount: 1,
      })

      // Verify database state
      const adminEntry = await db
        .selectFrom("Whitelist")
        .where("email", "=", adminEmail)
        .selectAll()
        .executeTakeFirst()
      const vendorEntry = await db
        .selectFrom("Whitelist")
        .where("email", "=", vendorEmail)
        .selectAll()
        .executeTakeFirst()

      expect(adminEntry).toBeDefined()
      expect(adminEntry?.expiry).toBeNull()
      expect(vendorEntry).toBeDefined()
      expect(vendorEntry?.expiry).not.toBeNull()
    })

    it("should whitelist multiple admin and vendor emails", async () => {
      // Arrange
      await setupIsomerAdmin({ userId: user.id, role: IsomerAdminRole.Core })
      const adminEmails = ["admin1@test.com", "admin2@test.com"]
      const vendorEmails = ["vendor1@test.com", "vendor2@test.com"]

      // Act
      const result = await caller.whitelistEmails({
        adminEmails,
        vendorEmails,
      })

      // Assert
      expect(result).toEqual({
        adminCount: 2,
        vendorCount: 2,
      })

      // Verify all test emails are in the database
      const allTestEmails = [...adminEmails, ...vendorEmails]
      const whitelistedTestEmails = await db
        .selectFrom("Whitelist")
        .where("email", "in", allTestEmails)
        .selectAll()
        .execute()

      expect(whitelistedTestEmails).toHaveLength(4)
    })

    it("should normalise emails to lowercase", async () => {
      // Arrange
      await setupIsomerAdmin({ userId: user.id, role: IsomerAdminRole.Core })
      const uppercaseEmail = "ADMIN@TEST.COM"

      // Act
      await caller.whitelistEmails({
        adminEmails: [uppercaseEmail],
        vendorEmails: [],
      })

      // Assert
      const whitelistEntry = await db
        .selectFrom("Whitelist")
        .where("email", "=", uppercaseEmail.toLowerCase())
        .selectAll()
        .executeTakeFirst()

      expect(whitelistEntry).toBeDefined()
      expect(whitelistEntry?.email).toBe(uppercaseEmail.toLowerCase())
    })

    it("should deduplicate emails within the same request", async () => {
      // Arrange
      await setupIsomerAdmin({ userId: user.id, role: IsomerAdminRole.Core })
      const duplicateEmail = "admin@test.com"

      // Act
      const result = await caller.whitelistEmails({
        adminEmails: [duplicateEmail, duplicateEmail],
        vendorEmails: [],
      })

      // Assert
      expect(result).toEqual({
        adminCount: 1,
        vendorCount: 0,
      })

      // Verify only one entry was created for the duplicate email
      // (excluding the auth user's whitelisted email)
      const whitelistEntry = await db
        .selectFrom("Whitelist")
        .where("email", "=", duplicateEmail)
        .selectAll()
        .execute()

      expect(whitelistEntry).toHaveLength(1)
    })

    it("should upgrade existing vendor to admin when same email is submitted as admin", async () => {
      // Arrange
      await setupIsomerAdmin({ userId: user.id, role: IsomerAdminRole.Core })
      const email = "user@test.com"

      // First whitelist as vendor
      await caller.whitelistEmails({
        adminEmails: [],
        vendorEmails: [email],
      })

      // Verify it's a vendor (has expiry)
      const vendorEntry = await db
        .selectFrom("Whitelist")
        .where("email", "=", email)
        .selectAll()
        .executeTakeFirst()
      expect(vendorEntry?.expiry).not.toBeNull()

      // Act: Now whitelist as admin
      await caller.whitelistEmails({
        adminEmails: [email],
        vendorEmails: [],
      })

      // Assert: Should be upgraded to admin (no expiry)
      const adminEntry = await db
        .selectFrom("Whitelist")
        .where("email", "=", email)
        .selectAll()
        .executeTakeFirst()

      expect(adminEntry?.expiry).toBeNull()
    })

    it("should not downgrade admin to vendor when same email is submitted as vendor", async () => {
      // Arrange
      await setupIsomerAdmin({ userId: user.id, role: IsomerAdminRole.Core })
      const email = "user@test.com"

      // First whitelist as admin
      await caller.whitelistEmails({
        adminEmails: [email],
        vendorEmails: [],
      })

      // Verify it's an admin (no expiry)
      const adminEntry = await db
        .selectFrom("Whitelist")
        .where("email", "=", email)
        .selectAll()
        .executeTakeFirst()
      expect(adminEntry?.expiry).toBeNull()

      // Act: Try to whitelist as vendor
      await caller.whitelistEmails({
        adminEmails: [],
        vendorEmails: [email],
      })

      // Assert: Should still be admin (no expiry)
      const stillAdminEntry = await db
        .selectFrom("Whitelist")
        .where("email", "=", email)
        .selectAll()
        .executeTakeFirst()

      expect(stillAdminEntry?.expiry).toBeNull()
    })

    it("should return zero counts when empty arrays are provided", async () => {
      // Arrange
      await setupIsomerAdmin({ userId: user.id, role: IsomerAdminRole.Core })

      // Act
      const result = await caller.whitelistEmails({
        adminEmails: [],
        vendorEmails: [],
      })

      // Assert
      expect(result).toEqual({
        adminCount: 0,
        vendorCount: 0,
      })
    })
  })
})
