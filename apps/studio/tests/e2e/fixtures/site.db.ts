import { db } from "~/server/modules/database"

export const getSiteNotification = async (siteId: number) => {
  const row = await db
    .selectFrom("Site")
    .where("id", "=", siteId)
    .select("config")
    .executeTakeFirst()

  const config = row?.config as {
    notification?: { type?: string; title?: string }
  } | null

  return config?.notification ?? null
}
