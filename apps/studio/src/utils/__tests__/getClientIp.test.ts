import { type NextApiRequest } from "next"
import { describe, expect, it } from "vitest"

import getIP from "../getClientIp"

const makeNextApiRequest = (
  headers: NextApiRequest["headers"],
  remoteAddress?: string,
) =>
  ({
    headers,
    socket: {
      remoteAddress,
    },
  }) as NextApiRequest

describe("getIP", () => {
  it("prefers cf-connecting-ip over spoofable headers and socket addresses", () => {
    const req = makeNextApiRequest(
      {
        "cf-connecting-ip": "203.0.113.10",
        "x-forwarded-for": "1.2.3.4, 198.51.100.20",
      },
      "10.0.0.1",
    )

    expect(getIP(req)).toBe("203.0.113.10")
  })

  it("uses the socket remote address before x-forwarded-for", () => {
    const req = makeNextApiRequest(
      {
        "x-forwarded-for": "1.2.3.4, 198.51.100.20",
      },
      "10.0.0.1",
    )

    expect(getIP(req)).toBe("10.0.0.1")
  })

  it("uses the rightmost x-forwarded-for value for web requests by default", () => {
    const req = new Request("https://example.com", {
      headers: {
        "x-forwarded-for": "1.2.3.4, 198.51.100.20",
      },
    })

    expect(getIP(req)).toBe("198.51.100.20")
  })

  it("uses the configured trusted proxy hop count for x-forwarded-for", () => {
    const req = new Request("https://example.com", {
      headers: {
        "x-forwarded-for": "1.2.3.4, 198.51.100.20, 10.0.0.1",
      },
    })

    expect(getIP(req, { trustedProxyHops: 2 })).toBe("198.51.100.20")
  })

  it("normalizes repeated x-forwarded-for headers before selecting an IP", () => {
    const req = makeNextApiRequest({
      "x-forwarded-for": ["1.2.3.4, 198.51.100.20", "10.0.0.1"],
    })

    expect(getIP(req)).toBe("10.0.0.1")
  })

  it("falls back to localhost when no IP source is available", () => {
    expect(getIP(makeNextApiRequest({}))).toBe("127.0.0.1")
  })
})
