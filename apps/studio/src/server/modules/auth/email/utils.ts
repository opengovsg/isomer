import type { NextApiRequest } from "next"

const LOCALHOST = "127.0.0.1"

export const getOtpFingerPrint = (
  email: string,
  req: NextApiRequest,
): `${string}|${string}` => {
  const originIp =
    req.headers["cf-connecting-ip"] ??
    req.socket.remoteAddress ??
    req.headers["x-forwarded-for"] ??
    LOCALHOST

  const flattenedIp =
    // NOTE: Headers are typed as string | string[]
    // but the cloudflare connecting ip (our primary source) is explicitly typed as string.
    // This case occurs when potentially using x-forwarded-for,
    // and there is already an existing proxy.
    // for more details: https://developers.cloudflare.com/fundamentals/reference/http-request-headers/#x-forwarded-for
    typeof originIp === "string" ? originIp : originIp.join(", ")

  return `${email}|${flattenedIp}`
}
