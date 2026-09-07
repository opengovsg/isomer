import type { SessionOptions } from "iron-session"
import { env } from "~/env.mjs"

// The versioned iron-session password map used to seal/unseal every iron
// blob Studio produces — session cookies AND audit-log-export Download
// Tokens (see modules/audit/auditLogExportToken.ts). Keyed by version so the
// active secret can be rotated without invalidating in-flight blobs sealed
// under the previous key: add the new secret under a higher key, and both
// remain valid for unseal until the old one is dropped. Exported (rather than
// duplicated) so there is a single source of truth for what key material
// Studio trusts.
export const getIronPassword = (): SessionOptions["password"] => ({
  // Read from process.env so production builds always use the runtime secret.
  // oxlint-disable-next-line node/no-process-env -- iron-session must use live runtime secret
  "1": process.env.SESSION_SECRET ?? env.SESSION_SECRET,
})

interface GenerateSessionOptionsProps {
  ttlInHours?: number
}
export const generateSessionOptions = ({
  ttlInHours = 1,
  // default to 1 hour if not using Singpass
}: GenerateSessionOptionsProps = {}): SessionOptions => {
  const ONE_HOUR = 60 * 60
  return {
    cookieName: "auth.session-token",
    cookieOptions: {
      // E2E runs `next start` over plain HTTP with CI=true in .env.test.
      secure:
        env.NODE_ENV === "production" &&
        env.NEXT_PUBLIC_APP_ENV !== "test" &&
        !env.CI,
    },
    password: getIronPassword(),
    ttl: ONE_HOUR * ttlInHours,
  }
}
