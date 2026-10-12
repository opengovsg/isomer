import { normalizeRedirectSource } from "~/schemas/redirect/utils"
import { db } from "~/server/modules/database"

export const seedRedirect = (opts: {
  siteId: number
  source: string
  destination: string
}) =>
  db
    .insertInto("Redirect")
    .values({
      siteId: opts.siteId,
      source: normalizeRedirectSource(opts.source),
      destination: opts.destination,
    })
    .execute()

export const deleteRedirectBySource = (opts: {
  siteId: number
  source: string
}) =>
  db
    .deleteFrom("Redirect")
    .where("siteId", "=", opts.siteId)
    .where("source", "=", normalizeRedirectSource(opts.source))
    .execute()
