import { type SessionOptions } from "iron-session"

import { env } from "~/env.mjs"

interface GenerateSessionOptionsProps {
  ttlInHours: number
}
export const generateSessionOptions = ({
  ttlInHours,
}: GenerateSessionOptionsProps): SessionOptions => {
  const ONE_HOUR = 60 * 60
  return {
    password: {
      "1": env.SESSION_SECRET,
    },
    cookieName: "auth.session-token",
    ttl: ONE_HOUR * ttlInHours,
    cookieOptions: {
      secure: env.NODE_ENV === "production",
    },
  }
}
