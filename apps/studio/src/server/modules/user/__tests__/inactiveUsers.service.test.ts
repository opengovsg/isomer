import { ISOMER_ADMINS_AND_MIGRATORS_EMAILS } from "~prisma/constants"
import { resetTables } from "tests/integration/helpers/db"
import { setupUser } from "tests/integration/helpers/seed"
import { beforeEach, describe, expect, it } from "vitest"

import type { User } from "~/server/modules/database"
import { db } from "~/server/modules/database"
import { DAYS_IN_MS, removeInactiveUsers } from "../inactiveUsers.service"

interface SetupUserWrapperProps {
  email?: string
  createdDaysAgo: number | null
  lastLoginDaysAgo: number | null
  isDeleted?: boolean
}
const setupUserWrapper = async ({
  email,
  createdDaysAgo = null,
  lastLoginDaysAgo = null,
  isDeleted = false,
}: SetupUserWrapperProps): Promise<User> => {
  const user = await setupUser({
    email: email ?? crypto.randomUUID() + "@user.com",
    lastLoginAt: lastLoginDaysAgo
      ? new Date(Date.now() - lastLoginDaysAgo * DAYS_IN_MS)
      : null,
    isDeleted,
  })

  if (!createdDaysAgo) return user

  return await db
    .updateTable("User")
    .where("id", "=", user.id)
    .set({ createdAt: new Date(Date.now() - createdDaysAgo * DAYS_IN_MS) })
    .returningAll()
    .executeTakeFirstOrThrow()
}

describe("inactiveUsers.service", () => {
  describe("removeInactiveUsers", () => {
    beforeEach(async () => {
      await resetTables("User", "ResourcePermission")
    })

    it("should return an empty array when there are no users", async () => {
      // Act
      const inactiveUsers = await removeInactiveUsers()

      // Assert
      expect(inactiveUsers).toHaveLength(0)
    })

    it("should return an empty array if all users are active", async () => {
      // Arrange
      const _userCreatedRecentlyNeverLoggedIn = await setupUserWrapper({
        createdDaysAgo: 89,
        lastLoginDaysAgo: null,
      })
      const _userCreatedRecentlyLoggedInRecently = await setupUserWrapper({
        createdDaysAgo: 89,
        lastLoginDaysAgo: 1,
      })
      const _userCreatedLongAgoLoggedInRecently = await setupUserWrapper({
        createdDaysAgo: 91,
        lastLoginDaysAgo: 89,
      })

      // Act
      const inactiveUsers = await removeInactiveUsers()

      // Assert
      expect(inactiveUsers).toHaveLength(0)
    })

    it("should select users created over 90 days ago who never logged in", async () => {
      // Arrange
      const userCreatedLongAgoNeverLoggedIn = await setupUserWrapper({
        createdDaysAgo: 91,
        lastLoginDaysAgo: null,
      })

      // Act
      const inactiveUsers = await removeInactiveUsers()

      // Assert
      expect(inactiveUsers).toHaveLength(1)
      expect(inactiveUsers[0]?.id).toBe(userCreatedLongAgoNeverLoggedIn.id)
    })

    it("should NOT select users created under 90 days ago who never logged in", async () => {
      // Arrange
      const _userCreatedRecentlyNeverLoggedIn = await setupUserWrapper({
        createdDaysAgo: 89,
        lastLoginDaysAgo: null,
      })

      // Act
      const inactiveUsers = await removeInactiveUsers()

      // Assert
      expect(inactiveUsers).toHaveLength(0)
    })

    it("should select users whose last login was over 90 days ago", async () => {
      // Arrange
      const userCreatedLongAgoLoggedInLongAgo = await setupUserWrapper({
        createdDaysAgo: 91,
        lastLoginDaysAgo: 91,
      })

      // Act
      const inactiveUsers = await removeInactiveUsers()

      // Assert
      expect(inactiveUsers).toHaveLength(1)
      expect(inactiveUsers[0]?.id).toBe(userCreatedLongAgoLoggedInLongAgo.id)
    })

    it("should NOT select users whose last login was under 90 days ago", async () => {
      // Arrange
      const _userCreatedLongAgoLoggedInRecently = await setupUserWrapper({
        createdDaysAgo: 91,
        lastLoginDaysAgo: 89,
      })

      // Act
      const inactiveUsers = await removeInactiveUsers()

      // Assert
      expect(inactiveUsers).toHaveLength(0)
    })

    it("should only select inactive users from a mixed pool", async () => {
      // Arrange
      const _userCreatedRecentlyNeverLoggedIn = await setupUserWrapper({
        createdDaysAgo: 89,
        lastLoginDaysAgo: null,
      })
      const _userCreatedRecentlyLoggedInRecently = await setupUserWrapper({
        createdDaysAgo: 89,
        lastLoginDaysAgo: 1,
      })
      const _userCreatedLongAgoLoggedInRecently = await setupUserWrapper({
        createdDaysAgo: 91,
        lastLoginDaysAgo: 89,
      })
      const userCreatedLongAgoNeverLoggedIn = await setupUserWrapper({
        createdDaysAgo: 91,
        lastLoginDaysAgo: null,
      })
      const userCreatedLongAgoLoggedInLongAgo = await setupUserWrapper({
        createdDaysAgo: 91,
        lastLoginDaysAgo: 91,
      })

      // Act
      const inactiveUsers = await removeInactiveUsers()

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
          createdDaysAgo,
          lastLoginDaysAgo,
          isDeleted: true,
        })
      }

      // Act
      const inactiveUsers = await removeInactiveUsers()

      // Assert
      expect(inactiveUsers).toHaveLength(0)
    })

    it("should NOT select isomer admins and migrators", async () => {
      // Arrange
      await Promise.all(
        ISOMER_ADMINS_AND_MIGRATORS_EMAILS.map((email) =>
          setupUserWrapper({
            email,
            createdDaysAgo: 91,
            lastLoginDaysAgo: null,
          }),
        ),
      )

      // Act
      const inactiveUsers = await removeInactiveUsers()

      // Assert
      expect(inactiveUsers).toHaveLength(0)
    })
  })
})
