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

  // Login upserts VerificationToken as `${email}|${ip}`. Match with LIKE because
  // `next dev` reports ::1 and the prod test server reports 127.0.0.1.
  const result = await db
    .updateTable("VerificationToken")
    .set({ token: hash, expires, attempts: 0 })
    .where("identifier", "like", `${identifier}|%`)
    .executeTakeFirst()

  if (Number(result.numUpdatedRows) === 0) {
    throw new Error(
      `overwriteToken: no VerificationToken row matched "${identifier}|%". ` +
        `Did the login mutation run and upsert a token before this call?`,
    )
  }

  return token
}
