import { Kysely, PostgresDialect } from 'kysely'
import { DB } from './prisma/generated/types'
import { Pool } from 'pg'

const connectionString = `${process.env.DATABASE_URL}`

const dialect = new PostgresDialect({
  pool: new Pool({
    connectionString,
  }),
})

export const db: Kysely<DB> = new Kysely<DB>({
  dialect,
})
