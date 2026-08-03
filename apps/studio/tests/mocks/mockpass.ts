import { getMappedPort } from "@opengovsg/starter-kitty-testcontainers"
import { inject } from "vitest"

const container = inject("testcontainers").mockpass

if (!container) {
  throw new Error("Cannot find mockpass container")
}

const port = getMappedPort(container, 5156)

process.env.SINGPASS_ISSUER_ENDPOINT = `http://${container.host}:${port}/singpass/v2`
