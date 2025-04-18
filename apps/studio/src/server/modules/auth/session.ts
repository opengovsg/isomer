import { type SessionOptions } from "iron-session"

import { env } from "~/env.mjs"

export const sessionOptions: SessionOptions = {
  password: {
    "1": env.SESSION_SECRET,
  },
  cookieName: "auth.session-token",
  ttl: 60 * 60 * 12, // 12 hours
  cookieOptions: {
    secure: env.NODE_ENV === "production",
  },
}
