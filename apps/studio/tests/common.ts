import type { StartedTestContainer } from "testcontainers"
import { GenericContainer, Wait } from "testcontainers"
import { z } from "zod"

type ContainerType = "database"
export const CONTAINER_CONFIGURATIONS: {
  [key in ContainerType]: ContainerConfiguration
} = {
  database: {
    name: "database",
    image: "postgres:15-alpine",
    ports: [5432],
    environment: {
      POSTGRES_USER: "root",
      POSTGRES_PASSWORD: "root",
      POSTGRES_DB: "test",
    },
    wait: { type: "PORT" },
  },
}

export const CONTAINER_INFORMATION_SCHEMA = z.array(
  z.object({
    name: z.string(),
    host: z.string(),
    ports: z.map(z.number(), z.number()),
    configuration: z.object({
      name: z.string(),
      image: z.string(),
      ports: z
        .array(
          z.union([
            z.number(),
            z.object({ container: z.number(), host: z.number() }),
          ]),
        )
        .optional(),
      environment: z.record(z.string(), z.string()).optional(),
      wait: z
        .union([
          z.object({ type: z.literal("PORT"), timeout: z.number().optional() }),
          z.object({
            type: z.literal("LOG"),
            message: z.string(),
            times: z.number().optional(),
            timeout: z.number().optional(),
          }),
          z.object({
            type: z.literal("HEALTHCHECK"),
            timeout: z.number().optional(),
          }),
        ])
        .optional(),
    }),
  }),
)

export type ContainerInformation = z.infer<
  typeof CONTAINER_INFORMATION_SCHEMA
>[number]

export type ContainerConfiguration = ContainerInformation["configuration"]

export const setup = async (configurations: ContainerConfiguration[]) => {
  const containerTemplates = configurations.map((configuration) => {
    const { name, image, ports = [], environment, wait } = configuration
    let container = new GenericContainer(image)

    if (ports.length) {
      container = container.withExposedPorts(...ports)
    }

    if (environment) {
      container = container.withEnvironment(environment)
    }

    if (wait) {
      const { type, timeout = 60 * 1000 } = wait
      switch (type) {
        case "PORT":
          container = container
            .withStartupTimeout(timeout)
            .withWaitStrategy(Wait.forListeningPorts())
          break
        case "LOG":
          container = container
            .withStartupTimeout(timeout)
            .withWaitStrategy(Wait.forLogMessage(wait.message, wait.times ?? 1))
          break
        case "HEALTHCHECK":
          container = container
            .withStartupTimeout(timeout)
            .withWaitStrategy(Wait.forHealthCheck())
          break
      }
    }

    return {
      name,
      container,
      ports: ports.map((port) =>
        typeof port === "number" ? port : port.container,
      ),
      configuration,
    }
  })

  const startedContainers = await Promise.all(
    containerTemplates.map(async (containerTemplate) => {
      const { container, ports } = containerTemplate

      const startedContainer = await container.start()

      const host = startedContainer.getHost()

      const mappedPorts = new Map<number, number>()

      for (const port of ports) {
        mappedPorts.set(port, startedContainer.getMappedPort(port))
      }

      return {
        ...containerTemplate,
        host,
        ports: mappedPorts,
        container: startedContainer,
      }
    }),
  )

  return startedContainers
}

export const teardown = async (
  containers: { container: StartedTestContainer }[],
) => {
  await Promise.all(
    containers.map((container) => container.container.stop({ remove: true })),
  )
}
