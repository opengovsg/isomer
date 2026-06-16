import { readdirSync, readFileSync, statSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"
import { Client } from "pg"
import { GenericContainer, Wait } from "testcontainers"

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

const DB_USERNAME = "root"
const DB_PASSWORD = "root"
const DB_NAME = "test"

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

export default async () => {
  const container = await new GenericContainer("postgres:15-alpine")
    .withExposedPorts(5432)
    .withEnvironment({
      POSTGRES_USER: DB_USERNAME,
      POSTGRES_PASSWORD: DB_PASSWORD,
      POSTGRES_DB: DB_NAME,
    })
    .withStartupTimeout(60_000)
    .withWaitStrategy(Wait.forListeningPorts())
    .start()

  const client = new Client({
    host: container.getHost(),
    port: container.getMappedPort(5432),
    user: DB_USERNAME,
    password: DB_PASSWORD,
    database: DB_NAME,
  })
  await client.connect()
  await applyMigrations(client)
  await client.end()

  // Test workers fork off this process after global setup, so plain env
  // assignments are visible to the test files
  process.env.TEST_DB_HOST = container.getHost()
  process.env.TEST_DB_PORT = String(container.getMappedPort(5432))
  process.env.TEST_DB_USERNAME = DB_USERNAME
  process.env.TEST_DB_PASSWORD = DB_PASSWORD
  process.env.TEST_DB_NAME = DB_NAME

  return async () => {
    await container.stop({ remove: true })
  }
}
