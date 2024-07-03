import { env } from "@isomer/env";
import { type SessionOptions } from "iron-session";

export const sessionOptions: SessionOptions = {
  password: {
    "1": env.SESSION_SECRET,
  },
  cookieName: "auth.session-token",
  ttl: 60 * 60 * 24 * 7, // 7 days
  cookieOptions: {
    secure: env.NODE_ENV === "production",
  },
};
