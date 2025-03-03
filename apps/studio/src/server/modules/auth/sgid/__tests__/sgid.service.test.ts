import { resetTables } from "tests/integration/helpers/db"
import { describe, expect, it } from "vitest"

import { prisma } from "~/server/prisma"
import { upsertSgidAccountAndUser } from "../sgid.service"

describe("sgid.service", () => {
  const TEST_EMAIL = "test@open.gov.sg"
  const TEST_NAME = "Test User"
  const TEST_SUB = "test-sub-123"

  beforeEach(async () => {
    await resetTables("User")
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
      const user = await prisma.user.findUnique({
        where: { email: TEST_EMAIL },
      })
      expect(user?.lastLoginAt).toBe(null)
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
      const user = await prisma.user.findUnique({
        where: { email: TEST_EMAIL },
      })
      expect(user?.lastLoginAt).toBeInstanceOf(Date)
      expect(user?.lastLoginAt!.getTime()).toBeGreaterThan(
        beforeLogin.getTime(),
      )
    })
  })
})
