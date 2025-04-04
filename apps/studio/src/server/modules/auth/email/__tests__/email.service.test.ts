import { AuditLogEvent } from "@prisma/client"
import { resetTables } from "tests/integration/helpers/db"
import { setupUser } from "tests/integration/helpers/seed"

import { db } from "~/server/modules/database"
import { upsertUser } from "../email.service"

describe("email.service", () => {
  const TEST_EMAIL = "test@example.com"

  beforeEach(async () => {
    await resetTables("AuditLog", "User")
  })

  describe("upsertUser", () => {
    it("should return an existing user if it already exists in the database", async () => {
      // Arrange
      await setupUser({ email: TEST_EMAIL })

      // Act
      const user = await db.transaction().execute(async (tx) => {
        return upsertUser({ tx, email: TEST_EMAIL })
      })

      // Assert
      expect(user).toBeDefined()
      expect(user.email).toBe(TEST_EMAIL)
      await expect(
        db.selectFrom("AuditLog").selectAll().execute(),
      ).resolves.toHaveLength(0)
    })

    it("should create a new user if it does not exist in the database", async () => {
      // Arrange
      await setupUser({ email: "someone-else@example.com" })

      // Act
      const user = await db.transaction().execute(async (tx) => {
        return upsertUser({ tx, email: TEST_EMAIL })
      })

      // Assert
      expect(user).toBeDefined()
      expect(user.email).toBe(TEST_EMAIL)
      const auditLogs = await db.selectFrom("AuditLog").selectAll().execute()
      expect(auditLogs).toHaveLength(1)
      expect(auditLogs[0]?.userId).toBe(user.id)
      expect(auditLogs[0]?.eventType).toBe(AuditLogEvent.UserCreate)
    })
  })
})
