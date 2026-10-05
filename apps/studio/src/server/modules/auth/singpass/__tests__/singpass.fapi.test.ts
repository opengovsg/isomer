import { decodeJwt, decodeProtectedHeader } from "jose"
import { errors, custom, type Client } from "openid-client"
import { env } from "~/env.mjs"

import {
  buildFapiRedirectUrl,
  createDpopProof,
  createEphemeralDpopKey,
  dpopHtu,
  dpopProofHeaderForTests,
  fapiAuthorizationParameters,
  installDpopHeader,
  pushFapiAuthorizationRequest,
} from "../singpass.fapi"

const FAPI_ISSUER = "https://stg-id.singpass.gov.sg/fapi"

describe("Singpass FAPI helpers", () => {
  it("builds a redirect URL with only client_id and request_uri", () => {
    // Arrange
    const requestUri = "urn:ietf:params:oauth:request_uri:abc"

    // Act
    const redirectUrl = buildFapiRedirectUrl(
      `${FAPI_ISSUER}/auth?unused=1`,
      env.SINGPASS_CLIENT_ID,
      requestUri,
    )

    // Assert
    const url = new URL(redirectUrl)
    expect(url.origin + url.pathname).toBe(`${FAPI_ISSUER}/auth`)
    expect(url.searchParams.get("client_id")).toBe(env.SINGPASS_CLIENT_ID)
    expect(url.searchParams.get("request_uri")).toBe(requestUri)
    expect([...url.searchParams.keys()].sort()).toEqual([
      "client_id",
      "request_uri",
    ])
  })

  it("strips the query string from the DPoP htu", () => {
    // Act
    const htu = dpopHtu(`${FAPI_ISSUER}/par?x=1#fragment`)

    // Assert
    expect(htu).toBe(`${FAPI_ISSUER}/par`)
  })

  it("signs a DPoP proof with the public key only", async () => {
    // Arrange
    const { privateKey } = await createEphemeralDpopKey()

    // Act
    const proof = await createDpopProof({
      privateKey,
      htm: "POST",
      htu: `${FAPI_ISSUER}/par`,
      nonce: "server-nonce",
    })

    // Assert
    const header = decodeProtectedHeader(proof)
    const payload = decodeJwt(proof)
    expect(header.alg).toBe("ES256")
    expect(header.typ).toBe("dpop+jwt")
    expect(header.jwk).not.toHaveProperty("d")
    expect(payload.htm).toBe("POST")
    expect(payload.htu).toBe(`${FAPI_ISSUER}/par`)
    expect(payload.nonce).toBe("server-nonce")
    expect(Number(payload.exp) - Number(payload.iat)).toBeLessThanOrEqual(120)
  })

  it("copies the in-flight DPoP proof onto the client request", () => {
    // Arrange
    const client = {} as Client
    installDpopHeader(client)

    // Act
    const headers = dpopProofHeaderForTests("proof-jwt", () => {
      return client[custom.http_options](new URL(`${FAPI_ISSUER}/par`), {
        headers: { Accept: "application/json" },
      }).headers
    })

    // Assert
    expect(headers).toMatchObject({
      Accept: "application/json",
      DPoP: "proof-jwt",
    })
  })

  it("pushes authorization parameters and returns the FAPI redirect", async () => {
    // Arrange
    const { privateKey } = await createEphemeralDpopKey()
    const pushedAuthorizationRequest = vi.fn().mockResolvedValue({
      request_uri: "urn:ietf:params:oauth:request_uri:abc",
      expires_in: 60,
    })
    const client = {
      issuer: {
        metadata: {
          authorization_endpoint: `${FAPI_ISSUER}/auth`,
          pushed_authorization_request_endpoint: `${FAPI_ISSUER}/par`,
        },
      },
      pushedAuthorizationRequest,
    } as unknown as Client
    const parameters = fapiAuthorizationParameters({
      redirectUri: "http://localhost:3000/sign-in/singpass/callback",
      codeChallenge: "challenge",
      nonce: "nonce",
      state: "state",
    })

    // Act
    const redirectUrl = await pushFapiAuthorizationRequest({
      client,
      clientId: env.SINGPASS_CLIENT_ID,
      privateKey,
      parameters,
    })

    // Assert
    expect(pushedAuthorizationRequest).toHaveBeenCalledWith(parameters)
    expect(parameters).toMatchObject({
      response_type: "code",
      scope: "openid",
      code_challenge_method: "S256",
      authentication_context_type: "APP_AUTHENTICATION_DEFAULT",
      authentication_context_message: "Sign in to Isomer Studio",
    })
    expect(new URL(redirectUrl).searchParams.get("request_uri")).toBe(
      "urn:ietf:params:oauth:request_uri:abc",
    )
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
        request_uri: "urn:ietf:params:oauth:request_uri:abc",
        expires_in: 60,
      })
    const client = {
      issuer: {
        metadata: {
          authorization_endpoint: `${FAPI_ISSUER}/auth`,
          pushed_authorization_request_endpoint: `${FAPI_ISSUER}/par`,
        },
      },
      pushedAuthorizationRequest,
    } as unknown as Client

    // Act
    const redirectUrl = await pushFapiAuthorizationRequest({
      client,
      clientId: env.SINGPASS_CLIENT_ID,
      privateKey,
      parameters: fapiAuthorizationParameters({
        redirectUri: "http://localhost:3000/sign-in/singpass/callback",
        codeChallenge: "challenge",
        nonce: "nonce",
        state: "state",
      }),
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
    const client = {
      issuer: {
        metadata: {
          authorization_endpoint: `${FAPI_ISSUER}/auth`,
          pushed_authorization_request_endpoint: `${FAPI_ISSUER}/par`,
        },
      },
      pushedAuthorizationRequest,
    } as unknown as Client

    // Act
    const result = pushFapiAuthorizationRequest({
      client,
      clientId: env.SINGPASS_CLIENT_ID,
      privateKey,
      parameters: {},
    })

    // Assert
    await expect(result).rejects.toThrow(/invalid_request/)
    expect(pushedAuthorizationRequest).toHaveBeenCalledTimes(1)
  })
})
