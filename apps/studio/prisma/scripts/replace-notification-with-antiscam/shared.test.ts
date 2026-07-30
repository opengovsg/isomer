import { confirm } from "@inquirer/prompts"
import {
  isSiteNotificationActive,
  type SiteNotificationConfig,
} from "@opengovsg/isomer-components"
import { resetTables } from "tests/integration/helpers/db"
import { setupSite, setupUser } from "tests/integration/helpers/seed"
import { afterEach, describe, expect, it, vi } from "vitest"
import { AuditLogEvent, db, jsonb, sql } from "~/server/modules/database"

import {
  ANTISCAM_NOTIFICATION,
  getSitesWithNotifications,
  isAlreadyAntiscam,
  parseArgs,
  replaceNotificationWithAntiscam,
  resolveScriptUserIdByEmail,
} from "./shared"

vi.mock("@inquirer/prompts", () => ({
  confirm: vi.fn(),
}))

const setSiteNotification = async (
  siteId: number,
  notification: SiteNotificationConfig | null,
) => {
  await db
    .updateTable("Site")
    .set({
      config:
        notification === null
          ? sql`config - 'notification'`
          : sql`config || ${jsonb({ notification })}`,
    })
    .where("id", "=", siteId)
    .execute()
}

describe("replace-notification-with-antiscam/shared", () => {
  describe("isSiteNotificationActive", () => {
    it("returns false for missing notifications", () => {
      expect(isSiteNotificationActive(undefined)).toBe(false)
    })

    it("treats legacy notifications with a title as active", () => {
      expect(isSiteNotificationActive({ title: "Legacy banner" })).toBe(true)
      expect(isSiteNotificationActive({ title: "" })).toBe(false)
    })

    it("treats custom notifications with a title as active", () => {
      expect(
        isSiteNotificationActive({ type: "custom", title: "Custom banner" }),
      ).toBe(true)
      expect(isSiteNotificationActive({ type: "custom", title: "" })).toBe(
        false,
      )
    })

    it("treats anti-scam notifications as active", () => {
      expect(isSiteNotificationActive({ type: "antiscam" })).toBe(true)
    })
  })

  describe("isAlreadyAntiscam", () => {
    it("returns true only for anti-scam notifications", () => {
      expect(isAlreadyAntiscam({ type: "antiscam" })).toBe(true)
      expect(isAlreadyAntiscam({ type: "custom", title: "x" })).toBe(false)
      expect(isAlreadyAntiscam({ title: "x" })).toBe(false)
    })
  })

  describe("resolveScriptUserIdByEmail", () => {
    afterEach(async () => {
      await resetTables("User")
    })

    it("resolves a Studio user id from their email", async () => {
      const user = await setupUser({ email: "engineer@open.gov.sg" })

      await expect(
        resolveScriptUserIdByEmail("  Engineer@open.gov.sg "),
      ).resolves.toBe(user.id)
    })

    it("throws when the email does not match a user", async () => {
      await expect(
        resolveScriptUserIdByEmail("missing@open.gov.sg"),
      ).rejects.toThrow("User with email missing@open.gov.sg not found")
    })
  })

  describe("parseArgs", () => {
    it("parses dry run and site id flags", () => {
      expect(parseArgs(["--dry-run", "--site-id", "42"])).toEqual({
        dryRun: true,
        siteId: 42,
      })
      expect(parseArgs([])).toEqual({
        dryRun: false,
        siteId: undefined,
      })
    })

    it("throws when site id is missing or invalid", () => {
      expect(() => parseArgs(["--site-id"])).toThrow(
        "Pass a numeric site id after --site-id",
      )
      expect(() => parseArgs(["--site-id", "abc"])).toThrow(
        "Pass a numeric site id after --site-id",
      )
    })
  })

  describe("replaceNotificationWithAntiscam", () => {
    afterEach(async () => {
      vi.mocked(confirm).mockReset()
      await resetTables(
        "AuditLog",
        "ResourcePermission",
        "Resource",
        "Navbar",
        "Footer",
        "Site",
        "User",
      )
    })

    it("updates active custom notifications and writes audit logs", async () => {
      const user = await setupUser({})
      const { site: customSite } = await setupSite()
      const { site: legacySite } = await setupSite()
      const { site: antiscamSite } = await setupSite()
      const { site: inactiveSite } = await setupSite()

      await setSiteNotification(customSite.id, {
        type: "custom",
        title: "Custom banner",
      })
      await setSiteNotification(legacySite.id, {
        title: "Legacy banner",
      })
      await setSiteNotification(antiscamSite.id, ANTISCAM_NOTIFICATION)
      await setSiteNotification(inactiveSite.id, { type: "custom", title: "" })

      vi.mocked(confirm).mockResolvedValue(true)

      const { updatedSiteIds } = await replaceNotificationWithAntiscam({
        dryRun: false,
        scriptUserId: user.id,
      })

      expect(updatedSiteIds).toEqual(
        expect.arrayContaining([customSite.id, legacySite.id]),
      )
      expect(updatedSiteIds).toHaveLength(2)

      const updatedCustomSite = await db
        .selectFrom("Site")
        .where("id", "=", customSite.id)
        .select(
          sql<SiteNotificationConfig | null>`config->'notification'`.as(
            "notification",
          ),
        )
        .executeTakeFirstOrThrow()
      const updatedLegacySite = await db
        .selectFrom("Site")
        .where("id", "=", legacySite.id)
        .select(
          sql<SiteNotificationConfig | null>`config->'notification'`.as(
            "notification",
          ),
        )
        .executeTakeFirstOrThrow()
      const unchangedAntiscamSite = await db
        .selectFrom("Site")
        .where("id", "=", antiscamSite.id)
        .select(
          sql<SiteNotificationConfig | null>`config->'notification'`.as(
            "notification",
          ),
        )
        .executeTakeFirstOrThrow()
      const unchangedInactiveSite = await db
        .selectFrom("Site")
        .where("id", "=", inactiveSite.id)
        .select(
          sql<SiteNotificationConfig | null>`config->'notification'`.as(
            "notification",
          ),
        )
        .executeTakeFirstOrThrow()

      expect(updatedCustomSite.notification).toEqual(ANTISCAM_NOTIFICATION)
      expect(updatedLegacySite.notification).toEqual(ANTISCAM_NOTIFICATION)
      expect(unchangedAntiscamSite.notification).toEqual(ANTISCAM_NOTIFICATION)
      expect(unchangedInactiveSite.notification).toEqual({
        type: "custom",
        title: "",
      })

      const auditLogs = await db
        .selectFrom("AuditLog")
        .where("eventType", "=", AuditLogEvent.SiteConfigUpdate)
        .where("userId", "=", user.id)
        .selectAll()
        .execute()

      expect(auditLogs).toHaveLength(2)
      expect(auditLogs.map((log) => log.siteId).sort()).toEqual(
        [customSite.id, legacySite.id].sort(),
      )
      expect(auditLogs[0]?.metadata).toEqual({
        script: "replaceNotificationWithAntiscam",
      })
    })

    it("does not write changes during dry run", async () => {
      const user = await setupUser({})
      const { site } = await setupSite()
      await setSiteNotification(site.id, {
        type: "custom",
        title: "Custom banner",
      })

      const { updatedSiteIds } = await replaceNotificationWithAntiscam({
        dryRun: true,
        scriptUserId: user.id,
      })

      expect(updatedSiteIds).toEqual([])
      expect(confirm).not.toHaveBeenCalled()

      const unchangedSite = await db
        .selectFrom("Site")
        .where("id", "=", site.id)
        .select(
          sql<SiteNotificationConfig | null>`config->'notification'`.as(
            "notification",
          ),
        )
        .executeTakeFirstOrThrow()

      expect(unchangedSite.notification).toEqual({
        type: "custom",
        title: "Custom banner",
      })
    })

    it("scopes updates to a single site when site id is provided", async () => {
      const user = await setupUser({})
      const { site: targetSite } = await setupSite()
      const { site: otherSite } = await setupSite()

      await setSiteNotification(targetSite.id, {
        type: "custom",
        title: "Target banner",
      })
      await setSiteNotification(otherSite.id, {
        type: "custom",
        title: "Other banner",
      })

      vi.mocked(confirm).mockResolvedValue(true)

      const { updatedSiteIds } = await replaceNotificationWithAntiscam({
        dryRun: false,
        siteId: targetSite.id,
        scriptUserId: user.id,
      })

      expect(updatedSiteIds).toEqual([targetSite.id])

      const sites = await getSitesWithNotifications()
      const targetNotification = sites.find(
        (s) => s.id === targetSite.id,
      )?.notification
      const otherNotification = sites.find(
        (s) => s.id === otherSite.id,
      )?.notification

      expect(targetNotification).toEqual(ANTISCAM_NOTIFICATION)
      expect(otherNotification).toEqual({
        type: "custom",
        title: "Other banner",
      })
    })
  })
})
