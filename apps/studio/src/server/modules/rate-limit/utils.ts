import { type NextApiRequest } from "next"
import getIP from "~/utils/getClientIp"

export const getRateLimitFingerprint = (req: NextApiRequest) => {
  const requestedPath =
    req.url && req.headers.host
      ? new URL(req.url, `http://${req.headers.host}`).pathname
      : ""

  const ip = getIP(req)

  return `${ip}|${requestedPath}`
}
