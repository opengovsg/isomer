import { readdirSync, readFileSync, statSync } from "fs"
import { dirname, join } from "path"
import { fileURLToPath } from "url"
import { PrismaClient } from "@prisma/client"
import { Kysely, PostgresDialect } from "kysely"
import { Client, Pool } from "pg"
import { parse } from "superjson"
import { CONTAINER_INFORMATION_SCHEMA } from "tests/global-setup"

import type { DB } from "~/server/modules/database"

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

const connectionString = `postgres://${username}:${password}@${host}:${
  ports.get(5432)?.toString() ?? "5432"
}/${databaseId}`

const pgClient = new Client({
  connectionString,
})

// Running migrations manually; dd-trace intercepts `exec` usage and prevents runs
const applyMigrations = async () => {
  const directory = readdirSync(prismaMigrationDir).sort()
  for (const file of directory) {
    const name = `${prismaMigrationDir}/${file}`
    if (statSync(name).isDirectory()) {
      const migration = readFileSync(`${name}/migration.sql`, "utf8")
      await pgClient.query(migration)
    }
  }
}

const resetDb = async () => {
  try {
    await pgClient.query(`DROP SCHEMA public CASCADE`)
    await pgClient.query(`CREATE SCHEMA public`)
  } catch (error) {
    console.log({ error })
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

beforeAll(async () => {
  await pgClient.connect()
  await applyMigrations()
})

afterAll(async () => {
  await resetDb()
  await pgClient.end()
})
