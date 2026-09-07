import { stringify } from "superjson"

import type { ContainerInformation } from "./common"
import { CONTAINER_CONFIGURATIONS, setup, teardown } from "./common"

export default async () => {
  const containers = await setup([
    CONTAINER_CONFIGURATIONS.database,
    CONTAINER_CONFIGURATIONS.mockpass,
  ])

  Object.defineProperty(process.env, "testcontainers", {
    configurable: true,
    enumerable: true,
    value: stringify(
      containers.map((container) => {
        const { container: _, ...rest } = container
        const result: ContainerInformation = rest
        return result
      }),
    ),
    writable: true,
  })

  return async () => {
    await teardown(containers)
  }
}
