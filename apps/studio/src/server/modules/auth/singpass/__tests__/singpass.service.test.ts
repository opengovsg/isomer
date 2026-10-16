import type { AddressInfo } from "node:net"
import { decodeJwt } from "jose"
import http from "node:http"
import { Issuer } from "openid-client"
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest"

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
        res.writeHead(200, { "content-type": "application/json" })
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

  it("sends DPoP on PAR through the production FAPI2Client setup", async () => {
    // Arrange
    vi.resetModules()
    parProofs.length = 0
    const discoverSpy = vi.spyOn(Issuer, "discover").mockResolvedValue(
      new Issuer({
        issuer: baseUrl,
        authorization_endpoint: `${baseUrl}/auth`,
        pushed_authorization_request_endpoint: `${baseUrl}/par`,
      }),
    )

    const { getAuthorizationUrl } = await import("../singpass.service")

    // Act
    const { authorizationUrl } = await getAuthorizationUrl({ useFapi: true })

    // Assert
    expect(parProofs).toHaveLength(1)
    const proof = decodeJwt(parProofs[0]!)
    expect(proof.htm).toBe("POST")
    expect(proof.htu).toBe(`${baseUrl}/par`)
    expect(authorizationUrl).toContain(REQUEST_URI)

    discoverSpy.mockRestore()
    vi.resetModules()
  })
})
