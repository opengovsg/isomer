import { GenericContainer, Wait } from "testcontainers"

import { applyMigrations } from "@isomer/db/testing"

const DB_USERNAME = "root"
const DB_PASSWORD = "root"
const DB_NAME = "test"

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

  const host = container.getHost()
  const port = container.getMappedPort(5432)

  // Apply @isomer/db's migrations via the shared helper, which owns the
  // migrations path + the read-`.sql` (dd-trace-safe) apply loop.
  await applyMigrations(
    `postgres://${DB_USERNAME}:${DB_PASSWORD}@${host}:${port}/${DB_NAME}`,
  )

  // Test workers fork off this process after global setup, so plain env
  // assignments are visible to the test files
  process.env.TEST_DB_HOST = host
  process.env.TEST_DB_PORT = String(port)
  process.env.TEST_DB_USERNAME = DB_USERNAME
  process.env.TEST_DB_PASSWORD = DB_PASSWORD
  process.env.TEST_DB_NAME = DB_NAME

  return async () => {
    await container.stop({ remove: true })
  }
}
