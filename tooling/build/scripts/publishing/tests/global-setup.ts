import { readdirSync, readFileSync, statSync } from "node:fs"
import path from "node:path"
import { Client } from "pg"
import { GenericContainer, Wait } from "testcontainers"

const prismaMigrationDir = path.join(
  import.meta.dirname,
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

const applyMigrations = async (client: Client, migrationDirs: string[]) => {
  const applyNext = async (index: number): Promise<void> => {
    if (index >= migrationDirs.length) {
      return
    }

    const name = migrationDirs[index]
    if (statSync(name).isDirectory()) {
      const migration = readFileSync(`${name}/migration.sql`, "utf-8")
      await client.query(migration)
    }

    await applyNext(index + 1)
  }

  await applyNext(0)
}

const globalSetup = async () => {
  const container = await new GenericContainer("postgres:15-alpine")
    .withExposedPorts(5432)
    .withEnvironment({
      POSTGRES_DB: DB_NAME,
      POSTGRES_PASSWORD: DB_PASSWORD,
      POSTGRES_USER: DB_USERNAME,
    })
    .withStartupTimeout(60_000)
    .withWaitStrategy(
      Wait.forLogMessage("database system is ready to accept connections", 2),
    )
    .start()

  const client = new Client({
    database: DB_NAME,
    host: container.getHost(),
    password: DB_PASSWORD,
    port: container.getMappedPort(5432),
    user: DB_USERNAME,
  })
  await client.connect()
  const migrationDirs = readdirSync(prismaMigrationDir)
    .toSorted()
    .map((file) => `${prismaMigrationDir}/${file}`)
  await applyMigrations(client, migrationDirs)
  await client.end()

  process.env.TEST_DB_HOST = container.getHost()
  process.env.TEST_DB_PORT = String(container.getMappedPort(5432))
  process.env.TEST_DB_USERNAME = DB_USERNAME
  process.env.TEST_DB_PASSWORD = DB_PASSWORD
  process.env.TEST_DB_NAME = DB_NAME

  return async () => {
    await container.stop({ remove: true })
  }
}

export default globalSetup
