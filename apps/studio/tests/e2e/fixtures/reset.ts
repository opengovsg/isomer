import type { IsomerSiteConfigProps } from "@opengovsg/isomer-components"
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

  const config = site.config as IsomerSiteConfigProps

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

// Mirrors createSite() defaults in server/modules/site/site.service.ts so the
// colours form validates and setTheme can update an existing theme row.
const DEFAULT_SITE_THEME = {
  colors: {
    brand: {
      canvas: {
        alt: "#bfcfd7",
        default: "#e6ecef",
        inverse: "#00405f",
        backdrop: "#80a0af",
      },
      interaction: {
        hover: "#002e44",
        default: "#00405f",
        pressed: "#00283b",
      },
    },
  },
}

/** Reset theme column to the provisioned-site default for colours settings tests. */
export const resetSiteTheme = (siteId: number) =>
  db
    .updateTable("Site")
    .set({ theme: jsonb(DEFAULT_SITE_THEME) })
    .where("id", "=", siteId)
    .execute()
