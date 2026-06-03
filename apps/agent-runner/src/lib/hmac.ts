const encoder = new TextEncoder()

const importKey = (secret: string): Promise<CryptoKey> =>
  crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"],
  )

const hexToBytes = (hex: string): Uint8Array | null => {
  if (hex.length === 0 || hex.length % 2 !== 0) return null
  const bytes = new Uint8Array(hex.length / 2)
  for (let i = 0; i < bytes.length; i++) {
    const byte = Number.parseInt(hex.slice(i * 2, i * 2 + 2), 16)
    if (Number.isNaN(byte)) return null
    bytes[i] = byte
  }
  return bytes
}

const timingSafeEqual = (a: Uint8Array, b: Uint8Array): boolean => {
  if (a.byteLength !== b.byteLength) return false
  let diff = 0
  for (let i = 0; i < a.byteLength; i++) {
    diff |= (a[i] ?? 0) ^ (b[i] ?? 0)
  }
  return diff === 0
}

export interface HmacVerifyInput {
  rawBody: string
  signatureHex: string
  secret: string
}

export const verifyHmacSha256 = async ({
  rawBody,
  signatureHex,
  secret,
}: HmacVerifyInput): Promise<boolean> => {
  const given = hexToBytes(signatureHex)
  if (!given) return false

  const key = await importKey(secret)
  const expected = new Uint8Array(
    await crypto.subtle.sign("HMAC", key, encoder.encode(rawBody)),
  )
  return timingSafeEqual(expected, given)
}

export interface TimestampWindowInput {
  timestampMs: number
  nowMs: number
  maxAgeSeconds: number
}

export const isWithinTimestampWindow = ({
  timestampMs,
  nowMs,
  maxAgeSeconds,
}: TimestampWindowInput): boolean => {
  const ageMs = Math.abs(nowMs - timestampMs)
  return ageMs <= maxAgeSeconds * 1000
}
