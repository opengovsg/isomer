import {
  getContainer,
  getMappedPort,
} from "@opengovsg/starter-kitty-testcontainers"

const container = getContainer("mockpass")
const port = getMappedPort(container, 5156)

process.env.SINGPASS_ISSUER_ENDPOINT = `http://${container.host}:${port}/singpass/v2`
