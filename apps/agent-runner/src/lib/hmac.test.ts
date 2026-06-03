import { createHmac } from "node:crypto"
import { describe, expect, it } from "vitest"

import { isWithinTimestampWindow, verifyHmacSha256 } from "./hmac"

const sign = (body: string, secret: string): string =>
  createHmac("sha256", secret).update(body).digest("hex")

describe("verifyHmacSha256", () => {
  const secret = "test-shared-secret"
  const body = '{"action":"update","data":{"id":"ENG-123"}}'

  it("returns true for a valid signature", async () => {
    const signatureHex = sign(body, secret)
    const result = await verifyHmacSha256({
      rawBody: body,
      signatureHex,
      secret,
    })
    expect(result).toBe(true)
  })

  it("returns false for a signature signed with a different secret", async () => {
    const signatureHex = sign(body, "wrong-secret")
    const result = await verifyHmacSha256({
      rawBody: body,
      signatureHex,
      secret,
    })
    expect(result).toBe(false)
  })

  it("returns false when the body has been tampered with", async () => {
    const signatureHex = sign(body, secret)
    const result = await verifyHmacSha256({
      rawBody: body + " ",
      signatureHex,
      secret,
    })
    expect(result).toBe(false)
  })

  it("returns false for malformed hex", async () => {
    const result = await verifyHmacSha256({
      rawBody: body,
      signatureHex: "not-hex",
      secret,
    })
    expect(result).toBe(false)
  })

  it("returns false for an empty signature", async () => {
    const result = await verifyHmacSha256({
      rawBody: body,
      signatureHex: "",
      secret,
    })
    expect(result).toBe(false)
  })

  it("returns false for an odd-length hex string", async () => {
    const result = await verifyHmacSha256({
      rawBody: body,
      signatureHex: "abc",
      secret,
    })
    expect(result).toBe(false)
  })

  it("returns false for a signature with the right length but wrong content", async () => {
    const validSig = sign(body, secret)
    // Flip the last char
    const last = validSig.slice(-1) === "0" ? "1" : "0"
    const tampered = validSig.slice(0, -1) + last
    const result = await verifyHmacSha256({
      rawBody: body,
      signatureHex: tampered,
      secret,
    })
    expect(result).toBe(false)
  })
})

describe("isWithinTimestampWindow", () => {
  const now = 1_700_000_000_000

  it("accepts a timestamp inside the window", () => {
    expect(
      isWithinTimestampWindow({
        timestampMs: now - 60_000,
        nowMs: now,
        maxAgeSeconds: 300,
      }),
    ).toBe(true)
  })

  it("rejects a timestamp older than the window", () => {
    expect(
      isWithinTimestampWindow({
        timestampMs: now - 301_000,
        nowMs: now,
        maxAgeSeconds: 300,
      }),
    ).toBe(false)
  })

  it("rejects a timestamp far in the future (skew protection)", () => {
    expect(
      isWithinTimestampWindow({
        timestampMs: now + 3_600_000,
        nowMs: now,
        maxAgeSeconds: 300,
      }),
    ).toBe(false)
  })

  it("accepts a timestamp exactly at the boundary", () => {
    expect(
      isWithinTimestampWindow({
        timestampMs: now - 300_000,
        nowMs: now,
        maxAgeSeconds: 300,
      }),
    ).toBe(true)
  })
})
