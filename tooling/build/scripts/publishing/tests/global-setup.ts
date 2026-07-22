import type {} from "@opengovsg/starter-kitty-testcontainers/vitest"
import type { TestProject } from "vitest/node"
import {
  getMappedPort,
  postgres,
} from "@opengovsg/starter-kitty-testcontainers"
import { createGlobalSetup } from "@opengovsg/starter-kitty-testcontainers/vitest"
import { readdirSync, readFileSync, statSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"
import { Client } from "pg"

const __dirname = dirname(fileURLToPath(import.meta.url))

const prismaMigrationDir = join(
  __dirname,
  "..",
  "..",
  "..",
  "..",
  "..",
  "packages",
  "db",
  "prisma",
  "migrations",
)

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

const setupContainers = createGlobalSetup([
  postgres({
    image: "postgres:15-alpine",
    wait: {
      type: "LOG",
      message: "database system is ready to accept connections",
    },
  }),
])

export default async (project: TestProject) => {
  const teardown = await setupContainers(project)

  const pg = project.getProvidedContext().testcontainers.postgres
  if (!pg) {
    throw new Error("Cannot find postgres container")
  }

  const env = pg.configuration.environment ?? {}
  const dbUsername = env.POSTGRES_USER ?? "root"
  const dbPassword = env.POSTGRES_PASSWORD ?? "root"
  const dbName = env.POSTGRES_DB ?? "test"
  const dbPort = getMappedPort(pg, 5432)

  const client = new Client({
    host: pg.host,
    port: dbPort,
    user: dbUsername,
    password: dbPassword,
    database: dbName,
  })
  await client.connect()
  await applyMigrations(client)
  await client.end()

  // Test workers fork off this process after global setup, so plain env
  // assignments are visible to the test files
  process.env.TEST_DB_HOST = pg.host
  process.env.TEST_DB_PORT = String(dbPort)
  process.env.TEST_DB_USERNAME = dbUsername
  process.env.TEST_DB_PASSWORD = dbPassword
  process.env.TEST_DB_NAME = dbName

  return teardown
}
