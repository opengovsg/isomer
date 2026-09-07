/* oxlint-disable typescript/strict-boolean-expressions -- server lint cleanup */
import type { NextApiRequest } from "next"
import getIP from "~/utils/getClientIp"
import { hasNonEmptyString } from "~/utils/truthiness"

export const getRateLimitFingerprint = (req: NextApiRequest) => {
  const requestedPath =
    req.url && hasNonEmptyString(req.headers.host)
      ? new URL(req.url, `http://${req.headers.host}`).pathname
      : ""

  const ip = getIP(req)

  return `${ip}|${requestedPath}`
}
