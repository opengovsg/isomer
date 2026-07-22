import type { DB } from "~/server/modules/database"
import { getPostgresConnectionString } from "@opengovsg/starter-kitty-testcontainers"
import { PrismaPg } from "@prisma/adapter-pg"
import { Kysely, PostgresDialect } from "kysely"
import { randomUUID } from "node:crypto"
import { readdirSync, readFileSync, statSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"
import { Client, Pool } from "pg"
import { inject } from "vitest"
import { PrismaClient } from "~prisma/generated/prisma/client"

const prismaMigrationDir = join(
  fileURLToPath(dirname(import.meta.url)),
  "..",
  "..",
  "..",
  "..",
  "packages",
  "db",
  "prisma",
  "migrations",
)

const container = inject("testcontainers").postgres

if (!container) {
  throw new Error("Cannot find postgres container")
}

const testSpecificDb = randomUUID()

const originalConnectionString = getPostgresConnectionString(container)

const connectionString = getPostgresConnectionString(container, {
  database: testSpecificDb,
})

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
  adapter: new PrismaPg({ connectionString }),
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
