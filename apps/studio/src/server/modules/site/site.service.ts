import { type IsomerSiteConfigProps } from "@opengovsg/isomer-components"

import { db, sql } from "../database"

export const getSiteConfig = async (siteId: number) => {
  const { config } = await db
    .selectFrom("Site")
    .where("id", "=", siteId)
    .select("Site.config")
    .executeTakeFirstOrThrow()

  return config
}

// Note: This overwrites the full site config
// TODO: Should triger immediate re-publish of site
export const setSiteConfig = async (
  siteId: number,
  config: IsomerSiteConfigProps,
) => {
  return db
    .updateTable("Site")
    .set({ config })
    .where("id", "=", siteId)
    .executeTakeFirstOrThrow()
}
export const getNotification = async (siteId: number) => {
  const result = await db
    .selectFrom("Site")
    .select(sql`config ->> 'notification'`.as("notification"))
    .where("id", "=", siteId)
    .executeTakeFirstOrThrow()

  return result.notification
}

// TODO: Should triger immediate re-publish of site
export const setSiteNotification = async (
  siteId: number,
  notification: string,
) => {
  return db
    .updateTable("Site")
    .set({
      config: sql`jsonb_set(config, '{"notification"}', to_jsonb(${notification}::text))`,
    })
    .where("id", "=", siteId)
    .executeTakeFirstOrThrow()
}
