import { readdirSync, readFileSync, statSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"
import pg from "pg"

// Resolve our own migrations directory relative to this file so consumers never
// hard-code a path to `@isomer/db`'s migrations. `src/testing.ts` sits one level
// below the package root, and migrations live at `prisma/migrations`.
const migrationsDir = join(
  dirname(fileURLToPath(import.meta.url)),
  "..",
  "prisma",
  "migrations",
)

/**
 * Applies all `@isomer/db` migrations to a fresh test database.
 *
 * Reads each migration's `migration.sql` in lexicographic order and executes it
 * over a short-lived `pg` client. This deliberately does NOT shell out to
 * `prisma migrate deploy`: dd-trace is loaded in the test process and intercepts
 * child-process `exec`/`spawn`, which prevents the Prisma CLI from launching.
 * See `docs/adr/0001-isomer-db-testing-applies-migrations-via-sql.md`.
 */
export const applyMigrations = async (
  connectionString: string,
): Promise<void> => {
  const client = new pg.Client({ connectionString })
  await client.connect()
  try {
    const entries = readdirSync(migrationsDir).sort()
    for (const entry of entries) {
      const path = join(migrationsDir, entry)
      if (statSync(path).isDirectory()) {
        const migration = readFileSync(join(path, "migration.sql"), "utf8")
        await client.query(migration)
      }
    }
  } finally {
    await client.end()
  }
}
