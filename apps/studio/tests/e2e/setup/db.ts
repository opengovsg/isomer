import { test } from "@playwright/test"
import { Network } from "testcontainers"
import { applyMigrations, CONTAINER_CONFIGURATIONS, setup } from "tests/common"

import { env } from "~/env.mjs"

test("setup database", async () => {
  // NOTE: 300s or 5 mins. testing using a full build without caching on local
  // took around 3 mins, buffering extra 50% to avoid timing out.
  test.setTimeout(300e3)
  console.log("initialising db")

  // NOTE: If this is not a CI env, we don't handle
  // setup and teardown of runtime.
  // This is because our Dockerfile uses `COPY . .`,
  // which will run a full build on any file change.
  if (!env.CI) return

  // NOTE: This should mirror our Dockerfile's build context
  // inside our CI.
  // In our case, this is the root folder of `isomer`
  // const context = join(__dirname, "..", "..", "..", "..", "..")
  const network = await new Network().start()

  const containers = await setup(
    [CONTAINER_CONFIGURATIONS.database, CONTAINER_CONFIGURATIONS.studio],
    network,
  )

  const databaseContainer = containers.find(({ name }) => name === "database")
  if (!databaseContainer) {
    throw new Error("Missing database container")
  }

  // Run migrations
  // Seed data
  await applyMigrations({
    host: databaseContainer.host,
    port: databaseContainer.ports.get(5432)?.toString() ?? "5432",
    user:
      databaseContainer.configuration.environment?.POSTGRES_USER ?? "postgres",
    password:
      databaseContainer.configuration.environment?.POSTGRES_PASSWORD ??
      "postgres",
    database:
      databaseContainer.configuration.environment?.POSTGRES_DB ?? "postgres",
  })

  console.log("db startup done")
})
