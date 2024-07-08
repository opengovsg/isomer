import { Kysely, PostgresDialect } from "kysely"
import pg from "pg"
import { type DB } from "prisma/generated/generatedTypes"

import { env } from "~/env.mjs"

const connectionString = `${env.DATABASE_URL}`

// TODO: Add ssl option later
const dialect = new PostgresDialect({
  pool: new pg.Pool({
    connectionString,
  }),
})

export const db: Kysely<DB> = new Kysely<DB>({
  // eslint-disable-next-line no-restricted-properties
  log: process.env.NODE_ENV === "development" ? ["error"] : undefined,
  dialect,
})
