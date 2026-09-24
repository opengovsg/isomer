import type { ContainerConfiguration } from "@opengovsg/starter-kitty-testcontainers"
import { postgres } from "@opengovsg/starter-kitty-testcontainers"
import { createGlobalSetup } from "@opengovsg/starter-kitty-testcontainers/vitest"

// No preset for mockpass; spelled out as a plain `ContainerConfiguration`.
const mockpass: ContainerConfiguration = {
  name: "mockpass",
  image: "opengovsg/mockpass:4.5.1",
  ports: [5156],
  extraHosts: [{ host: "host.docker.internal", ipAddress: "host-gateway" }],
  environment: {
    MOCKPASS_NRIC: "S6005038D",
    MOCKPASS_UEN: "123456789A",
    SHOW_LOGIN_PAGE: "true",
    // NOTE: the mockpass container needs to communicate with our host machine
    // over port 3000 so that it can fetch the JWKS endpoint
    SP_RP_JWKS_ENDPOINT:
      "http://host.docker.internal:3000/api/sign-in/singpass/jwks",
    SINGPASS_CLIENT_PROFILE: "direct",
  },
  wait: { type: "PORT" },
}

export default createGlobalSetup([
  postgres({ image: "postgres:15-alpine" }),
  mockpass,
])
