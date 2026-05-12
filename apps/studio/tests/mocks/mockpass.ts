import { parse } from "superjson"

import { CONTAINER_INFORMATION_SCHEMA } from "../common"

const parsed = CONTAINER_INFORMATION_SCHEMA.parse(
  parse(process.env.testcontainers ?? ""),
)

const container = parsed.find((c) => c.configuration.name === "mockpass")

if (!container) {
  console.log("cannot find mockpass container")
  throw new Error("Cannot find mockpass container")
}

const { host, ports } = container
const port = ports.get(5156)

if (!port) {
  throw new Error("Cannot find mapped port for mockpass")
}

process.env.SINGPASS_ISSUER_ENDPOINT = `http://${host}:${port}/singpass/v2`
