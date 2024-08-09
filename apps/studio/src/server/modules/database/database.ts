import { type DB } from "~prisma/generated/generatedTypes"
import { PostgresDialect } from "kysely"
import pg from "pg"

import { env } from "~/env.mjs"
import { Kysely } from "./types"

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
