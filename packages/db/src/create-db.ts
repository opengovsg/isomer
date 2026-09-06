import type { KyselyConfig, KyselyPlugin, LogConfig } from "kysely"
import { PostgresDialect } from "kysely"
import { Pool } from "pg"
import type { Pool as PgPool } from "pg"
import Cursor from "pg-cursor"

import type { DB } from "./generated/generatedTypes"
import { Kysely } from "./kysely"

export interface CreateDbConfig {
  connectionString: string
  log?: LogConfig
  plugins?: KyselyPlugin[]
  /**
   * Override the pg.Pool used by the underlying dialect. Useful for tests
   * that want to inject a mock pool or share a pool between callers.
   */
  pool?: PgPool
}

export const createDb = ({
  connectionString,
  log,
  plugins,
  pool,
}: CreateDbConfig): Kysely<DB> => {
  const dialect = new PostgresDialect({
    cursor: Cursor,
    pool: pool ?? new Pool({ connectionString }),
  })

  const config: KyselyConfig = {
    dialect,
    log,
    plugins,
  }

  return new Kysely<DB>(config)
}
