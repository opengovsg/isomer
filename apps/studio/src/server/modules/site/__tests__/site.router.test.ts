import { TRPCError } from "@trpc/server"
import { resetTables } from "tests/integration/helpers/db"
import {
  applyAuthedSession,
  applySession,
  createMockRequest,
} from "tests/integration/helpers/iron-session"
import {
  setupAdminPermissions,
  setupEditorPermissions,
  setupSite,
} from "tests/integration/helpers/seed"

import { createCallerFactory } from "~/server/trpc"
import { AuditLogEvent, db, jsonb } from "../../database"
import { siteRouter } from "../site.router"

const createCaller = createCallerFactory(siteRouter)

describe("site.router", async () => {
  let caller: ReturnType<typeof createCaller>
  const session = await applyAuthedSession()

  beforeAll(() => {
    caller = createCaller(createMockRequest(session))
  })

  beforeEach(async () => {
    await resetTables("Site", "ResourcePermission")
  })

  describe("list", () => {
    it("should throw 401 if not logged in", async () => {
      // Arrange
      const unauthedSession = applySession()
      const unauthedCaller = createCaller(createMockRequest(unauthedSession))

      // Act
      const result = unauthedCaller.list()

      // Assert
      await expect(result).rejects.toThrowError(
        new TRPCError({ code: "UNAUTHORIZED" }),
      )
    })

    it("should return an empty array if there are no sites in the database", async () => {
      // Act
      const result = await caller.list()

      // Assert
      expect(result).toEqual([])
    })

    it("should include the Site if the user has any role permission for the site", async () => {
      // Arrange
      const { site } = await setupSite()
      await setupAdminPermissions({
        userId: session.userId,
        siteId: site.id,
      })

      // Act
      const result = await caller.list()

      // Assert
      expect(result).toEqual([
        {
          id: site.id,
          config: site.config,
        },
      ])
    })

    it("should only include sites that the user has any role permission for", async () => {
      // Arrange
      const { site: site1 } = await setupSite()
      const { site: _site2 } = await setupSite()
      await setupAdminPermissions({
        userId: session.userId,
        siteId: site1.id,
      })

      // Act
      const result = await caller.list()

      // Assert
      expect(result).toEqual([
        {
          id: site1.id,
          config: site1.config,
        },
      ])
    })

    it("should return an empty array if the user does not have any role for the site", async () => {
      // Arrange
      const _ = await setupSite()

      // Act
      const result = await caller.list()

      // Assert
      expect(result).toEqual([])
    })

    it("should only return sites if the permissions are not deleted for the site", async () => {
      const { site: site1 } = await setupSite()
      const { site: site2 } = await setupSite()
      await setupAdminPermissions({
        userId: session.userId,
        siteId: site1.id,
        isDeleted: true,
      })
      await setupAdminPermissions({
        userId: session.userId,
        siteId: site2.id,
      })

      // Act
      const result = await caller.list()

      // Assert
      expect(result).toEqual([
        {
          id: site2.id,
          config: site2.config,
        },
      ])
    })
  })

  describe("getSiteName", () => {
    it("should throw 401 if not logged in", async () => {
      // Arrange
      const unauthedSession = applySession()
      const unauthedCaller = createCaller(createMockRequest(unauthedSession))

      // Act
      const result = unauthedCaller.getSiteName({ siteId: 1 })

      // Assert
      await expect(result).rejects.toThrowError(
        new TRPCError({ code: "UNAUTHORIZED" }),
      )
    })

    it("should return the site name", async () => {
      // Arrange
      const { site } = await setupSite()
      await setupAdminPermissions({
        userId: session.userId,
        siteId: site.id,
      })

      // Act
      const result = await caller.getSiteName({ siteId: site.id })

      // Assert
      expect(result).toEqual({ name: site.name })
    })

    it("should throw 403 if user does not have read access to the site", async () => {
      // Arrange
      const { site } = await setupSite()

      // Act
      const result = caller.getSiteName({ siteId: site.id })

      // Assert
      await expect(result).rejects.toThrowError(
        new TRPCError({
          code: "FORBIDDEN",
          message:
            "You do not have sufficient permissions to perform this action",
        }),
      )
    })
  })

  describe("setNotification", () => {
    beforeEach(async () => {
      await resetTables("AuditLog")
    })

    it("should throw 401 if user is not logged in", async () => {
      // Arrange
      const unauthedSession = applySession()
      const unauthedCaller = createCaller(createMockRequest(unauthedSession))

      // Act
      const result = unauthedCaller.setNotification({
        siteId: 1,
        notification: "foo",
        notificationEnabled: true,
      })

      // Assert
      await expect(result).rejects.toThrowError(
        new TRPCError({ code: "UNAUTHORIZED" }),
      )
      await expect(db.selectFrom("AuditLog").execute()).resolves.toEqual([])
    })

    it("should throw 403 if user does not have write access to the site", async () => {
      // Arrange
      const { site } = await setupSite()
      await setupEditorPermissions({
        userId: session.userId,
        siteId: site.id,
      })

      // Act
      const result = caller.setNotification({
        siteId: site.id,
        notification: "foo",
        notificationEnabled: true,
      })

      // Assert
      await expect(result).rejects.toThrowError(
        new TRPCError({
          code: "FORBIDDEN",
          message:
            "You do not have sufficient permissions to perform this action",
        }),
      )
      await expect(db.selectFrom("AuditLog").execute()).resolves.toEqual([])
    })

    it("should save changes to the site notification successfully if one exists", async () => {
      // Arrange
      const { site } = await setupSite()
      await db
        .updateTable("Site")
        .set((eb) => ({
          config: eb(
            "Site.config",
            "||",
            // @ts-expect-error JSON concat operator replaces the entire notification object if it exists, but Kysely does not have types for this.
            jsonb({
              notification: { content: [{ type: "text", text: "bar" }] },
            }),
          ),
        }))
        .where("id", "=", site.id)
        .execute()
      await setupAdminPermissions({
        userId: session.userId,
        siteId: site.id,
      })

      // Act
      await caller.setNotification({
        siteId: site.id,
        notification: "foo",
        notificationEnabled: true,
      })

      // Assert
      const newSite = await db
        .selectFrom("Site")
        .where("id", "=", site.id)
        .select("Site.config")
        .executeTakeFirstOrThrow()
      expect(newSite.config.notification).toEqual({
        content: [{ type: "text", text: "foo" }],
      })
      const auditLog = await db.selectFrom("AuditLog").selectAll().execute()
      expect(auditLog).toHaveLength(2)
      expect(
        auditLog?.some(({ eventType }) => {
          return eventType === AuditLogEvent.SiteConfigUpdate
        }),
      ).toEqual(true)
      expect(
        auditLog?.some(({ eventType }) => {
          return eventType === AuditLogEvent.Publish
        }),
      ).toEqual(true)
      expect(
        auditLog?.every(({ userId }) => {
          return userId === session.userId
        }),
      ).toEqual(true)
    })

    it("should add the site notification successfully if one did exist before", async () => {
      // Arrange
      const { site } = await setupSite()
      await setupAdminPermissions({
        userId: session.userId,
        siteId: site.id,
      })

      // Act
      await caller.setNotification({
        siteId: site.id,
        notification: "foo",
        notificationEnabled: true,
      })

      // Assert
      const newSite = await db
        .selectFrom("Site")
        .where("id", "=", site.id)
        .select("Site.config")
        .executeTakeFirstOrThrow()
      expect(newSite.config.notification).toEqual({
        content: [{ type: "text", text: "foo" }],
      })
      const auditLog = await db
        .selectFrom("AuditLog")
        .selectAll()
        .executeTakeFirst()
      expect(auditLog).toBeDefined()
      expect(auditLog?.eventType).toEqual(AuditLogEvent.SiteConfigUpdate)
      expect(auditLog?.userId).toEqual(session.userId)
    })

    it("should remove the site notification successfully if notification is disabled", async () => {
      // Arrange
      const { site } = await setupSite()
      await db
        .updateTable("Site")
        .set((eb) => ({
          config: eb(
            "Site.config",
            "||",
            // @ts-expect-error JSON concat operator replaces the entire notification object if it exists, but Kysely does not have types for this.
            jsonb({
              notification: { content: [{ type: "text", text: "bar" }] },
            }),
          ),
        }))
        .where("id", "=", site.id)
        .execute()
      await setupAdminPermissions({
        userId: session.userId,
        siteId: site.id,
      })

      // Act
      await caller.setNotification({
        siteId: site.id,
        notification: "foo",
        notificationEnabled: false,
      })

      // Assert
      const newSite = await db
        .selectFrom("Site")
        .where("id", "=", site.id)
        .select("Site.config")
        .executeTakeFirstOrThrow()
      expect(newSite.config.notification).toBeUndefined()
      const auditLog = await db
        .selectFrom("AuditLog")
        .selectAll()
        .executeTakeFirst()
      expect(auditLog).toBeDefined()
      expect(auditLog?.eventType).toEqual(AuditLogEvent.SiteConfigUpdate)
      expect(auditLog?.userId).toEqual(session.userId)
    })
  })

  describe("setSiteConfigByAdmin", () => {
    beforeEach(async () => {
      await resetTables("AuditLog", "Navbar", "Footer")
    })

    it("should throw 401 if user is not logged in", async () => {
      // Arrange
      const unauthedSession = applySession()
      const unauthedCaller = createCaller(createMockRequest(unauthedSession))

      // Act
      const result = unauthedCaller.setSiteConfigByAdmin({
        siteId: 1,
        config: "config",
        theme: "theme",
        navbar: "navbar",
        footer: "footer",
      })

      // Assert
      await expect(result).rejects.toThrowError(
        new TRPCError({ code: "UNAUTHORIZED" }),
      )
      await expect(db.selectFrom("AuditLog").execute()).resolves.toEqual([])
    })

    it("should throw 403 if user does not have write access to the site", async () => {
      // Arrange
      const { site } = await setupSite()
      await setupEditorPermissions({
        userId: session.userId,
        siteId: site.id,
      })

      // Act
      const result = caller.setSiteConfigByAdmin({
        siteId: site.id,
        config: "config",
        theme: "theme",
        navbar: "navbar",
        footer: "footer",
      })

      // Assert
      await expect(result).rejects.toThrowError(
        new TRPCError({
          code: "FORBIDDEN",
          message:
            "You do not have sufficient permissions to perform this action",
        }),
      )
      await expect(db.selectFrom("AuditLog").execute()).resolves.toEqual([])
    })

    it("should save changes to the site config, navbar and footer successfully", async () => {
      // Arrange
      const NEW_CONFIG = `"config"`
      const NEW_THEME = `"theme"`
      const NEW_NAVBAR = `"navbar"`
      const NEW_FOOTER = `"footer"`
      const { site } = await setupSite()
      await setupAdminPermissions({
        userId: session.userId,
        siteId: site.id,
      })

      // Act
      await caller.setSiteConfigByAdmin({
        siteId: site.id,
        config: NEW_CONFIG,
        theme: NEW_THEME,
        navbar: NEW_NAVBAR,
        footer: NEW_FOOTER,
      })

      // Assert
      const newSite = await db
        .selectFrom("Site")
        .where("id", "=", site.id)
        .selectAll()
        .executeTakeFirstOrThrow()
      const newNavbar = await db
        .selectFrom("Navbar")
        .where("siteId", "=", site.id)
        .selectAll()
        .executeTakeFirstOrThrow()
      const newFooter = await db
        .selectFrom("Footer")
        .where("siteId", "=", site.id)
        .selectAll()
        .executeTakeFirstOrThrow()
      const auditLogs = await db.selectFrom("AuditLog").selectAll().execute()

      expect(newSite.config).toEqual(NEW_CONFIG.replaceAll(`"`, ""))
      expect(newSite.theme).toEqual(NEW_THEME.replaceAll(`"`, ""))
      expect(newNavbar.content).toEqual(NEW_NAVBAR.replaceAll(`"`, ""))
      expect(newFooter.content).toEqual(NEW_FOOTER.replaceAll(`"`, ""))
      expect(auditLogs).toHaveLength(4)
      expect(
        auditLogs.some(
          (log) => log.eventType === AuditLogEvent.SiteConfigUpdate,
        ),
      ).toBe(true)
      expect(
        auditLogs.some((log) => log.eventType === AuditLogEvent.NavbarUpdate),
      ).toBe(true)
      expect(
        auditLogs.some((log) => log.eventType === AuditLogEvent.FooterUpdate),
      ).toBe(true)
      expect(
        auditLogs.some((log) => log.eventType === AuditLogEvent.Publish),
      ).toBe(true)
      expect(auditLogs.every((log) => log.userId === session.userId)).toBe(true)
    })
  })
})
