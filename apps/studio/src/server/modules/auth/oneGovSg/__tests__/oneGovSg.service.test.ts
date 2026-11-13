import { errors, generators, Issuer, TokenSet } from "openid-client"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

const { TEST_CLIENT_ID, TEST_ISSUER } = vi.hoisted(() => ({
  TEST_CLIENT_ID: "test-client-id",
  TEST_ISSUER: "https://one.gov.sg/api/auth",
}))

vi.mock(import("~/env.mjs"), async (importOriginal) => {
  const { env } = await importOriginal()
  const { generateKeyPairSync } = await import("node:crypto")
  const { privateKey } = generateKeyPairSync("rsa", { modulusLength: 2048 })

  return {
    env: {
      ...env,
      ONE_GOV_SG_CLIENT_ID: TEST_CLIENT_ID,
      ONE_GOV_SG_ISSUER: TEST_ISSUER,
      // Stored the way secret managers flatten it: literal `\n`.
      ONE_GOV_SG_PRIVATE_KEY: privateKey
        .export({ type: "pkcs8", format: "pem" })
        .toString()
        .replaceAll("\n", "\\n"),
    },
  }
})

const createIssuer = (issuer = TEST_ISSUER) =>
  new Issuer({
    issuer,
    authorization_endpoint: `${issuer}/oauth2/authorize`,
    token_endpoint: `${issuer}/oauth2/token`,
    jwks_uri: `${issuer}/.well-known/jwks.json`,
  })

const createIdTokenSet = (claims: Record<string, unknown>) => {
  const encode = (value: object) =>
    Buffer.from(JSON.stringify(value)).toString("base64url")
  return new TokenSet({
    id_token: `${encode({ alg: "RS256" })}.${encode(claims)}.signature`,
  })
}

// The client is cached at module level, so each test loads a fresh copy.
const loadService = async () => {
  vi.resetModules()
  return import("../oneGovSg.service")
}

const SESSION = {
  codeVerifier: "code-verifier",
  nonce: "nonce",
  state: "state",
  expiresAt: Date.now() + 60 * 1000,
}

describe("oneGovSg.service", () => {
  let issuer: Issuer

  beforeEach(() => {
    issuer = createIssuer()
    vi.spyOn(Issuer, "discover").mockResolvedValue(issuer)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it("is enabled when both the client ID and private key are set", async () => {
    // Arrange
    const { isOneGovSgEnabled } = await loadService()

    // Act
    const result = isOneGovSgEnabled()

    // Assert
    expect(result).toBe(true)
  })

  describe("getAuthorizationUrl", () => {
    it("builds a PKCE authorization request bound to the stored transaction", async () => {
      // Arrange
      const { getAuthorizationUrl } = await loadService()

      // Act
      const { authorizationUrl, session } = await getAuthorizationUrl()

      // Assert
      const url = new URL(authorizationUrl)
      expect(`${url.origin}${url.pathname}`).toBe(
        `${TEST_ISSUER}/oauth2/authorize`,
      )
      expect(url.searchParams.get("client_id")).toBe(TEST_CLIENT_ID)
      expect(url.searchParams.get("response_type")).toBe("code")
      expect(url.searchParams.get("scope")).toBe("openid email")
      expect(url.searchParams.get("redirect_uri")).toMatch(
        /\/sign-in\/onegov\/callback$/,
      )
      expect(url.searchParams.get("state")).toBe(session.state)
      expect(url.searchParams.get("nonce")).toBe(session.nonce)
      expect(url.searchParams.get("code_challenge_method")).toBe("S256")
      expect(url.searchParams.get("code_challenge")).toBe(
        generators.codeChallenge(session.codeVerifier),
      )
      expect(session.expiresAt).toBeGreaterThan(Date.now())
    })

    it("rejects a discovery document for a different issuer", async () => {
      // Arrange
      vi.spyOn(Issuer, "discover").mockResolvedValue(
        createIssuer("https://one.gov.sg"),
      )
      const { getAuthorizationUrl } = await loadService()

      // Act
      const result = getAuthorizationUrl()

      // Assert
      await expect(result).rejects.toThrow(
        "one.gov.sg discovery issuer mismatch",
      )
    })
  })

  describe("exchangeCode", () => {
    it("passes state, nonce and PKCE checks and returns the normalised email", async () => {
      // Arrange
      const callback = vi
        .spyOn(issuer.Client.prototype, "callback")
        .mockResolvedValue(
          createIdTokenSet({
            sub: " Officer@Agency.gov.sg ",
            aud: TEST_CLIENT_ID,
          }),
        )
      const { exchangeCode } = await loadService()

      // Act
      const result = await exchangeCode({
        code: "code",
        iss: TEST_ISSUER,
        session: SESSION,
      })

      // Assert
      expect(result).toBe("officer@agency.gov.sg")
      expect(callback).toHaveBeenCalledWith(
        expect.stringMatching(/\/sign-in\/onegov\/callback$/),
        { code: "code", state: SESSION.state, iss: TEST_ISSUER },
        {
          state: SESSION.state,
          nonce: SESSION.nonce,
          code_verifier: SESSION.codeVerifier,
        },
      )
    })

    it.each([
      ["an extra audience", [TEST_CLIENT_ID, "other-client"]],
      ["another client's audience", "other-client"],
    ])("rejects an id_token with %s", async (_, aud) => {
      // Arrange
      vi.spyOn(issuer.Client.prototype, "callback").mockResolvedValue(
        createIdTokenSet({ sub: "officer@agency.gov.sg", aud }),
      )
      const { exchangeCode } = await loadService()

      // Act
      const result = exchangeCode({
        code: "code",
        iss: TEST_ISSUER,
        session: SESSION,
      })

      // Assert
      await expect(result).rejects.toThrow(
        "one.gov.sg id_token has an unexpected audience",
      )
    })
  })
})

describe("describeOneGovSgError", () => {
  it("reduces id_token validation errors to a category without the token", async () => {
    // Arrange
    const { describeOneGovSgError } = await import("../oneGovSg.service")
    const error = new errors.RPError({
      message: "nonce mismatch, expected abc, got: xyz",
      jwt: "eyJhbGciOiJSUzI1NiJ9.officer.signature",
    })

    // Act
    const result = describeOneGovSgError(error)

    // Assert
    expect(result).toBe("id_token_validation")
  })

  it("keeps only the OAuth error code from one.gov.sg errors", async () => {
    // Arrange
    const { describeOneGovSgError } = await import("../oneGovSg.service")
    const error = new errors.OPError({
      error: "invalid_grant",
      error_description: "IdP-controlled text",
    })

    // Act
    const result = describeOneGovSgError(error)

    // Assert
    expect(result).toBe("op_error:invalid_grant")
  })

  it("keeps the message of our own errors", async () => {
    // Arrange
    const { describeOneGovSgError } = await import("../oneGovSg.service")

    // Act
    const result = describeOneGovSgError(
      new Error("one.gov.sg discovery issuer mismatch"),
    )

    // Assert
    expect(result).toBe("one.gov.sg discovery issuer mismatch")
  })
})
