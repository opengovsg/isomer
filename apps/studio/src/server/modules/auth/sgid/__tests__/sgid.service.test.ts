import { resetTables } from "tests/integration/helpers/db"
import { setupUser, setUpWhitelist } from "tests/integration/helpers/seed"
import { describe, expect, it } from "vitest"

import { prisma } from "~/server/prisma"
import { upsertSgidAccountAndUser } from "../sgid.service"

describe("sgid.service", () => {
  const TEST_EMAIL = "test@open.gov.sg"
  const TEST_NAME = "Test User"
  const TEST_SUB = "test-sub-123"

  beforeEach(async () => {
    await resetTables("User")
    await setUpWhitelist({ email: TEST_EMAIL })
  })

  describe("upsertSgidAccountAndUser", () => {
    it("should set lastLoginAt to null when creating a new user", async () => {
      // Act
      await upsertSgidAccountAndUser({
        prisma,
        pocdexEmail: TEST_EMAIL,
        name: TEST_NAME,
        sub: TEST_SUB,
      })

      // Assert
      const user = await prisma.user.findFirst({
        where: { email: TEST_EMAIL },
      })
      expect(user?.lastLoginAt).toBe(null)
    })

    it("should throw if email is deleted", async () => {
      // Arrange
      await setupUser({
        name: "Deleted",
        userId: "deleted123",
        email: TEST_EMAIL,
        phone: "123",
        isDeleted: true,
      })

      // Act
      const result = upsertSgidAccountAndUser({
        prisma,
        pocdexEmail: TEST_EMAIL,
        name: TEST_NAME,
        sub: TEST_SUB,
      })

      // Assert
      await expect(result).rejects.toThrowError(
        "Unauthorized. Contact Isomer support.",
      )
    })

    it("should update lastLoginAt when user logs in", async () => {
      // Arrange
      const beforeLogin = new Date()
      await prisma.user.create({
        data: {
          email: TEST_EMAIL,
          name: TEST_NAME,
          phone: "",
          lastLoginAt: null,
        },
      })

      // Act
      await upsertSgidAccountAndUser({
        prisma,
        pocdexEmail: TEST_EMAIL,
        name: TEST_NAME,
        sub: TEST_SUB,
      })

      // Assert
      const user = await prisma.user.findFirst({
        where: { email: TEST_EMAIL },
      })
      expect(user?.lastLoginAt).toBeInstanceOf(Date)
      expect(user?.lastLoginAt!.getTime()).toBeGreaterThan(
        beforeLogin.getTime(),
      )
    })
  })
})
