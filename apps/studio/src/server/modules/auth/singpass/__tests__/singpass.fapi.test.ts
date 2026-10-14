import crypto from "node:crypto"
import { errors, type Client } from "openid-client"
import { env } from "~/env.mjs"

import {
  createEphemeralDpopKey,
  importDpopPrivateKey,
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
})
