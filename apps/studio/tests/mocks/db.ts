import { exec } from "child_process"
import { randomUUID } from "crypto"
import { dirname, join } from "path"
import { fileURLToPath } from "url"
import { promisify } from "util"
import { PrismaClient } from "@prisma/client"
import { Kysely, PostgresDialect } from "kysely"
import { Pool } from "pg"
import { parse } from "superjson"
import { CONTAINER_INFORMATION_SCHEMA } from "tests/global-setup"

import type { DB } from "~/server/modules/database"

const execAsync = promisify(exec)

const schema = join(
  fileURLToPath(dirname(import.meta.url)),
  "..",
  "..",
  "prisma",
  "schema.prisma",
)

const databaseId = randomUUID()

const parsed = CONTAINER_INFORMATION_SCHEMA.parse(
  parse(
    // eslint-disable-next-line no-restricted-properties
    process.env.testcontainers ?? "",
  ),
)

const container = parsed.find((c) => c.configuration.name === "database")

if (!container) {
  console.log("cannot find container")
  throw new Error("Cannot find container")
}

const { host, ports, configuration } = container

const username = configuration.environment?.POSTGRES_USER ?? "postgres"
const password = configuration.environment?.POSTGRES_PASSWORD ?? "postgres"

const connectionString = `postgres://${username}:${password}@${host}:${
  ports.get(5432)?.toString() ?? "5432"
}/${databaseId}`

await execAsync(`npx prisma migrate deploy --schema ${schema}`, {
  env: {
    // eslint-disable-next-line no-restricted-properties
    ...process.env,
    NODE_ENV: "test",
    DATABASE_URL: connectionString,
  },
})

const db = new Kysely<DB>({
  dialect: new PostgresDialect({
    pool: new Pool({
      connectionString: connectionString,
    }),
  }),
})

const prisma: PrismaClient = new PrismaClient({
  datasourceUrl: connectionString,
})

vi.mock("../../src/server/modules/database/database", () => ({
  db,
}))

vi.mock("../../src/server/prisma", () => ({
  prisma,
}))
