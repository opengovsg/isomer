import { ISOMER_ADMINS_AND_MIGRATORS_EMAILS } from "~prisma/constants"
import { resetTables } from "tests/integration/helpers/db"
import {
  setupAdminPermissions,
  setupEditorPermissions,
  setupPublisherPermissions,
  setupSite,
  setupUser,
} from "tests/integration/helpers/seed"
import { beforeEach, describe, expect, it, vi } from "vitest"

import type { Site, User } from "~/server/modules/database"
import { sendAccountDeactivationEmail } from "~/features/mail/service"
import { db } from "~/server/modules/database"
import { RoleType } from "~/server/modules/database/types"
import { MAX_DAYS_FROM_LAST_LOGIN } from "../constants"
import {
  DAYS_IN_MS,
  deactivateUser,
  getInactiveUsers,
} from "../inactiveUsers.service"

interface SetupUserWrapperProps {
  siteId?: number
  email?: string
  createdDaysAgo: number | null
  lastLoginDaysAgo: number | null
  isDeleted?: boolean
  sitePermission?: RoleType
}
const setupUserWrapper = async ({
  siteId,
  email,
  createdDaysAgo = null,
  lastLoginDaysAgo = null,
  isDeleted = false,
  sitePermission = RoleType.Admin,
}: SetupUserWrapperProps): Promise<User> => {
  const user = await setupUser({
    email: email ?? crypto.randomUUID() + "@user.com",
    lastLoginAt: lastLoginDaysAgo
      ? new Date(Date.now() - lastLoginDaysAgo * DAYS_IN_MS)
      : null,
    isDeleted,
  })

  if (siteId) {
    switch (sitePermission) {
      case RoleType.Admin:
        await setupAdminPermissions({ siteId, userId: user.id, isDeleted })
        break
      case RoleType.Publisher:
        await setupPublisherPermissions({ siteId, userId: user.id, isDeleted })
        break
      case RoleType.Editor:
        await setupEditorPermissions({ siteId, userId: user.id, isDeleted })
        break
      default:
        const _: never = sitePermission
        throw new Error(`Invalid site permission`)
    }
  }

  if (!createdDaysAgo) return user

  return await db
    .updateTable("User")
    .where("id", "=", user.id)
    .set({ createdAt: new Date(Date.now() - createdDaysAgo * DAYS_IN_MS) })
    .returningAll()
    .executeTakeFirstOrThrow()
}

describe("inactiveUsers.service", () => {
  describe("deactivateUser", () => {
    let site: Site

    // Necessary pre-requisite as no emails will be sent if there are no admins
    const setupAnotherUserWithPermissions = async (): Promise<User> => {
      const user = await setupUser({
        email: crypto.randomUUID() + "@user.com",
      })
      await setupAdminPermissions({ siteId: site.id, userId: user.id })
      return user
    }

    vi.mock("~/features/mail/service", () => ({
      sendAccountDeactivationEmail: vi.fn(),
    }))

    beforeEach(async () => {
      vi.clearAllMocks()
      await resetTables("Site", "User", "ResourcePermission")

      const { site: _site } = await setupSite()
      site = _site
    })

    it("should successfully deactivate user with permissions", async () => {
      // Arrange
      await setupAnotherUserWithPermissions()
      const user = await setupUserWrapper({
        siteId: site.id,
        createdDaysAgo: 91,
        lastLoginDaysAgo: null,
      })

      // Act
      await deactivateUser({
        user,
        userIdsToDeactivate: [user.id],
      })

      // Assert
      const deletedPermissions = await db
        .selectFrom("ResourcePermission")
        .where("userId", "=", user.id)
        .select("deletedAt")
        .execute()
      expect(deletedPermissions).toHaveLength(1)
      expect(deletedPermissions[0]?.deletedAt).toBeInstanceOf(Date)

      expect(sendAccountDeactivationEmail).toHaveBeenCalledWith({
        recipientEmail: user.email,
        sitesAndAdmins: expect.any(Array),
      })
    })

    it("should return early when user has no permissions to delete", async () => {
      // Arrange
      await setupAnotherUserWithPermissions()
      const user = await setupUserWrapper({
        createdDaysAgo: 91,
        lastLoginDaysAgo: null,
      })

      // Act
      await deactivateUser({
        user,
        userIdsToDeactivate: [user.id],
      })

      // Assert
      expect(sendAccountDeactivationEmail).not.toHaveBeenCalled()
    })

    it("should return early when user's permissions are already deleted", async () => {
      // Arrange
      await setupAnotherUserWithPermissions()
      const user = await setupUserWrapper({
        siteId: site.id,
        createdDaysAgo: 91,
        lastLoginDaysAgo: null,
        isDeleted: true,
      })

      // Act
      await deactivateUser({
        user,
        userIdsToDeactivate: [user.id],
      })

      // Assert
      expect(sendAccountDeactivationEmail).not.toHaveBeenCalled()
    })

    it("should handle multiple calls to deactivate same user", async () => {
      // Arrange
      await setupAnotherUserWithPermissions()
      const user = await setupUserWrapper({
        siteId: site.id,
        createdDaysAgo: 91,
        lastLoginDaysAgo: null,
      })

      // Act
      await Promise.all(
        Array.from({ length: 5 }, () =>
          deactivateUser({
            user,
            userIdsToDeactivate: [user.id],
          }),
        ),
      )

      // Assert
      expect(sendAccountDeactivationEmail).toHaveBeenCalledTimes(1)
    })

    it("should deactivate user with permissions on multiple sites", async () => {
      // Arrange
      await setupAnotherUserWithPermissions()
      const user = await setupUserWrapper({
        siteId: site.id,
        createdDaysAgo: 91,
        lastLoginDaysAgo: null,
      })
      const { site: otherSite } = await setupSite()
      await setupAdminPermissions({ siteId: otherSite.id, userId: user.id })

      // Act
      await deactivateUser({
        user,
        userIdsToDeactivate: [user.id],
      })

      // Assert
      const deletedPermissions = await db
        .selectFrom("ResourcePermission")
        .where("userId", "=", user.id)
        .where("deletedAt", "is not", null)
        .execute()

      expect(deletedPermissions).toHaveLength(2)
      expect(sendAccountDeactivationEmail).toHaveBeenCalledWith({
        recipientEmail: user.email,
        sitesAndAdmins: expect.arrayContaining([
          expect.objectContaining({ siteName: expect.any(String) }),
        ]),
      })
    })

    it("should exclude users being deactivated from admin list", async () => {
      // Arrange
      const anotherAdmin = await setupAnotherUserWithPermissions()
      const toDeactivate = await setupUserWrapper({
        siteId: site.id,
        createdDaysAgo: 91,
        lastLoginDaysAgo: null,
      })
      const adminUser2 = await setupUserWrapper({
        siteId: site.id,
        createdDaysAgo: 91,
        lastLoginDaysAgo: null,
      })

      // Act
      await deactivateUser({
        user: toDeactivate,
        userIdsToDeactivate: [anotherAdmin.id],
      })

      // Assert
      const emailCall = vi.mocked(sendAccountDeactivationEmail).mock.calls[0]
      const sitesAndAdmins = emailCall?.[0]?.sitesAndAdmins
      expect(sitesAndAdmins).toBeDefined()
      expect(sitesAndAdmins?.[0]?.adminEmails).not.toContain(anotherAdmin.email)
      expect(sitesAndAdmins?.[0]?.adminEmails).not.toContain(toDeactivate.email)
      expect(sitesAndAdmins?.[0]?.adminEmails).toContain(adminUser2.email)
    })

    it("should only include admins from sites the deactivated user had permissions for", async () => {
      // Arrange
      // Create Site 1 with User A (to be deactivated) and User C (admin)
      const userToDeactivate = await setupUserWrapper({
        siteId: site.id,
        createdDaysAgo: 91,
        lastLoginDaysAgo: null,
      })
      const adminOnSite1 = await setupUserWrapper({
        siteId: site.id,
        createdDaysAgo: 89,
        lastLoginDaysAgo: null,
      })

      // Create Site 2 with User B (admin) - User A never had permissions here
      const { site: site2 } = await setupSite()
      const adminOnSite2 = await setupUserWrapper({
        siteId: site2.id,
        createdDaysAgo: 89,
        lastLoginDaysAgo: null,
      })

      // Act
      await deactivateUser({
        user: userToDeactivate,
        userIdsToDeactivate: [userToDeactivate.id],
      })

      // Assert
      const emailCall = vi.mocked(sendAccountDeactivationEmail).mock.calls[0]
      const sitesAndAdmins = emailCall?.[0]?.sitesAndAdmins
      expect(sitesAndAdmins).toBeDefined()
      expect(sitesAndAdmins).toHaveLength(1)
      expect(sitesAndAdmins?.map((s) => s.siteName)).toContain(site.name)
      expect(sitesAndAdmins?.map((s) => s.siteName)).not.toContain(site2.name)

      // Should only include admin from Site 1 (where user had permissions)
      expect(sitesAndAdmins?.[0]?.adminEmails).toContain(adminOnSite1.email)

      // Should NOT include admin from Site 2 (where user never had permissions)
      expect(sitesAndAdmins?.[0]?.adminEmails).not.toContain(adminOnSite2.email)

      // Should NOT include the deactivated user themselves
      expect(sitesAndAdmins?.[0]?.adminEmails).not.toContain(
        userToDeactivate.email,
      )
    })

    it("should send email with correct recipient and site data", async () => {
      // Arrange
      const user = await setupUserWrapper({
        siteId: site.id,
        createdDaysAgo: 91,
        lastLoginDaysAgo: null,
      })
      const admin = await setupUserWrapper({
        siteId: site.id,
        createdDaysAgo: 91,
        lastLoginDaysAgo: null,
      })

      // Act
      await deactivateUser({
        user,
        userIdsToDeactivate: [user.id],
      })

      // Assert
      expect(sendAccountDeactivationEmail).toHaveBeenCalledWith({
        recipientEmail: user.email,
        sitesAndAdmins: [
          {
            siteName: site.name,
            adminEmails: [admin.email],
          },
        ],
      })
    })

    it("should send email if user is the last admin on a site", async () => {
      // Arrange
      const user = await setupUserWrapper({
        siteId: site.id,
        createdDaysAgo: 91,
        lastLoginDaysAgo: null,
      })

      // Act
      await deactivateUser({
        user,
        userIdsToDeactivate: [user.id],
      })

      // Assert
      expect(sendAccountDeactivationEmail).toHaveBeenCalledTimes(1)
      expect(sendAccountDeactivationEmail).toHaveBeenCalledWith({
        recipientEmail: user.email,
        sitesAndAdmins: [
          {
            siteName: site.name,
            adminEmails: [],
          },
        ],
      })
    })

    it("should still remove permissions when sendAccountDeactivationEmail throws error", async () => {
      // Arrange
      await setupAnotherUserWithPermissions()
      const user = await setupUserWrapper({
        siteId: site.id,
        createdDaysAgo: 91,
        lastLoginDaysAgo: null,
      })
      vi.mocked(sendAccountDeactivationEmail).mockRejectedValueOnce(
        new Error("Email service error"),
      )

      // Act & Assert
      await deactivateUser({
        user,
        userIdsToDeactivate: [user.id],
      })

      // Assert
      const deletedPermissions = await db
        .selectFrom("ResourcePermission")
        .where("userId", "=", user.id)
        .where("deletedAt", "is", null)
        .selectAll()
        .execute()
      expect(deletedPermissions).toHaveLength(0)
    })

    it("should only delete non-deleted permissions", async () => {
      // Arrange
      await setupAnotherUserWithPermissions()
      const user = await setupUserWrapper({
        siteId: site.id,
        createdDaysAgo: 91,
        lastLoginDaysAgo: null,
      })
      // Add another permission that's already deleted
      const { site: otherSite } = await setupSite()
      const existingDeletedPermission = await setupAdminPermissions({
        siteId: otherSite.id,
        userId: user.id,
        isDeleted: true,
      })

      // Act
      await deactivateUser({
        user,
        userIdsToDeactivate: [user.id],
      })

      // Assert
      const allPermissions = await db
        .selectFrom("ResourcePermission")
        .where("userId", "=", user.id)
        .where("deletedAt", "is not", null)
        .selectAll()
        .execute()
      expect(allPermissions).toHaveLength(2)

      const deletedPermissions = allPermissions.filter(
        (p) => p.id === existingDeletedPermission.id,
      )
      expect(deletedPermissions[0]?.deletedAt).toEqual(
        existingDeletedPermission.deletedAt,
      )

      expect(sendAccountDeactivationEmail).toHaveBeenCalledTimes(1)
    })

    it("should not include isomer admins and migrators in the email", async () => {
      // Arrange
      const userToDeactivate = await setupUserWrapper({
        siteId: site.id,
        createdDaysAgo: 91,
        lastLoginDaysAgo: null,
      })
      await Promise.all(
        ISOMER_ADMINS_AND_MIGRATORS_EMAILS.map((email) =>
          setupUserWrapper({
            siteId: site.id,
            email,
            createdDaysAgo: 91,
            lastLoginDaysAgo: null,
          }),
        ),
      )

      // Act
      await deactivateUser({
        user: userToDeactivate,
        userIdsToDeactivate: [userToDeactivate.id],
      })

      // Assert
      expect(sendAccountDeactivationEmail).toHaveBeenCalledTimes(1) // send to deactivated user
      expect(sendAccountDeactivationEmail).toHaveBeenCalledWith({
        recipientEmail: userToDeactivate.email,
        sitesAndAdmins: expect.any(Array),
      })
    })

    it("should not include non-admins (publishers + editors) in the site admins list", async () => {
      // Arrange
      const user = await setupUserWrapper({
        siteId: site.id,
        createdDaysAgo: 91,
        lastLoginDaysAgo: null,
      })
      const admin = await setupUserWrapper({
        siteId: site.id,
        createdDaysAgo: 89,
        lastLoginDaysAgo: null,
        sitePermission: RoleType.Admin,
      })
      const publisher = await setupUserWrapper({
        siteId: site.id,
        createdDaysAgo: 89,
        lastLoginDaysAgo: null,
        sitePermission: RoleType.Publisher,
      })
      const editor = await setupUserWrapper({
        siteId: site.id,
        createdDaysAgo: 89,
        lastLoginDaysAgo: null,
        sitePermission: RoleType.Editor,
      })

      // Act
      await deactivateUser({
        user,
        userIdsToDeactivate: [user.id],
      })

      // Assert
      const emailCall = vi.mocked(sendAccountDeactivationEmail).mock.calls[0]
      const sitesAndAdmins = emailCall?.[0]?.sitesAndAdmins
      expect(sitesAndAdmins).toBeDefined()
      expect(sitesAndAdmins).toHaveLength(1)
      expect(sitesAndAdmins?.[0]?.adminEmails).toContain(admin.email)
      expect(sitesAndAdmins?.[0]?.adminEmails).not.toContain(publisher.email)
      expect(sitesAndAdmins?.[0]?.adminEmails).not.toContain(editor.email)
    })

    it("should not throw error when userIdsToDeactivate is empty array", async () => {
      // Arrange
      const user = await setupUserWrapper({
        siteId: site.id,
        createdDaysAgo: 91,
        lastLoginDaysAgo: null,
      })

      // Act & Assert
      const result = deactivateUser({
        user,
        userIdsToDeactivate: [],
      })

      // Assert
      await expect(result).resolves.not.toThrow()
    })
  })

  describe("getInactiveUsers", () => {
    let site: Site

    beforeEach(async () => {
      await resetTables("Site", "User", "ResourcePermission")

      const { site: _site } = await setupSite()
      site = _site
    })

    it("should return an empty array when there are no users", async () => {
      // Act
      const inactiveUsers = await getInactiveUsers({
        daysFromLastLogin: MAX_DAYS_FROM_LAST_LOGIN,
      })

      // Assert
      expect(inactiveUsers).toHaveLength(0)
    })

    it("should return an empty array if all users are active", async () => {
      // Arrange
      const _userCreatedRecentlyNeverLoggedIn = await setupUserWrapper({
        siteId: site.id,
        createdDaysAgo: 89,
        lastLoginDaysAgo: null,
      })
      const _userCreatedRecentlyLoggedInRecently = await setupUserWrapper({
        siteId: site.id,
        createdDaysAgo: 89,
        lastLoginDaysAgo: 1,
      })
      const _userCreatedLongAgoLoggedInRecently = await setupUserWrapper({
        siteId: site.id,
        createdDaysAgo: 91,
        lastLoginDaysAgo: 89,
      })

      // Act
      const inactiveUsers = await getInactiveUsers({
        daysFromLastLogin: MAX_DAYS_FROM_LAST_LOGIN,
      })

      // Assert
      expect(inactiveUsers).toHaveLength(0)
    })

    it("should select users created over 90 days ago who never logged in", async () => {
      // Arrange
      const userCreatedLongAgoNeverLoggedIn = await setupUserWrapper({
        siteId: site.id,
        createdDaysAgo: 91,
        lastLoginDaysAgo: null,
      })

      // Act
      const inactiveUsers = await getInactiveUsers({
        daysFromLastLogin: MAX_DAYS_FROM_LAST_LOGIN,
      })

      // Assert
      expect(inactiveUsers).toHaveLength(1)
      expect(inactiveUsers[0]?.id).toBe(userCreatedLongAgoNeverLoggedIn.id)
    })

    it("should NOT select users created under 90 days ago who never logged in", async () => {
      // Arrange
      const _userCreatedRecentlyNeverLoggedIn = await setupUserWrapper({
        siteId: site.id,
        createdDaysAgo: 89,
        lastLoginDaysAgo: null,
      })

      // Act
      const inactiveUsers = await getInactiveUsers({
        daysFromLastLogin: MAX_DAYS_FROM_LAST_LOGIN,
      })

      // Assert
      expect(inactiveUsers).toHaveLength(0)
    })

    it("should select users whose last login was over 90 days ago", async () => {
      // Arrange
      const userCreatedLongAgoLoggedInLongAgo = await setupUserWrapper({
        siteId: site.id,
        createdDaysAgo: 91,
        lastLoginDaysAgo: 91,
      })

      // Act
      const inactiveUsers = await getInactiveUsers({
        daysFromLastLogin: MAX_DAYS_FROM_LAST_LOGIN,
      })

      // Assert
      expect(inactiveUsers).toHaveLength(1)
      expect(inactiveUsers[0]?.id).toBe(userCreatedLongAgoLoggedInLongAgo.id)
    })

    it("should NOT select users whose last login was under 90 days ago", async () => {
      // Arrange
      const _userCreatedLongAgoLoggedInRecently = await setupUserWrapper({
        siteId: site.id,
        createdDaysAgo: 91,
        lastLoginDaysAgo: 89,
      })

      // Act
      const inactiveUsers = await getInactiveUsers({
        daysFromLastLogin: MAX_DAYS_FROM_LAST_LOGIN,
      })

      // Assert
      expect(inactiveUsers).toHaveLength(0)
    })

    it("should only select inactive users from a mixed pool", async () => {
      // Arrange
      const _userCreatedRecentlyNeverLoggedIn = await setupUserWrapper({
        siteId: site.id,
        createdDaysAgo: 89,
        lastLoginDaysAgo: null,
      })
      const _userCreatedRecentlyLoggedInRecently = await setupUserWrapper({
        siteId: site.id,
        createdDaysAgo: 89,
        lastLoginDaysAgo: 1,
      })
      const _userCreatedLongAgoLoggedInRecently = await setupUserWrapper({
        siteId: site.id,
        createdDaysAgo: 91,
        lastLoginDaysAgo: 89,
      })
      const userCreatedLongAgoNeverLoggedIn = await setupUserWrapper({
        siteId: site.id,
        createdDaysAgo: 91,
        lastLoginDaysAgo: null,
      })
      const userCreatedLongAgoLoggedInLongAgo = await setupUserWrapper({
        siteId: site.id,
        createdDaysAgo: 91,
        lastLoginDaysAgo: 91,
      })

      // Act
      const inactiveUsers = await getInactiveUsers({
        daysFromLastLogin: MAX_DAYS_FROM_LAST_LOGIN,
      })

      // Assert
      expect(inactiveUsers).toHaveLength(2)

      const inactiveUserIds = inactiveUsers.map((u) => u.id)
      expect(inactiveUserIds).toContain(userCreatedLongAgoNeverLoggedIn.id)
      expect(inactiveUserIds).toContain(userCreatedLongAgoLoggedInLongAgo.id)
    })

    it("should NOT select soft-deleted users regardless of activity and creation date", async () => {
      // Arrange
      const options = [null, 89, 91]
      const optionsMap = options.map((option) => ({
        createdDaysAgo: option,
        lastLoginDaysAgo: option,
      }))

      for (const { createdDaysAgo, lastLoginDaysAgo } of optionsMap) {
        await setupUserWrapper({
          siteId: site.id,
          createdDaysAgo,
          lastLoginDaysAgo,
          isDeleted: true,
        })
      }

      // Act
      const inactiveUsers = await getInactiveUsers({
        daysFromLastLogin: MAX_DAYS_FROM_LAST_LOGIN,
      })

      // Assert
      expect(inactiveUsers).toHaveLength(0)
    })

    it("should NOT select users who do not have at least one non-deleted resource permission", async () => {
      // Arrange
      await setupUserWrapper({
        createdDaysAgo: 91,
        lastLoginDaysAgo: null,
      })

      // Act
      const inactiveUsers = await getInactiveUsers({
        daysFromLastLogin: MAX_DAYS_FROM_LAST_LOGIN,
      })

      // Assert
      expect(inactiveUsers).toHaveLength(0)
    })

    it("should select users who have at least one non-deleted resource permission", async () => {
      // Arrange
      const user = await setupUserWrapper({
        siteId: site.id,
        createdDaysAgo: 91,
        lastLoginDaysAgo: null,
      })
      // Add a deleted resource permission for the user on another site
      const { site: otherSite } = await setupSite()
      await setupAdminPermissions({
        siteId: otherSite.id,
        userId: user.id,
        isDeleted: true,
      })

      // Act
      const inactiveUsers = await getInactiveUsers({
        daysFromLastLogin: MAX_DAYS_FROM_LAST_LOGIN,
      })

      // Assert
      expect(inactiveUsers).toHaveLength(1)
      expect(inactiveUsers[0]?.id).toBe(user.id)
    })

    it("should only return one instance of a user even if they have multiple resource permissions", async () => {
      // Arrange
      const user = await setupUserWrapper({
        siteId: site.id,
        createdDaysAgo: 91,
        lastLoginDaysAgo: null,
      })
      // Add a non-deleted resource permission for the user on another site
      const { site: otherSite } = await setupSite()
      await setupAdminPermissions({
        siteId: otherSite.id,
        userId: user.id,
        isDeleted: false,
      })

      // Act
      const inactiveUsers = await getInactiveUsers({
        daysFromLastLogin: MAX_DAYS_FROM_LAST_LOGIN,
      })

      // Assert
      expect(inactiveUsers).toHaveLength(1)
      expect(inactiveUsers[0]?.id).toBe(user.id)
    })

    it("should NOT select isomer admins and migrators", async () => {
      // Arrange
      await Promise.all(
        ISOMER_ADMINS_AND_MIGRATORS_EMAILS.map((email) =>
          setupUserWrapper({
            siteId: site.id,
            email,
            createdDaysAgo: 91,
            lastLoginDaysAgo: null,
          }),
        ),
      )

      // Act
      const inactiveUsers = await getInactiveUsers({
        daysFromLastLogin: MAX_DAYS_FROM_LAST_LOGIN,
      })

      // Assert
      expect(inactiveUsers).toHaveLength(0)
    })
  })
})
