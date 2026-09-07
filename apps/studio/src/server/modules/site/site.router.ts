import type {
  IsomerSiteConfigProps,
  IsomerSiteThemeProps,
  IsomerSiteWideComponentsProps,
} from "@opengovsg/isomer-components"
import { TRPCError } from "@trpc/server"
import {
  createSiteSchema,
  getConfigSchema,
  getLocalisedSitemapSchema,
  getNameSchema,
  getNotificationSchema,
  publishSiteSchema,
  setFooterSchema,
  setNavbarSchema,
  setNotificationSchema,
  setSiteConfigByAdminSchema,
  setThemeSchema,
  updateSiteConfigSchema,
  updateSiteIntegrationsSchema,
} from "~/schemas/site"
import { protectedProcedure, router } from "~/server/trpc"
import { safeJsonParse } from "~/utils/safeJsonParse"
import { IsomerAdminRole, RoleType } from "~prisma/generated/generatedEnums"

import { logConfigEvent, logPublishEvent } from "../audit/audit.service"
import { publishSite } from "../aws/codebuild.service"
import { db } from "../database/database"
import { AuditLogEvent } from "../database/types"
import { jsonb } from "../database/utils"
import {
  isActiveIsomerAdmin,
  validateUserIsIsomerAdmin,
} from "../permissions/permissions.service"
import {
  getFooter,
  getLocalisedSitemap,
  getNavBar,
  publishSiteConfig,
} from "../resource/resource.service"
import { updateSearchSGConfig } from "../searchsg/searchsg.service"
import {
  createSite,
  getNotification,
  getSiteConfig,
  getSiteTheme,
  normalizeAskgovConfig,
  resolveSearchConfig,
  setSiteNotification,
  validateUserPermissionsForSite,
} from "./site.service"

export const siteRouter = router({
  create: protectedProcedure
    .input(createSiteSchema)
    .mutation(async ({ ctx, input: { siteName } }) => {
      await validateUserIsIsomerAdmin({
        roles: [IsomerAdminRole.Core],
        userId: ctx.user.id,
      })

      return await createSite({ siteName, userId: ctx.user.id })
    }),
  getConfig: protectedProcedure
    .input(getConfigSchema)
    .query(async ({ ctx, input: { id } }) => {
      await validateUserPermissionsForSite({
        action: "read",
        siteId: id,
        userId: ctx.user.id,
      })
      return await getSiteConfig(db, id)
    }),
  getFooter: protectedProcedure
    .input(getConfigSchema)
    .query(async ({ ctx, input: { id } }) => {
      await validateUserPermissionsForSite({
        action: "read",
        siteId: id,
        userId: ctx.user.id,
      })
      return await getFooter(db, id)
    }),
  getLocalisedSitemap: protectedProcedure
    .input(getLocalisedSitemapSchema)
    .query(async ({ ctx, input: { siteId, resourceId } }) => {
      await validateUserPermissionsForSite({
        action: "read",
        siteId,
        userId: ctx.user.id,
      })
      return await getLocalisedSitemap(siteId, resourceId)
    }),
  getNavbar: protectedProcedure
    .input(getConfigSchema)
    .query(async ({ ctx, input: { id } }) => {
      await validateUserPermissionsForSite({
        action: "read",
        siteId: id,
        userId: ctx.user.id,
      })
      return await getNavBar(db, id)
    }),
  getNotification: protectedProcedure
    .input(getNotificationSchema)
    .query(async ({ ctx, input: { siteId } }) => {
      await validateUserPermissionsForSite({
        action: "read",
        siteId,
        userId: ctx.user.id,
      })

      return await getNotification(siteId)
    }),
  getSiteName: protectedProcedure
    .input(getNameSchema)
    .query(async ({ ctx, input: { siteId } }) => {
      await validateUserPermissionsForSite({
        action: "read",
        siteId,
        userId: ctx.user.id,
      })

      const { config } = await db
        .selectFrom("Site")
        .where("Site.id", "=", siteId)
        .select("config")
        .executeTakeFirstOrThrow()

      return { name: config.siteName }
    }),
  getTheme: protectedProcedure
    .input(getConfigSchema)
    .query(async ({ ctx, input: { id } }) => {
      await validateUserPermissionsForSite({
        action: "read",
        siteId: id,
        userId: ctx.user.id,
      })
      const theme = await getSiteTheme(id)
      return theme
    }),
  list: protectedProcedure.query(async ({ ctx }) => {
    // Isomer admins can see all sites, with an implicit Admin role
    // regardless of any explicit roles they have on the site
    const isIsomerAdmin = await isActiveIsomerAdmin(ctx.user.id)
    if (isIsomerAdmin) {
      const sites = await db
        .selectFrom("Site")
        .select(["Site.id", "Site.config"])
        .orderBy("Site.id", "asc")
        .execute()
      return sites.map((site) => ({ ...site, role: RoleType.Admin }))
    }

    // NOTE: Any role should be able to read site.
    // We only consider site-wide permissions (resourceId is null) here
    // because there's no granular resource role, mirroring
    // `getResourcePermission` in the permissions module.
    return await db
      .selectFrom("Site")
      .innerJoin("ResourcePermission", "Site.id", "ResourcePermission.siteId")
      .where("ResourcePermission.deletedAt", "is", null)
      .where("ResourcePermission.resourceId", "is", null)
      .where("ResourcePermission.userId", "=", ctx.user.id)
      .select(["Site.id", "Site.config", "ResourcePermission.role"])
      .orderBy("Site.id", "asc")
      .execute()
  }),
  listAllSites: protectedProcedure.query(async ({ ctx }) => {
    await validateUserIsIsomerAdmin({
      roles: [IsomerAdminRole.Core],
      userId: ctx.user.id,
    })

    return await db
      .selectFrom("Site")
      .select(["Site.id", "Site.config", "Site.codeBuildId"])
      .orderBy("Site.id", "asc")
      .execute()
  }),
  publish: protectedProcedure
    .input(publishSiteSchema)
    .mutation(async ({ ctx, input: { siteId } }) => {
      await validateUserIsIsomerAdmin({
        roles: [IsomerAdminRole.Core],
        userId: ctx.user.id,
      })

      const byUser = await db
        .selectFrom("User")
        .selectAll()
        .where("id", "=", ctx.user.id)
        .executeTakeFirstOrThrow(
          () =>
            new TRPCError({
              code: "NOT_FOUND",
              message: "The user could not be found.",
            }),
        )

      await db.transaction().execute(async (tx) => {
        await logPublishEvent(tx, {
          by: byUser,
          delta: { after: null, before: null },
          eventType: AuditLogEvent.Publish,
          metadata: {},
          siteId,
        })
        await publishSite(ctx.logger, { siteId })
      })
    }),
  setFooter: protectedProcedure
    .input(setFooterSchema)
    .mutation(async ({ ctx, input: { siteId, footer } }) => {
      await validateUserPermissionsForSite({
        action: "update",
        siteId,
        userId: ctx.user.id,
      })

      await db.transaction().execute(async (tx) => {
        const user = await tx
          .selectFrom("User")
          .where("id", "=", ctx.user.id)
          .selectAll()
          .executeTakeFirst()

        if (!user) {
          // NOTE: This shouldn't happen as the user is already logged in
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "The user could not be found.",
          })
        }

        const site = await tx
          .selectFrom("Site")
          .where("id", "=", siteId)
          .selectAll()
          .executeTakeFirst()

        if (!site) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "The site could not be found.",
          })
        }

        const oldFooter = await tx
          .selectFrom("Footer")
          .where("siteId", "=", siteId)
          .selectAll()
          .executeTakeFirst()

        if (!oldFooter) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "The footer for the site could not be found.",
          })
        }

        const newFooter = await tx
          .updateTable("Footer")
          .set({
            content: jsonb(
              // SAFETY: footer JSON was validated by the site settings schema before persistence
              safeJsonParse(
                footer,
              ) as IsomerSiteWideComponentsProps["footerItems"],
            ),
          })
          .where("siteId", "=", siteId)
          .returningAll()
          .executeTakeFirst()

        if (!newFooter) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to update site footer.",
          })
        }

        await logConfigEvent(tx, {
          by: user,
          delta: { after: newFooter, before: oldFooter },
          eventType: AuditLogEvent.FooterUpdate,
          siteId,
        })

        await publishSiteConfig(
          ctx.user.id,
          { footer: newFooter, site },
          ctx.logger,
        )
      })
    }),
  setNavbar: protectedProcedure
    .input(setNavbarSchema)
    .mutation(async ({ ctx, input: { siteId, navbar } }) => {
      await validateUserPermissionsForSite({
        action: "update",
        siteId,
        userId: ctx.user.id,
      })

      await db.transaction().execute(async (tx) => {
        const user = await tx
          .selectFrom("User")
          .where("id", "=", ctx.user.id)
          .selectAll()
          .executeTakeFirst()

        if (!user) {
          // NOTE: This shouldn't happen as the user is already logged in
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "The user could not be found.",
          })
        }

        const site = await tx
          .selectFrom("Site")
          .where("id", "=", siteId)
          .selectAll()
          .executeTakeFirst()

        if (!site) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "The site could not be found.",
          })
        }

        // Update Navbar contents
        const oldNavbar = await tx
          .selectFrom("Navbar")
          .where("siteId", "=", siteId)
          .selectAll()
          .executeTakeFirst()

        if (!oldNavbar) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "The navbar for the site could not be found.",
          })
        }

        const newNavbar = await tx
          .updateTable("Navbar")
          .set({
            content: jsonb(
              // SAFETY: navbar JSON was validated by the site settings schema before persistence
              safeJsonParse(navbar) as IsomerSiteWideComponentsProps["navbar"],
            ),
          })
          .where("siteId", "=", siteId)
          .returningAll()
          .executeTakeFirst()

        if (!newNavbar) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to update site navbar.",
          })
        }

        await logConfigEvent(tx, {
          by: user,
          delta: { after: newNavbar, before: oldNavbar },
          eventType: AuditLogEvent.NavbarUpdate,
          siteId,
        })

        await publishSiteConfig(
          ctx.user.id,
          { navbar: newNavbar, site },
          ctx.logger,
        )
      })
    }),
  setNotification: protectedProcedure.input(setNotificationSchema).mutation(
    async ({
      ctx,
      input: {
        siteId,
        notification: { notification },
      },
    }) => {
      await validateUserPermissionsForSite({
        action: "update",
        siteId,
        userId: ctx.user.id,
      })

      const site = await setSiteNotification({
        notification,
        siteId,
        userId: ctx.user.id,
      })

      await publishSiteConfig(ctx.user.id, { site }, ctx.logger)

      return site.config.notification
    },
  ),
  setSiteConfigByAdmin: protectedProcedure
    .input(setSiteConfigByAdminSchema)
    .mutation(
      // Deferred: Make use of the site config, navbar and footer JSON schemas to
      // validate the input JSON before parsing. Also ensure that existing site
      // configs in the database meets the schema requirements
      async ({ ctx, input: { siteId, config, theme, navbar, footer } }) => {
        await validateUserIsIsomerAdmin({
          roles: [IsomerAdminRole.Core, IsomerAdminRole.Migrator],
          userId: ctx.user.id,
        })

        await db.transaction().execute(async (tx) => {
          const user = await tx
            .selectFrom("User")
            .where("id", "=", ctx.user.id)
            .selectAll()
            .executeTakeFirst()

          if (!user) {
            // NOTE: This shouldn't happen as the user is already logged in
            throw new TRPCError({
              code: "NOT_FOUND",
              message: "The user could not be found.",
            })
          }

          // Update site-level configuration
          const oldSite = await tx
            .selectFrom("Site")
            .where("id", "=", siteId)
            .selectAll()
            .executeTakeFirst()

          if (!oldSite) {
            throw new TRPCError({
              code: "NOT_FOUND",
              message: "The site could not be found.",
            })
          }

          const newSite = await tx
            .updateTable("Site")
            .set({
              // SAFETY: config JSON was validated by the site settings schema before persistence
              config: jsonb(safeJsonParse(config) as IsomerSiteConfigProps),
              // SAFETY: theme JSON was validated by the site settings schema before persistence
              theme: jsonb(safeJsonParse(theme) as IsomerSiteThemeProps),
            })
            .where("id", "=", siteId)
            .returningAll()
            .executeTakeFirst()

          if (!newSite) {
            throw new TRPCError({
              code: "INTERNAL_SERVER_ERROR",
              message: "Failed to update site configuration.",
            })
          }

          await logConfigEvent(tx, {
            by: user,
            delta: { after: newSite, before: oldSite },
            eventType: AuditLogEvent.SiteConfigUpdate,
            siteId,
          })

          // Update Navbar contents
          const oldNavbar = await tx
            .selectFrom("Navbar")
            .where("siteId", "=", siteId)
            .selectAll()
            .executeTakeFirst()

          if (!oldNavbar) {
            throw new TRPCError({
              code: "NOT_FOUND",
              message: "The navbar for the site could not be found.",
            })
          }

          const newNavbar = await tx
            .updateTable("Navbar")
            .set({
              content: jsonb(
                // SAFETY: navbar JSON was validated by the site settings schema before persistence
                safeJsonParse(
                  navbar,
                ) as IsomerSiteWideComponentsProps["navbar"],
              ),
            })
            .where("siteId", "=", siteId)
            .returningAll()
            .executeTakeFirst()

          if (!newNavbar) {
            throw new TRPCError({
              code: "INTERNAL_SERVER_ERROR",
              message: "Failed to update site navbar.",
            })
          }

          await logConfigEvent(tx, {
            by: user,
            delta: { after: newNavbar, before: oldNavbar },
            eventType: AuditLogEvent.NavbarUpdate,
            siteId,
          })

          // Update Footer contents
          const oldFooter = await tx
            .selectFrom("Footer")
            .where("siteId", "=", siteId)
            .selectAll()
            .executeTakeFirst()

          if (!oldFooter) {
            throw new TRPCError({
              code: "NOT_FOUND",
              message: "The footer for the site could not be found.",
            })
          }

          const newFooter = await tx
            .updateTable("Footer")
            .set({
              content: jsonb(
                // SAFETY: footer JSON was validated by the site settings schema before persistence
                safeJsonParse(
                  footer,
                ) as IsomerSiteWideComponentsProps["footerItems"],
              ),
            })
            .where("siteId", "=", siteId)
            .returningAll()
            .executeTakeFirst()

          if (!newFooter) {
            throw new TRPCError({
              code: "INTERNAL_SERVER_ERROR",
              message: "Failed to update site footer.",
            })
          }

          await logConfigEvent(tx, {
            by: user,
            delta: { after: newFooter, before: oldFooter },
            eventType: AuditLogEvent.FooterUpdate,
            siteId,
          })

          await publishSiteConfig(
            ctx.user.id,
            { footer: newFooter, navbar: newNavbar, site: newSite },
            ctx.logger,
          )
        })
      },
    ),
  setTheme: protectedProcedure
    .input(setThemeSchema)
    .mutation(async ({ ctx, input: { siteId, theme } }) => {
      await validateUserPermissionsForSite({
        action: "update",
        siteId,
        userId: ctx.user.id,
      })

      const site = await db
        .selectFrom("Site")
        .where("id", "=", siteId)
        .selectAll()
        .executeTakeFirst()

      if (!site) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "The site could not be found.",
        })
      }

      const oldTheme = site.theme

      if (!oldTheme) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "The theme for the site could not be found.",
        })
      }

      const updatedSite = await db.transaction().execute(async (tx) => {
        const user = await tx
          .selectFrom("User")
          .where("id", "=", ctx.user.id)
          .selectAll()
          .executeTakeFirst()

        if (!user) {
          // NOTE: This shouldn't happen as the user is already logged in
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "The user could not be found.",
          })
        }

        const newSite = await tx
          .updateTable("Site")
          .set({ theme: jsonb(theme) })
          .where("id", "=", siteId)
          .returningAll()
          .executeTakeFirst()

        if (!newSite) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to update site theme.",
          })
        }

        await logConfigEvent(tx, {
          by: user,
          delta: { after: newSite, before: site },
          eventType: AuditLogEvent.SiteConfigUpdate,
          siteId,
        })

        await publishSiteConfig(ctx.user.id, { site }, ctx.logger)
        return newSite
      })

      // NOTE: if the users update their `canvas.inverse`
      // we also need to update their searchsg theme settings
      if (
        site.config.search?.type === "searchSG" &&
        oldTheme.colors.brand.canvas.inverse !==
          theme.colors.brand.canvas.inverse
      ) {
        // IMPORTANT: clientId must always come from the DB, not user input (path traversal risk)
        void updateSearchSGConfig(
          { _kind: "colour", colour: theme.colors.brand.canvas.inverse },
          site.config.search.clientId,
          site.config.url,
        ).catch((error: unknown) => {
          ctx.logger.error({ error }, "[ERROR] updateSearchSGConfig failed")
        })
      }

      return updatedSite
    }),
  updateSiteConfig: protectedProcedure
    .input(updateSiteConfigSchema)
    .mutation(async ({ ctx, input: { siteId, siteName, ...rest } }) => {
      await validateUserPermissionsForSite({
        action: "update",
        siteId,
        userId: ctx.user.id,
      })

      const [user, site] = await Promise.all([
        db
          .selectFrom("User")
          .where("id", "=", ctx.user.id)
          .selectAll()
          .executeTakeFirstOrThrow(),
        db
          .selectFrom("Site")
          .where("id", "=", siteId)
          .selectAll()
          .executeTakeFirstOrThrow(),
      ])

      const { config } = site
      const normalizedConfig = normalizeAskgovConfig({ ...rest, siteName })

      const updatedConfig = await db.transaction().execute(async (tx) => {
        // searchSG and egazette-algolia are admin-managed; their credentials
        // always come from the DB, never from site-admin input.
        const searchConfig = resolveSearchConfig(
          config.search,
          normalizedConfig.search,
        )

        const updatedSite = await tx
          .updateTable("Site")
          .set({
            config: jsonb({ ...normalizedConfig, search: searchConfig }),
            name: siteName,
          })
          .where("id", "=", siteId)
          .returningAll()
          .executeTakeFirstOrThrow()

        await logConfigEvent(tx, {
          by: user,
          delta: { after: updatedSite, before: site },
          eventType: AuditLogEvent.SiteConfigUpdate,
          siteId,
        })

        return updatedSite.config
      })

      await publishSiteConfig(ctx.user.id, { site }, ctx.logger)

      // NOTE: only update searchsg if either the agency name changed
      // or if the search type changed.
      // `void` here because this API call is slow
      // and not super critical to update
      if (
        updatedConfig.search?.type === "searchSG" &&
        (config.search?.type !== "searchSG" ||
          config.siteName !== updatedConfig.siteName)
      ) // IMPORTANT: clientId must always come from the DB, not user input (path traversal risk)
      {
        void updateSearchSGConfig(
          { _kind: "name", name: siteName },
          updatedConfig.search.clientId,
          updatedConfig.url,
        ).catch((error: unknown) => {
          ctx.logger.error({ error }, "[ERROR] updateSearchSGConfig failed")
        })
      }

      return updatedConfig
    }),
  updateSiteIntegrations: protectedProcedure
    .input(updateSiteIntegrationsSchema)
    .mutation(async ({ ctx, input: { siteId, data } }) => {
      await validateUserPermissionsForSite({
        action: "update",
        siteId,
        userId: ctx.user.id,
      })
      const user = await db
        .selectFrom("User")
        .where("id", "=", ctx.user.id)
        .selectAll()
        .executeTakeFirstOrThrow()
      const normalizedData = normalizeAskgovConfig(data)

      return await db.transaction().execute(async (tx) => {
        const site = await tx
          .selectFrom("Site")
          .where("id", "=", siteId)
          .selectAll()
          .executeTakeFirstOrThrow()

        // SearchSG is a vetted external search integration; localSearch exposes
        // a searchUrl field that could be used for open redirect. Prevent
        // a site admin from switching back to localSearch once SearchSG is set.
        if (
          site.config.search?.type === "searchSG" &&
          normalizedData.search?.type === "localSearch"
        ) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message:
              "Cannot downgrade search integration from SearchSG to local search",
          })
        }

        // searchSG and egazette-algolia are admin-managed; their credentials
        // always come from the DB, never from site-admin input.
        const search = resolveSearchConfig(
          site.config.search,
          normalizedData.search,
        )

        const updatedSite = await tx
          .updateTable("Site")
          .set({ config: jsonb({ ...normalizedData, search }) })
          .where("id", "=", siteId)
          .returningAll()
          .executeTakeFirstOrThrow()

        await logConfigEvent(tx, {
          by: user,
          delta: { after: updatedSite, before: site },
          eventType: AuditLogEvent.SiteConfigUpdate,
          siteId,
        })

        await publishSiteConfig(ctx.user.id, { site }, ctx.logger)

        return updatedSite
      })
    }),
})
