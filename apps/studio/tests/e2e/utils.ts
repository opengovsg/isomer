import { scryptSync } from "crypto"
import { db } from "~/server/modules/database"

export async function overwriteToken({
  factory,
  identifier,
}: {
  factory: () => string
  identifier: string
}) {
  const token = factory()
  const hash = scryptSync(token, identifier, 64).toString("base64")
  const expires = new Date(Date.now() + 1e9)

  // The login mutation has already upserted a VerificationToken keyed by
  // `${email}|${client-ip-as-seen-by-the-server}`. Overwrite that row instead
  // of inserting one under a guessed IP: the IP representation differs between
  // `next dev` (proxied, ::1) and the standalone production server (raw
  // socket, 127.0.0.1), so any hardcoded value breaks in one of the two.
  await db
    .updateTable("VerificationToken")
    .set({ token: hash, expires, attempts: 0 })
    .where("identifier", "like", `${identifier}|%`)
    .execute()

  return token
}
