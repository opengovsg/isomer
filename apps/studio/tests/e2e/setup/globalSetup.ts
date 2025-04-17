import { Network } from "testcontainers"
import { CONTAINER_CONFIGURATIONS, setup, teardown } from "tests/common"

import { env } from "~/env.mjs"

export default async () => {
  console.log("initialising db")

  // NOTE: If this is not a CI env, we don't handle
  // setup and teardown of runtime.
  // This is because our Dockerfile uses `COPY . .`,
  // which will run a full build on any file change.
  if (!env.CI) return

  const network = await new Network().start()

  const containers = await setup([CONTAINER_CONFIGURATIONS.database], network)

  const databaseContainer = containers.find(({ name }) => name === "database")
  if (!databaseContainer) {
    throw new Error("Missing database container")
  }

  return () => teardown(containers)
}
