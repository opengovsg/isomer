/* oxlint-disable typescript/no-unsafe-return, eslint/no-unused-vars, eslint/no-shadow, typescript/no-unsafe-argument, eslint/default-case, typescript/switch-exhaustiveness-check, unicorn/import-style -- studio lint cleanup */
import type { StartedNetwork, StartedTestContainer } from "testcontainers"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"
import { GenericContainer, Wait } from "testcontainers"
import { z } from "zod"

type ContainerType = "database" | "mockpass"
export const CONTAINER_CONFIGURATIONS = {
  database: {
    environment: {
      POSTGRES_DB: "test",
      POSTGRES_PASSWORD: "root",
      POSTGRES_USER: "root",
    },
    image: "postgres:15-alpine",
    name: "database",
    ports: [5432],
    type: "image",
    wait: { type: "PORT" },
  },
  mockpass: {
    environment: {
      MOCKPASS_NRIC: "S6005038D",
      MOCKPASS_UEN: "123456789A",
      SHOW_LOGIN_PAGE: "true",
      SINGPASS_CLIENT_PROFILE: "direct",
      SP_RP_JWKS_ENDPOINT:
        "http://host.docker.internal:3000/api/sign-in/singpass/jwks",
    },
    extraHosts: [{ host: "host.docker.internal", ipAddress: "host-gateway" }],
    image: "opengovsg/mockpass:4.5.1",
    name: "mockpass",
    ports: [5156],
    type: "image",
    wait: { type: "PORT" },
  },
} satisfies Record<ContainerType, ContainerConfiguration>

const baseContainerConfiguration = z.object({
  buildArgs: z.record(z.string(), z.string()).optional(),
  environment: z.record(z.string(), z.string()).optional(),
  extraHosts: z
    .array(z.object({ host: z.string(), ipAddress: z.string() }))
    .optional(),
  name: z.string(),
  ports: z
    .array(
      z.union([
        z.number(),
        z.object({ container: z.number(), host: z.number() }),
      ]),
    )
    .optional(),
  wait: z
    .union([
      z.object({ timeout: z.number().optional(), type: z.literal("PORT") }),
      z.object({
        message: z.string(),
        timeout: z.number().optional(),
        times: z.number().optional(),
        type: z.literal("LOG"),
      }),
      z.object({
        timeout: z.number().optional(),
        type: z.literal("HEALTHCHECK"),
      }),
    ])
    .optional(),
})

export const CONTAINER_INFORMATION_SCHEMA = z.array(
  z.object({
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
    host: z.string(),
    name: z.string(),
    ports: z.map(z.number(), z.number()),
  }),
)

export type ContainerInformation = z.infer<
  typeof CONTAINER_INFORMATION_SCHEMA
>[number]

type ContainerConfiguration = ContainerInformation["configuration"]

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
      const __filename = import.meta.filename
      const __dirname = import.meta.dirname

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
        const { typeValue, timeout = 60 * 1000 } = wait
        switch (type) {
          case "PORT": {
            container = container
              .withStartupTimeout(timeout)
              .withWaitStrategy(Wait.forListeningPorts())
            break
          }
          case "LOG": {
            container = container
              .withStartupTimeout(timeout)
              .withWaitStrategy(
                Wait.forLogMessage(wait.message, wait.times ?? 1),
              )
            break
          }
          case "HEALTHCHECK": {
            container = container
              .withStartupTimeout(timeout)
              .withWaitStrategy(Wait.forHealthCheck())
            break
          }
        }
      }

      const exposedPortSchema = z.union([
        z.number(),
        z
          .object({ container: z.number(), host: z.number() })
          .transform(({ container }) => containerValue),
      ])

      const getExposedPort = (
        port: z.input<typeof exposedPortSchema>,
      ): number => exposedPortSchema.parse(port)

      return {
        configuration,
        container,
        name,
        ports: ports.map(getExposedPort),
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
        container: startedContainer,
        host,
        ports: mappedPorts,
      }
    }),
  )

  return startedContainers
}

export const teardown = async (
  containers: { container: StartedTestContainer }[],
) => {
  await Promise.all(
    containers.map(
      async (container) => await container.container.stop({ remove: true }),
    ),
  )
}
