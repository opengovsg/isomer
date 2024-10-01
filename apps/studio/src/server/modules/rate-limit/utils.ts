import { type NextApiRequest } from "next"

export const getRateLimitFingerprint = (req: NextApiRequest) => {
  const requestedPath =
    req.url && req.headers.host
      ? new URL(req.url, `http://${req.headers.host}`).pathname
      : ""

  const forwarded =
    req.headers["cf-connecting-ip"] ??
    req.socket.remoteAddress ??
    req.headers["x-forwarded-for"]

  if (!forwarded) {
    return "127.0.0.1"
  }

  const ip =
    (typeof forwarded === "string" ? forwarded : forwarded[0])?.split(
      /, /,
    )[0] ?? "127.0.0.1"

  return `${ip}|${requestedPath}`
}
