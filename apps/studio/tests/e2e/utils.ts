import { scryptSync } from "crypto"

import { getIpFingerprint } from "~/server/modules/auth/email/utils"
import { db } from "~/server/modules/database"

export async function overwriteToken({
  factory,
  identifier,
}: {
  factory: () => string
  identifier: string
}) {
  const token = factory()
  const fingerprint = getIpFingerprint(identifier, "::1")

  const hash = scryptSync(token, identifier, 64).toString("base64")
  await db
    .deleteFrom("VerificationToken")
    .where("VerificationToken.identifier", "=", fingerprint)
    .execute()

  const expires = new Date(Date.now() + 1e9)

  await db
    .insertInto("VerificationToken")
    .values({
      identifier: fingerprint,
      token: hash,
      expires,
    })
    .execute()

  return token
}
