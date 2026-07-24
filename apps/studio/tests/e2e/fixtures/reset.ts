import { sql } from "kysely"
import { db, jsonb } from "~/server/modules/database"

export { ensureUserOnboarded } from "./user"

const DEFAULT_AGENCY_SITE_NAME = "Isomer"

/** Reset site name and config.siteName for agency settings tests. */
export const resetSiteAgencySettings = async (
  siteId: number,
  siteName: string = DEFAULT_AGENCY_SITE_NAME,
) => {
  const site = await db
    .selectFrom("Site")
    .where("id", "=", siteId)
    .select("config")
    .executeTakeFirstOrThrow()

  const config = site.config as Record<string, unknown>

  await db
    .updateTable("Site")
    .set({
      name: siteName,
      config: jsonb({ ...config, siteName }),
    })
    .where("id", "=", siteId)
    .execute()
}

/** Remove notification config so the banner toggle starts off. */
export const resetSiteNotification = (siteId: number) =>
  db
    .updateTable("Site")
    .set({ config: sql`config - 'notification'` })
    .where("id", "=", siteId)
    .execute()

/** Reset theme column to seed default (null) for colours settings tests. */
export const resetSiteTheme = (siteId: number) =>
  db.updateTable("Site").set({ theme: null }).where("id", "=", siteId).execute()
