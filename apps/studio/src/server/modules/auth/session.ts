import { type SessionOptions } from "iron-session"

import { env } from "~/env.mjs"

export const AUTH_SESSION_COOKIE_NAME = "auth.session-token"

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
    cookieName: AUTH_SESSION_COOKIE_NAME,
    ttl: ONE_HOUR * ttlInHours,
    cookieOptions: {
      secure: env.NODE_ENV === "production",
    },
  }
}
