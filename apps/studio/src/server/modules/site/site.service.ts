import {
  type IsomerGeneratedSiteProps,
  type IsomerSiteConfigProps,
} from "@opengovsg/isomer-components"

import { db, sql } from "../database"

export const getSiteConfig = async (siteId: number) => {
  const { config, name } = await db
    .selectFrom("Site")
    .where("id", "=", siteId)
    .selectAll()
    .executeTakeFirstOrThrow()

  // TODO: add JSON parsing + validation
  // at present, this is stored at JSONB inside our db.
  // TODO: remove siteMap as it is a generated field
  const { theme, isGovernment, sitemap } = config as IsomerSiteConfigProps & {
    sitemap: IsomerGeneratedSiteProps["siteMap"]
  }

  return {
    theme,
    isGovernment,
    sitemap,
    name,
  }
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
    .select((eb) =>
      eb.ref("Site.config", "->").key("notification").as("notification"),
    )
    .where("id", "=", siteId)
    .executeTakeFirstOrThrow()

  return result.notification
}

// TODO: Should triger immediate re-publish of site
// NOTE: Empty string removes a notification
export const setSiteNotification = async (
  siteId: number,
  notification: string,
) => {
  if (notification) {
    return db
      .updateTable("Site")
      .set({
        config: sql`jsonb_set(config, '{"notification"}', to_jsonb(${notification}::text))`,
      })
      .where("id", "=", siteId)
      .executeTakeFirstOrThrow()
  } else {
    return db
      .updateTable("Site")
      .set({ config: sql`config - 'notification'` })
      .where("id", "=", siteId)
      .executeTakeFirstOrThrow()
  }
}
