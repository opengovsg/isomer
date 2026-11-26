import type { AddressInfo } from "node:net"
import { decodeJwt } from "jose"
import http from "node:http"
import { errors, Issuer } from "openid-client"
import {
  afterAll,
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest"

import { getAuthorizationUrl, login } from "../singpass.service"

const REQUEST_URI = "urn:ietf:params:oauth:request_uri:integration-test"

describe("getAuthorizationUrl", () => {
  let server: http.Server
  let baseUrl: string
  const parProofs: string[] = []

  beforeAll(async () => {
    server = http.createServer((req, res) => {
      if (req.method === "POST" && req.url === "/par") {
        const dpop = req.headers.dpop
        if (typeof dpop === "string") parProofs.push(dpop)
        // openid-client treats a successful PAR as HTTP 201.
        res.writeHead(201, { "content-type": "application/json" })
        res.end(JSON.stringify({ request_uri: REQUEST_URI, expires_in: 60 }))
        return
      }
      res.writeHead(404)
      res.end()
    })
    await new Promise<void>((resolve) =>
      server.listen(0, "127.0.0.1", () => resolve()),
    )
    const port = (server.address() as AddressInfo).port
    baseUrl = `http://127.0.0.1:${port}`
  })

  afterAll(async () => {
    await new Promise<void>((resolve, reject) =>
      server.close((error) => (error ? reject(error) : resolve())),
    )
  })

  beforeEach(() => {
    parProofs.length = 0
    // Spy the same Issuer instance singpass.service imported. resetModules()
    // would load a second openid-client and the spy would not apply.
    vi.spyOn(Issuer, "discover").mockResolvedValue(
      new Issuer({
        issuer: baseUrl,
        authorization_endpoint: `${baseUrl}/auth`,
        pushed_authorization_request_endpoint: `${baseUrl}/par`,
        token_endpoint: `${baseUrl}/token`,
        // Matches SINGPASS_SIGNING_KEY_ALG (ES512 when unset).
        token_endpoint_auth_signing_alg_values_supported: ["ES512"],
      }),
    )
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it("sends DPoP on PAR through the production FAPI2Client setup", async () => {
    // Act
    const { authorizationUrl } = await getAuthorizationUrl({ useFapi: true })

    // Assert
    expect(parProofs).toHaveLength(1)
    const proof = decodeJwt(parProofs[0]!)
    expect(proof.htm).toBe("POST")
    expect(proof.htu).toBe(`${baseUrl}/par`)
    expect(new URL(authorizationUrl).searchParams.get("request_uri")).toBe(
      REQUEST_URI,
    )
  })
})

describe("login", () => {
  // login caches its client, so every case must spy on the same issuer
  const issuer = new Issuer({ issuer: "http://localhost" })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it.each([
    {
      name: "token validation",
      error: new errors.RPError({
        message: "Token validation failed",
        jwt: "synthetic-id-token",
      }),
      singpassError: "oidc_client_error",
    },
    {
      name: "the OAuth provider",
      error: new errors.OPError({
        error: "use_dpop_nonce",
        error_description: "synthetic-nonce",
      }),
      singpassError: "use_dpop_nonce",
    },
  ])(
    "logs only safe fields when $name fails",
    async ({ error, singpassError }) => {
      const logger = { info: vi.fn(), error: vi.fn(), warn: vi.fn() }
      vi.spyOn(Issuer, "discover").mockResolvedValue(issuer)
      vi.spyOn(issuer.Client.prototype, "callback").mockRejectedValue(error)

      const result = login({
        code: "code",
        codeVerifier: "verifier",
        nonce: "nonce",
        state: "state",
        useFapi: false,
        logger,
      })

      await expect(result).rejects.toBe(error)
      expect(logger.error).toHaveBeenCalledExactlyOnceWith(
        {
          singpassFlow: "legacy",
          singpassStage: "token_exchange",
          singpassOutcome: "failure",
          singpassError,
        },
        "Singpass legacy: token exchange failed",
      )
    },
  )
})
