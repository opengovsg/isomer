import { env } from "@isomer/env";
import { PostgresDialect } from "kysely";
import { Pool } from "pg";

import type { DB } from "./types";
import { SafeArrayInsertPlugin } from "./plugins/safe-array-insert.plugin";
import { SafeWhereInPlugin } from "./plugins/safe-where-in";
import { Kysely } from "./types";

export const db = new Kysely<DB>({
  log: env.NODE_ENV === "development" ? ["error"] : undefined,
  dialect: new PostgresDialect({
    pool: new Pool({
      // TODO: Add ssl option later
      connectionString: env.DATABASE_URL,
    }),
  }),
  plugins: [new SafeWhereInPlugin(), new SafeArrayInsertPlugin()],
});
