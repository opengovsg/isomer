import { randomUUID } from "node:crypto"
import pg from "pg"

import { createDb } from "@isomer/db"
import { applyMigrations } from "@isomer/db/testing"

// The docker-compose Postgres service (see docker-compose.yml) exposes a
// `postgres://root:root@localhost:5430/test` admin connection. Each test file
// creates its own throwaway database on that service so files do not interfere
// with one another, then applies the `@isomer/db` schema via the shared
// `applyMigrations` helper (PR 5a) — never `prisma migrate deploy` (see
// docs/adr/0001-isomer-db-testing-applies-migrations-via-sql.md).
const ADMIN_CONNECTION_STRING =
  process.env.DATABASE_URL ?? "postgres://root:root@localhost:5430/test"

const buildConnectionString = (dbName: string): string => {
  const url = new URL(ADMIN_CONNECTION_STRING)
  url.pathname = `/${dbName}`
  return url.toString()
}

export interface TestDb {
  /** Connection string pointing at the freshly-created, migrated database. */
  connectionString: string
  /** Kysely instance for building fixtures via `@isomer/db`. */
  db: ReturnType<typeof createDb>
  /** Drops the database and tears down the Kysely pool. */
  destroy: () => Promise<void>
}

/**
 * Creates a fresh database on the docker-compose service, applies the
 * `@isomer/db` schema to it, and returns a Kysely instance + teardown.
 */
export const setupTestDb = async (): Promise<TestDb> => {
  const dbName = `publishing_test_${randomUUID().replace(/-/g, "")}`

  const admin = new pg.Client({ connectionString: ADMIN_CONNECTION_STRING })
  await admin.connect()
  try {
    await admin.query(`CREATE DATABASE "${dbName}"`)
  } finally {
    await admin.end()
  }

  const connectionString = buildConnectionString(dbName)
  await applyMigrations(connectionString)

  const db = createDb({ connectionString })

  const destroy = async () => {
    await db.destroy()
    const cleanup = new pg.Client({
      connectionString: ADMIN_CONNECTION_STRING,
    })
    await cleanup.connect()
    try {
      await cleanup.query(
        `SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = $1 AND pid <> pg_backend_pid()`,
        [dbName],
      )
      await cleanup.query(`DROP DATABASE IF EXISTS "${dbName}"`)
    } finally {
      await cleanup.end()
    }
  }

  return { connectionString, db, destroy }
}
