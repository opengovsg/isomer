import { randomUUID } from "crypto"
import { readdirSync, readFileSync, statSync } from "fs"
import { dirname, join } from "path"
import { fileURLToPath } from "url"
import { PrismaClient } from "@prisma/client"
import { Kysely, PostgresDialect } from "kysely"
import { Client, Pool } from "pg"
import { parse } from "superjson"

import type { DB } from "~/server/modules/database"
import { CONTAINER_INFORMATION_SCHEMA } from "../common"

const prismaMigrationDir = join(
  fileURLToPath(dirname(import.meta.url)),
  "..",
  "..",
  "prisma",
  "migrations",
)

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
const databaseId = configuration.environment?.POSTGRES_DB ?? "test"

const testSpecificDb = randomUUID()

const originalConnectionString = `postgres://${username}:${password}@${host}:${
  ports.get(5432)?.toString() ?? "5432"
}/${databaseId}`

const connectionString = `postgres://${username}:${password}@${host}:${
  ports.get(5432)?.toString() ?? "5432"
}/${testSpecificDb}`

const setupPgClient = async () => {
  const _pgClient = new Client({
    connectionString: originalConnectionString,
  })
  await _pgClient.connect()
  await _pgClient.query(`CREATE DATABASE "${testSpecificDb}";`)
  await _pgClient.end()

  const client = new Client({
    connectionString,
  })
  return client
}

// Running migrations manually; dd-trace intercepts `exec` usage and prevents runs
const applyMigrations = async (client: Client) => {
  const directory = readdirSync(prismaMigrationDir).sort()
  for (const file of directory) {
    const name = `${prismaMigrationDir}/${file}`
    if (statSync(name).isDirectory()) {
      const migration = readFileSync(`${name}/migration.sql`, "utf8")
      await client.query(migration)
    }
  }
}

const db = new Kysely<DB>({
  dialect: new PostgresDialect({
    pool: new Pool({
      connectionString,
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

const pgClient = await setupPgClient()
await pgClient.connect()
await applyMigrations(pgClient)
await pgClient.end()
