import { decodeJwt, exportJWK, importJWK, jwtVerify } from "jose"
import crypto from "node:crypto"
import { custom, errors, type Client } from "openid-client"
import { env } from "~/env.mjs"

import {
  createEphemeralDpopKey,
  importDpopPrivateKey,
  installDpopHeader,
  pushFapiAuthorizationRequest,
} from "../singpass.fapi"

const FAPI_ISSUER = "https://stg-id.singpass.gov.sg/fapi"
const REQUEST_URI = "urn:ietf:params:oauth:request_uri:abc"

const parameters = {
  redirect_uri: "http://localhost:3000/sign-in/singpass/callback",
  response_type: "code",
  scope: "openid",
  code_challenge_method: "S256",
  code_challenge: "challenge",
  nonce: "nonce",
  state: "state",
  authentication_context_type: "APP_AUTHENTICATION_DEFAULT",
}

// Records positive setTimeout delays and runs them immediately so PAR backoff
// tests do not sleep for 1s + 2s + 4s.
const recordBackoffDelays = () => {
  const delays: number[] = []
  const original = global.setTimeout
  const spy = vi.spyOn(global, "setTimeout").mockImplementation(((
    handler: TimerHandler,
    timeout?: number,
    ...args: unknown[]
  ) => {
    if (typeof timeout === "number" && timeout > 0) delays.push(timeout)
    return original(handler, 0, ...args)
  }) as typeof setTimeout)
  return { delays, restore: () => spy.mockRestore() }
}

const clientWith = (pushedAuthorizationRequest: ReturnType<typeof vi.fn>) =>
  ({
    issuer: {
      metadata: {
        authorization_endpoint: `${FAPI_ISSUER}/auth?unused=1`,
        pushed_authorization_request_endpoint: `${FAPI_ISSUER}/par`,
      },
    },
    pushedAuthorizationRequest,
  }) as unknown as Client

describe("importDpopPrivateKey", () => {
  it("returns a Node private key for the stored DPoP JWK", async () => {
    // Arrange
    const { privateJwk } = await createEphemeralDpopKey()

    // Act
    const key = importDpopPrivateKey(privateJwk)

    // Assert
    expect(key).toBeInstanceOf(crypto.KeyObject)
    expect(key.type).toBe("private")
    expect(key.asymmetricKeyType).toBe("ec")
  })

  it("rejects malformed DPoP JWK JSON and shape", () => {
    // Arrange + Act
    const invalidJson = () => importDpopPrivateKey("{")
    const invalidShape = () =>
      importDpopPrivateKey(JSON.stringify({ kty: "RSA" }))

    // Assert
    expect(invalidJson).toThrow(/Invalid DPoP private key JSON/)
    expect(invalidShape).toThrow(/Invalid DPoP private key shape/)
  })
})

describe("pushFapiAuthorizationRequest", () => {
  it("pushes the authorization parameters and redirects with only client_id and request_uri", async () => {
    // Arrange
    const { privateKey } = await createEphemeralDpopKey()
    const pushedAuthorizationRequest = vi.fn().mockResolvedValue({
      request_uri: REQUEST_URI,
      expires_in: 60,
    })

    // Act
    const redirectUrl = await pushFapiAuthorizationRequest({
      client: clientWith(pushedAuthorizationRequest),
      clientId: env.SINGPASS_CLIENT_ID,
      privateKey,
      parameters,
    })

    // Assert
    expect(pushedAuthorizationRequest).toHaveBeenCalledWith(parameters)
    const url = new URL(redirectUrl)
    expect(url.origin + url.pathname).toBe(`${FAPI_ISSUER}/auth`)
    expect(url.searchParams.get("client_id")).toBe(env.SINGPASS_CLIENT_ID)
    expect(url.searchParams.get("request_uri")).toBe(REQUEST_URI)
    expect([...url.searchParams.keys()].sort()).toEqual([
      "client_id",
      "request_uri",
    ])
  })

  it("retries a PAR that asks for a DPoP nonce", async () => {
    // Arrange
    const { privateKey } = await createEphemeralDpopKey()
    const pushedAuthorizationRequest = vi
      .fn()
      .mockRejectedValueOnce(
        new errors.OPError(
          { error: "use_dpop_nonce", error_description: "nonce required" },
          { headers: { "dpop-nonce": "server-nonce" } } as never,
        ),
      )
      .mockResolvedValueOnce({
        request_uri: REQUEST_URI,
        expires_in: 60,
      })

    // Act
    const redirectUrl = await pushFapiAuthorizationRequest({
      client: clientWith(pushedAuthorizationRequest),
      clientId: env.SINGPASS_CLIENT_ID,
      privateKey,
      parameters,
    })

    // Assert
    expect(pushedAuthorizationRequest).toHaveBeenCalledTimes(2)
    expect(redirectUrl).toContain("request_uri=")
  })

  it("does not retry an invalid authorization request", async () => {
    // Arrange
    const { privateKey } = await createEphemeralDpopKey()
    const pushedAuthorizationRequest = vi.fn().mockRejectedValue(
      new errors.OPError({
        error: "invalid_request",
        error_description: "missing parameter",
      }),
    )

    // Act
    const result = pushFapiAuthorizationRequest({
      client: clientWith(pushedAuthorizationRequest),
      clientId: env.SINGPASS_CLIENT_ID,
      privateKey,
      parameters: {},
    })

    // Assert
    await expect(result).rejects.toThrow(/invalid_request/)
    expect(pushedAuthorizationRequest).toHaveBeenCalledTimes(1)
  })

  it.each([
    "server_error",
    "upstream_dependency_error",
    "temporarily_unavailable",
  ])(
    "retries a transient %s and succeeds within four attempts",
    async (error) => {
      // Arrange
      const backoff = recordBackoffDelays()
      const { privateKey } = await createEphemeralDpopKey()
      const pushedAuthorizationRequest = vi
        .fn()
        .mockRejectedValueOnce(
          new errors.OPError({ error, error_description: "try again" }),
        )
        .mockRejectedValueOnce(
          new errors.OPError({ error, error_description: "try again" }),
        )
        .mockResolvedValueOnce({
          request_uri: REQUEST_URI,
          expires_in: 60,
        })

      // Act
      const redirectUrl = await pushFapiAuthorizationRequest({
        client: clientWith(pushedAuthorizationRequest),
        clientId: env.SINGPASS_CLIENT_ID,
        privateKey,
        parameters,
      })

      // Assert
      expect(pushedAuthorizationRequest).toHaveBeenCalledTimes(3)
      expect(redirectUrl).toContain("request_uri=")
      expect(backoff.delays).toEqual([1000, 2000])
      backoff.restore()
    },
  )

  it("stops after four transient PAR failures", async () => {
    // Arrange
    const backoff = recordBackoffDelays()
    const { privateKey } = await createEphemeralDpopKey()
    const pushedAuthorizationRequest = vi.fn().mockRejectedValue(
      new errors.OPError({
        error: "server_error",
        error_description: "try again",
      }),
    )

    // Act
    const result = pushFapiAuthorizationRequest({
      client: clientWith(pushedAuthorizationRequest),
      clientId: env.SINGPASS_CLIENT_ID,
      privateKey,
      parameters,
    })

    // Assert
    await expect(result).rejects.toThrow(/server_error/)
    expect(pushedAuthorizationRequest).toHaveBeenCalledTimes(4)
    expect(backoff.delays).toEqual([1000, 2000, 4000])
    backoff.restore()
  })

  it("sends a fresh signed DPoP proof, and includes the nonce on retry", async () => {
    // Arrange
    const { privateKey } = await createEphemeralDpopKey()
    const privateJwk = await exportJWK(privateKey)
    const publicJwk = { ...privateJwk }
    delete publicJwk.d
    const publicKey = await importJWK(publicJwk, "ES256")
    const proofs: string[] = []
    const client = {
      issuer: {
        metadata: {
          authorization_endpoint: `${FAPI_ISSUER}/auth?unused=1`,
          pushed_authorization_request_endpoint: `${FAPI_ISSUER}/par?unused=1`,
        },
      },
      pushedAuthorizationRequest: vi.fn(function (this: Client) {
        const options = this[custom.http_options](
          new URL(`${FAPI_ISSUER}/par`),
          {
            method: "POST",
            headers: {},
          },
        )
        const headers = options.headers as { DPoP?: string } | undefined
        if (headers?.DPoP) proofs.push(headers.DPoP)
        if (proofs.length === 1) {
          throw new errors.OPError(
            { error: "use_dpop_nonce", error_description: "nonce required" },
            { headers: { "dpop-nonce": "server-nonce" } } as never,
          )
        }
        return { request_uri: REQUEST_URI, expires_in: 60 }
      }),
    }
    installDpopHeader(client as unknown as Client)

    // Act
    await pushFapiAuthorizationRequest({
      client: client as unknown as Client,
      clientId: env.SINGPASS_CLIENT_ID,
      privateKey,
      parameters,
    })

    // Assert
    expect(proofs).toHaveLength(2)
    expect(proofs[0]).not.toBe(proofs[1])
    const first = decodeJwt(proofs[0]!)
    const second = decodeJwt(proofs[1]!)
    expect(first.htm).toBe("POST")
    expect(second.htm).toBe("POST")
    expect(first.htu).toBe(`${FAPI_ISSUER}/par`)
    expect(second.htu).toBe(`${FAPI_ISSUER}/par`)
    expect(first.nonce).toBeUndefined()
    expect(second.nonce).toBe("server-nonce")
    expect(first.jti).not.toBe(second.jti)
    await jwtVerify(proofs[0]!, publicKey)
    await jwtVerify(proofs[1]!, publicKey)
  })
})
