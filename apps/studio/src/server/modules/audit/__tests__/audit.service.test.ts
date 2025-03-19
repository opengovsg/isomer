import { resetTables } from "tests/integration/helpers/db"
import { setupUser } from "tests/integration/helpers/seed"

import { AuditLogEvent, db } from "../../database"
import { logUserEvent } from "../audit.service"

describe("audit.service", () => {
  beforeEach(async () => {
    await resetTables("AuditLog", "User")
  })

  describe("logUserEvent", () => {
    it("should log a resource event successfully", async () => {
      // Arrange
      const user = await setupUser({
        email: "test@example.com",
      })

      // Act
      await db.transaction().execute(async (tx) => {
        await logUserEvent(tx, {
          eventType: AuditLogEvent.UserCreate,
          delta: {
            before: null,
            after: user,
          },
          by: user,
          ip: "1.2.3.4",
        })
      })

      // Assert
      const auditLogs = await db
        .selectFrom("AuditLog")
        .selectAll()
        .executeTakeFirstOrThrow()

      expect(auditLogs).toBeDefined()
      expect(auditLogs.userId).toEqual(user.id)
      expect(auditLogs.eventType).toEqual(AuditLogEvent.UserCreate)
    })

    // NOTE: This test pertains to the DB trigger function that is used to
    // prevent the AuditLog table from getting UPDATE or DELETE
    it("should prevent audit logs from being tampered with", async () => {
      // Arrange
      const user = await setupUser({
        email: "test@example.com",
      })
      await db.transaction().execute(async (tx) => {
        await logUserEvent(tx, {
          eventType: AuditLogEvent.UserCreate,
          delta: {
            before: null,
            after: user,
          },
          by: user,
          ip: "1.2.3.4",
        })
      })

      // Assert
      await expect(
        db
          .updateTable("AuditLog")
          .set({ eventType: AuditLogEvent.UserDelete })
          .execute(),
      ).rejects.toThrowError()
      await expect(db.deleteFrom("AuditLog").execute()).rejects.toThrowError()
    })
  })
})
