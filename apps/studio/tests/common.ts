import { dirname, join } from "path"
import { fileURLToPath } from "url"
import type { StartedNetwork, StartedTestContainer } from "testcontainers"
import { GenericContainer, Wait } from "testcontainers"
import { z } from "zod"

type ContainerType = "database" | "mockpass" | "redis"
export const CONTAINER_CONFIGURATIONS: Record<
  ContainerType,
  ContainerConfiguration
> = {
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
    type: "image",
  },
  mockpass: {
    name: "mockpass",
    image: "opengovsg/mockpass:4.5.1",
    ports: [{ container: 5156, host: 5156 }],
    extraHosts: [{ host: "host.docker.internal", ipAddress: "host-gateway" }],
    environment: {
      MOCKPASS_NRIC: "S6005038D",
      MOCKPASS_UEN: "123456789A",
      SHOW_LOGIN_PAGE: "true",
      SP_RP_JWKS_ENDPOINT:
        "http://host.docker.internal:3000/api/sign-in/singpass/jwks",
      SINGPASS_CLIENT_PROFILE: "direct",
    },
    wait: { type: "PORT" },
    type: "image",
  },
  redis: {
    name: "redis",
    image: "redis:latest",
    ports: [{ container: 6379, host: 6379 }],
    wait: { type: "PORT" },
    type: "image",
  },
}

const baseContainerConfiguration = z.object({
  name: z.string(),
  ports: z
    .array(
      z.union([
        z.number(),
        z.object({ container: z.number(), host: z.number() }),
      ]),
    )
    .optional(),
  environment: z.record(z.string(), z.string()).optional(),
  buildArgs: z.record(z.string(), z.string()).optional(),
  extraHosts: z
    .array(z.object({ host: z.string(), ipAddress: z.string() }))
    .optional(),
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
})

export const CONTAINER_INFORMATION_SCHEMA = z.array(
  z.object({
    name: z.string(),
    host: z.string(),
    ports: z.map(z.number(), z.number()),
    configuration: z.discriminatedUnion("type", [
      baseContainerConfiguration.extend({
        image: z.string(),
        type: z.literal("image"),
      }),
      baseContainerConfiguration.extend({
        dockerfile: z.string(),
        type: z.literal("dockerfile"),
      }),
    ]),
  }),
)

export type ContainerInformation = z.infer<
  typeof CONTAINER_INFORMATION_SCHEMA
>[number]

export type ContainerConfiguration = ContainerInformation["configuration"]

export const setup = async (
  configurations: ContainerConfiguration[],
  network?: StartedNetwork,
) => {
  const containerTemplates = await Promise.all(
    configurations.map(async (configuration) => {
      const {
        name,
        extraHosts,
        ports = [],
        environment,
        wait,
        type,
      } = configuration
      const __filename = fileURLToPath(import.meta.url)
      const __dirname = dirname(__filename)

      const context = join(__dirname, "..", "..", "..")

      let container =
        type === "image"
          ? new GenericContainer(configuration.image)
          : await GenericContainer.fromDockerfile(
              context,
              configuration.dockerfile,
            ).build(name)

      if (ports.length) {
        container = container.withExposedPorts(...ports)
      }

      if (extraHosts) {
        container = container.withExtraHosts(extraHosts)
      }

      if (environment) {
        container = container.withEnvironment(environment)
      }

      if (network) {
        container = container.withNetwork(network).withNetworkAliases(name)
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
              .withWaitStrategy(
                Wait.forLogMessage(wait.message, wait.times ?? 1),
              )
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
    }),
  )

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
