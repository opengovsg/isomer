import { Kysely, PostgresDialect } from 'kysely'
import { Pool } from 'pg'
import { type DB } from 'prisma/generated/generatedTypes'

const connectionString = `${process.env.DATABASE_URL}`

// TODO: Add ssl option later
const dialect = new PostgresDialect({
  pool: new Pool({
    connectionString,
  }),
})

export const db: Kysely<DB> = new Kysely<DB>({
  log: process.env.NODE_ENV === 'development' ? ['error'] : undefined,
  dialect,
})
