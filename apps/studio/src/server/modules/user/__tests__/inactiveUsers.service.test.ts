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
import {
  sendAccountDeactivationEmail,
  sendAccountDeactivationWarningEmail,
} from "~/features/mail/service"
import { db } from "~/server/modules/database"
import { RoleType } from "~/server/modules/database/types"
import { MAX_DAYS_FROM_LAST_LOGIN } from "../constants"
import {
  bulkSendAccountDeactivationWarningEmails,
  deactivateUser,
  getDateOnlyInSG,
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
    lastLoginAt: lastLoginDaysAgo ? getDateOnlyInSG(lastLoginDaysAgo) : null,
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
    .set({ createdAt: getDateOnlyInSG(createdDaysAgo) })
    .returningAll()
    .executeTakeFirstOrThrow()
}

describe("inactiveUsers.service", () => {
  vi.mock("~/features/mail/service", () => ({
    sendAccountDeactivationEmail: vi.fn(),
    sendAccountDeactivationWarningEmail: vi.fn(),
  }))

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
        toDaysAgo: MAX_DAYS_FROM_LAST_LOGIN,
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
        toDaysAgo: MAX_DAYS_FROM_LAST_LOGIN,
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
        toDaysAgo: MAX_DAYS_FROM_LAST_LOGIN,
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
        toDaysAgo: MAX_DAYS_FROM_LAST_LOGIN,
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
        toDaysAgo: MAX_DAYS_FROM_LAST_LOGIN,
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
        toDaysAgo: MAX_DAYS_FROM_LAST_LOGIN,
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
        toDaysAgo: MAX_DAYS_FROM_LAST_LOGIN,
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
        toDaysAgo: MAX_DAYS_FROM_LAST_LOGIN,
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
        toDaysAgo: MAX_DAYS_FROM_LAST_LOGIN,
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
        toDaysAgo: MAX_DAYS_FROM_LAST_LOGIN,
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
        toDaysAgo: MAX_DAYS_FROM_LAST_LOGIN,
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
        toDaysAgo: MAX_DAYS_FROM_LAST_LOGIN,
      })

      // Assert
      expect(inactiveUsers).toHaveLength(0)
    })

    it("should filter users by fromDaysAgo when provided", async () => {
      // Arrange
      const userCreatedVeryLongAgo = await setupUserWrapper({
        siteId: site.id,
        createdDaysAgo: 120,
        lastLoginDaysAgo: null,
      })
      const userCreatedLongAgo = await setupUserWrapper({
        siteId: site.id,
        createdDaysAgo: 100,
        lastLoginDaysAgo: null,
      })
      const userCreatedRecently = await setupUserWrapper({
        siteId: site.id,
        createdDaysAgo: 80,
        lastLoginDaysAgo: null,
      })

      // Act + Assert (1)
      const usersCreatedVeryLongAgo = await getInactiveUsers({
        fromDaysAgo: 130,
        toDaysAgo: 110,
      })
      expect(usersCreatedVeryLongAgo).toHaveLength(1)
      expect(usersCreatedVeryLongAgo[0]?.id).toBe(userCreatedVeryLongAgo.id)

      // Act + Assert (2)
      const usersCreatedLongAgo = await getInactiveUsers({
        fromDaysAgo: 110,
        toDaysAgo: 90,
      })
      expect(usersCreatedLongAgo).toHaveLength(1)
      expect(usersCreatedLongAgo[0]?.id).toBe(userCreatedLongAgo.id)

      // Act + Assert (3)
      const usersCreatedRecently = await getInactiveUsers({
        fromDaysAgo: 90,
        toDaysAgo: 70,
      })
      expect(usersCreatedRecently).toHaveLength(1)
      expect(usersCreatedRecently[0]?.id).toBe(userCreatedRecently.id)

      // Act + Assert (4)
      const users = await getInactiveUsers({
        fromDaysAgo: 110,
        toDaysAgo: 0,
      })
      expect(users).toHaveLength(2)
      expect(users.map((u) => u.id)).toContain(userCreatedLongAgo.id)
      expect(users.map((u) => u.id)).toContain(userCreatedRecently.id)
    })

    it("should filter users by fromDaysAgo for users who have logged in", async () => {
      // Arrange
      const _userLoggedInVeryLongAgo = await setupUserWrapper({
        siteId: site.id,
        createdDaysAgo: 120,
        lastLoginDaysAgo: 110,
      })
      const userLoggedInLongAgo = await setupUserWrapper({
        siteId: site.id,
        createdDaysAgo: 100,
        lastLoginDaysAgo: 90,
      })
      const _userLoggedInRecently = await setupUserWrapper({
        siteId: site.id,
        createdDaysAgo: 80,
        lastLoginDaysAgo: 70,
      })

      // Act
      const users = await getInactiveUsers({
        fromDaysAgo: 110,
        toDaysAgo: MAX_DAYS_FROM_LAST_LOGIN,
      })

      // Assert
      expect(users).toHaveLength(1)
      expect(users.map((u) => u.id)).toContain(userLoggedInLongAgo.id)
    })

    it("should work with only fromDaysAgo parameter", async () => {
      // Arrange
      const userCreatedVeryLongAgo = await setupUserWrapper({
        siteId: site.id,
        createdDaysAgo: 110,
        lastLoginDaysAgo: null,
      })
      const _userCreatedLongAgo = await setupUserWrapper({
        siteId: site.id,
        createdDaysAgo: 80,
        lastLoginDaysAgo: null,
      })

      // Act
      const inactiveUsers = await getInactiveUsers({
        fromDaysAgo: 120,
      })

      // Assert
      expect(inactiveUsers).toHaveLength(1)
      expect(inactiveUsers[0]?.id).toBe(userCreatedVeryLongAgo.id)
    })

    it("should return empty array when toDaysAgo is greater than fromDaysAgo", async () => {
      // Arrange
      await setupUserWrapper({
        siteId: site.id,
        createdDaysAgo: 100,
        lastLoginDaysAgo: null,
      })

      // Act
      const inactiveUsers = await getInactiveUsers({
        fromDaysAgo: 80,
        toDaysAgo: 120,
      })

      // Assert
      expect(inactiveUsers).toHaveLength(0)
    })

    // default days for inactive users is 90 days by IM8 standard
    it("should return empty array when fromDaysAgo is less than 90", async () => {
      // Arrange
      await setupUserWrapper({
        siteId: site.id,
        createdDaysAgo: 80,
        lastLoginDaysAgo: null,
      })

      // Act
      const inactiveUsers = await getInactiveUsers({
        fromDaysAgo: 70,
      })

      // Assert
      expect(inactiveUsers).toHaveLength(0)
    })
  })

  describe("bulkSendAccountDeactivationWarningEmails", () => {
    let site: Site

    beforeEach(async () => {
      vi.clearAllMocks()
      await resetTables("Site", "User", "ResourcePermission")

      const { site: _site } = await setupSite()
      site = _site
    })

    describe("should send warning emails to users who will be inactive in specified days", async () => {
      it("1 day", async () => {
        // Arrange
        const user = await setupUserWrapper({
          siteId: site.id,
          createdDaysAgo: 89, // Will be inactive in 1 day (90 - 1 = 89)
          lastLoginDaysAgo: null,
        })

        // Act
        await bulkSendAccountDeactivationWarningEmails({
          inHowManyDays: 1,
        })

        // Assert
        expect(sendAccountDeactivationWarningEmail).toHaveBeenCalledWith({
          recipientEmail: user.email,
          siteNames: [],
          inHowManyDays: 1,
        })
        await expect(
          bulkSendAccountDeactivationWarningEmails({ inHowManyDays: 1 }),
        ).resolves.not.toThrowError()
      })

      it("7 days", async () => {
        // Arrange
        const user = await setupUserWrapper({
          siteId: site.id,
          createdDaysAgo: 83, // Will be inactive in 7 days (90 - 7 = 83)
          lastLoginDaysAgo: null,
        })

        // Act
        await bulkSendAccountDeactivationWarningEmails({
          inHowManyDays: 7,
        })

        // Assert
        expect(sendAccountDeactivationWarningEmail).toHaveBeenCalledWith({
          recipientEmail: user.email,
          siteNames: [],
          inHowManyDays: 7,
        })
        await expect(
          bulkSendAccountDeactivationWarningEmails({ inHowManyDays: 7 }),
        ).resolves.not.toThrowError()
      })

      it("14 days", async () => {
        // Arrange
        const user = await setupUserWrapper({
          siteId: site.id,
          createdDaysAgo: 76, // Will be inactive in 14 days (90 - 14 = 76)
          lastLoginDaysAgo: null,
        })

        // Act
        await bulkSendAccountDeactivationWarningEmails({
          inHowManyDays: 14,
        })

        // Assert
        expect(sendAccountDeactivationWarningEmail).toHaveBeenCalledWith({
          recipientEmail: user.email,
          siteNames: [],
          inHowManyDays: 14,
        })
        await expect(
          bulkSendAccountDeactivationWarningEmails({ inHowManyDays: 14 }),
        ).resolves.not.toThrowError()
      })
    })

    it("should not send warning emails to users who are active", async () => {
      // Arrange
      await setupUserWrapper({
        siteId: site.id,
        createdDaysAgo: 89,
        lastLoginDaysAgo: 1,
      })

      // Act
      await bulkSendAccountDeactivationWarningEmails({
        inHowManyDays: 1,
      })

      // Assert
      expect(sendAccountDeactivationWarningEmail).not.toHaveBeenCalled()
    })

    it("should send warning emails to all inactive users", async () => {
      // Arrange
      const user1 = await setupUserWrapper({
        siteId: site.id,
        createdDaysAgo: 89, // Will be inactive in 1 day
        lastLoginDaysAgo: null,
      })
      const user2 = await setupUserWrapper({
        siteId: site.id,
        createdDaysAgo: 89, // Will be inactive in 1 day
        lastLoginDaysAgo: null,
      })

      // Act
      await bulkSendAccountDeactivationWarningEmails({
        inHowManyDays: 1,
      })

      // Assert
      expect(sendAccountDeactivationWarningEmail).toHaveBeenCalledTimes(2)
      expect(sendAccountDeactivationWarningEmail).toHaveBeenCalledWith({
        recipientEmail: user1.email,
        siteNames: [],
        inHowManyDays: 1,
      })
      expect(sendAccountDeactivationWarningEmail).toHaveBeenCalledWith({
        recipientEmail: user2.email,
        siteNames: [],
        inHowManyDays: 1,
      })
    })

    it("should handle empty inactive users list", async () => {
      // Act
      await bulkSendAccountDeactivationWarningEmails({
        inHowManyDays: 1,
      })

      // Assert
      expect(sendAccountDeactivationWarningEmail).not.toHaveBeenCalled()
    })

    it("should handle multiple inactive users", async () => {
      // Arrange
      const users = []
      for (let i = 0; i < 3; i++) {
        users.push(
          await setupUserWrapper({
            siteId: site.id,
            createdDaysAgo: 89,
            lastLoginDaysAgo: null,
          }),
        )
      }

      // Act
      await bulkSendAccountDeactivationWarningEmails({
        inHowManyDays: 1,
      })

      // Assert
      expect(sendAccountDeactivationWarningEmail).toHaveBeenCalledTimes(3)
      users.forEach((user) => {
        expect(sendAccountDeactivationWarningEmail).toHaveBeenCalledWith({
          recipientEmail: user.email,
          siteNames: [],
          inHowManyDays: 1,
        })
      })
    })

    it("should work with users who have never logged in", async () => {
      // Arrange
      const user = await setupUserWrapper({
        siteId: site.id,
        createdDaysAgo: 89,
        lastLoginDaysAgo: null, // Never logged in
      })

      // Act
      await bulkSendAccountDeactivationWarningEmails({
        inHowManyDays: 1,
      })

      // Assert
      expect(sendAccountDeactivationWarningEmail).toHaveBeenCalledWith({
        recipientEmail: user.email,
        siteNames: [],
        inHowManyDays: 1,
      })
    })

    it("should work with users who have logged in before", async () => {
      // Arrange
      const user = await setupUserWrapper({
        siteId: site.id,
        createdDaysAgo: 91,
        lastLoginDaysAgo: 89, // Logged in 89 days ago
      })

      // Act
      await bulkSendAccountDeactivationWarningEmails({
        inHowManyDays: 1,
      })

      // Assert
      expect(sendAccountDeactivationWarningEmail).toHaveBeenCalledWith({
        recipientEmail: user.email,
        siteNames: [],
        inHowManyDays: 1,
      })
    })
  })
})
