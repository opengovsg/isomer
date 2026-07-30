import { confirm } from "@inquirer/prompts"
import {
  isSiteNotificationActive,
  type SiteNotificationConfig,
} from "@opengovsg/isomer-components"
import { AuditLogEvent, db, jsonb, sql } from "~/server/modules/database"

export const ANTISCAM_NOTIFICATION = {
  type: "antiscam",
} satisfies SiteNotificationConfig

export const isAlreadyAntiscam = (notification: SiteNotificationConfig) =>
  notification.type === "antiscam"

export const parseArgs = (args = process.argv.slice(2)) => {
  const dryRun = args.includes("--dry-run")
  const siteIdIndex = args.indexOf("--site-id")
  const siteId = siteIdIndex === -1 ? undefined : Number(args[siteIdIndex + 1])

  if (siteIdIndex !== -1 && (!siteId || Number.isNaN(siteId))) {
    throw new Error("Pass a numeric site id after --site-id")
  }

  return { dryRun, siteId }
}

export const resolveScriptUserIdByEmail = async (email: string) => {
  const normalizedEmail = email.trim().toLowerCase()
  const user = await db
    .selectFrom("User")
    .where("email", "=", normalizedEmail)
    .where("deletedAt", "is", null)
    .select("id")
    .executeTakeFirst()

  if (!user) {
    throw new Error(`User with email ${email} not found`)
  }

  return user.id
}

export const getSitesWithNotifications = async (siteId?: number) => {
  let query = db
    .selectFrom("Site")
    .select([
      "id",
      "name",
      sql<SiteNotificationConfig | null>`config->'notification'`.as(
        "notification",
      ),
    ])

  if (siteId !== undefined) {
    query = query.where("id", "=", siteId)
  }

  return query.execute()
}

export const replaceNotificationWithAntiscam = async ({
  dryRun,
  siteId,
  scriptUserId,
}: {
  dryRun: boolean
  siteId?: number
  scriptUserId: string
}) => {
  const sites = await getSitesWithNotifications(siteId)

  const toUpdate = sites.filter((site) => {
    const notification = site.notification ?? undefined
    return (
      isSiteNotificationActive(notification) && !isAlreadyAntiscam(notification)
    )
  })
  const alreadyAntiscam = sites.filter((site) => {
    const notification = site.notification ?? undefined
    return (
      isSiteNotificationActive(notification) && isAlreadyAntiscam(notification)
    )
  })
  const inactive = sites.filter(
    (site) => !isSiteNotificationActive(site.notification ?? undefined),
  )

  console.log(`Found ${sites.length} site(s) matching filter`)
  console.log(`  ${toUpdate.length} to update`)
  console.log(`  ${alreadyAntiscam.length} already on anti-scam`)
  console.log(`  ${inactive.length} without an active notification`)

  if (toUpdate.length === 0) {
    console.log("\nNothing to update.")
    return { updatedSiteIds: [] as number[] }
  }

  console.log("\nSites to update:")
  for (const site of toUpdate) {
    console.log(
      `  - [${site.id}] ${site.name}: ${JSON.stringify(site.notification)} -> ${JSON.stringify(ANTISCAM_NOTIFICATION)}`,
    )
  }

  if (dryRun) {
    console.log("\nDry run only — no changes written.")
    return { updatedSiteIds: [] as number[] }
  }

  const shouldProceed = await confirm({
    message: `Update ${toUpdate.length} site notification banner(s) to the anti-scam variant?`,
    default: false,
  })

  if (!shouldProceed) {
    console.log("Aborted.")
    return { updatedSiteIds: [] as number[] }
  }

  const updatedSiteIds: number[] = []

  for (const site of toUpdate) {
    await db.transaction().execute(async (tx) => {
      const oldSite = await tx
        .selectFrom("Site")
        .where("id", "=", site.id)
        .selectAll()
        .executeTakeFirstOrThrow()

      const newSite = await tx
        .updateTable("Site")
        .set({
          config: sql`config || ${jsonb({ notification: ANTISCAM_NOTIFICATION })}`,
        })
        .where("id", "=", site.id)
        .returningAll()
        .executeTakeFirstOrThrow()

      await tx
        .insertInto("AuditLog")
        .values({
          siteId: site.id,
          eventType: AuditLogEvent.SiteConfigUpdate,
          delta: {
            before: oldSite,
            after: newSite,
          },
          userId: scriptUserId,
          metadata: {
            script: "replaceNotificationWithAntiscam",
          },
        })
        .execute()
    })

    updatedSiteIds.push(site.id)
    console.log(`✓ Updated [${site.id}] ${site.name}`)
  }

  console.log(`\nDone. Updated ${toUpdate.length} site(s).`)

  return { updatedSiteIds }
}
