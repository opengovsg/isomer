import { env } from "~/env.mjs"

import type { Kysely, DB } from "@isomer/db"
import { createDb } from "@isomer/db"

import { TracingPlugin } from "./tracing-plugin"

export const db: Kysely<DB> = createDb({
  connectionString: `${env.DATABASE_URL}`,
  // oxlint-disable-next-line node/no-process-env
  log: process.env.NODE_ENV === "development" ? ["error"] : undefined,
  // add tracing plugin for dd-spans to intercept kysely queries
  plugins: [new TracingPlugin()],
})
