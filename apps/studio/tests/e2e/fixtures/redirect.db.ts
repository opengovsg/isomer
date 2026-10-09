import { normalizeRedirectSource } from "~/schemas/redirect/utils"
import { db } from "~/server/modules/database"

export const getRedirectDestination = async (opts: {
  siteId: number
  source: string
}) => {
  const row = await db
    .selectFrom("Redirect")
    .where("siteId", "=", opts.siteId)
    .where("source", "=", normalizeRedirectSource(opts.source))
    .where("deletedAt", "is", null)
    .select("destination")
    .executeTakeFirst()
  return row?.destination ?? null
}
