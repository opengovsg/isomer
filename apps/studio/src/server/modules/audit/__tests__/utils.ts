import { db } from "../../database"

export const assertAuditLogRows = async (numRows = 0) => {
  const actual = await db.selectFrom("AuditLog").selectAll().execute()

  expect(actual).toHaveLength(numRows)
}
