import { db, sql } from "~server/db"

import type { DB } from "~server/db"

export async function resetTables(table: keyof DB, ...tables: (keyof DB)[]) {
  for (const t of [table, ...tables]) {
    await db.executeQuery(
      sql`TRUNCATE TABLE ${sql.table(t)} CASCADE;`.compile(db),
    )
  }
}
