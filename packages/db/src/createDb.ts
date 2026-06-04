import type { KyselyConfig, KyselyPlugin, LogConfig } from "kysely"
import { PostgresDialect } from "kysely"
import pg from "pg"

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
  pool?: pg.Pool
}

export const createDb = ({
  connectionString,
  log,
  plugins,
  pool,
}: CreateDbConfig): Kysely<DB> => {
  const dialect = new PostgresDialect({
    pool: pool ?? new pg.Pool({ connectionString }),
  })

  const config: KyselyConfig = {
    dialect,
    log,
    plugins,
  }

  return new Kysely<DB>(config)
}
