import { RoleType } from "~prisma/generated/generatedEnums"

// Site roles that get the Polyglot icon and SSO into Polyglot Studio. Isomer
// admins are included via the implicit Admin role from getResourcePermission.
export const POLYGLOT_SSO_ROLES: readonly RoleType[] = [
  RoleType.Admin,
  RoleType.Publisher,
]

// Fallback whenever SSO can't happen; users can still sign in there with OTP
export const DEFAULT_POLYGLOT_STUDIO_URL = "https://studio.polyglot.gov.sg"
