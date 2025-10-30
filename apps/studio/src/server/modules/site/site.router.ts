import type {
  IsomerSiteConfigProps,
  IsomerSiteThemeProps,
  IsomerSiteWideComponentsProps,
} from "@opengovsg/isomer-components"
import { TRPCError } from "@trpc/server"

import { ADMIN_ROLE } from "~/lib/growthbook"
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
import { logConfigEvent, logPublishEvent } from "../audit/audit.service"
import { publishSite } from "../aws/codebuild.service"
import { AuditLogEvent, db, jsonb } from "../database"
import { validateUserIsIsomerCoreAdmin } from "../permissions/permissions.service"
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
  setSiteNotification,
  validateUserPermissionsForSite,
} from "./site.service"

export const siteRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => {
    // NOTE: Any role should be able to read site
    return db
      .selectFrom("Site")
      .innerJoin("ResourcePermission", "Site.id", "ResourcePermission.siteId")
      .where("ResourcePermission.deletedAt", "is", null)
      .where("ResourcePermission.userId", "=", ctx.user.id)
      .select(["Site.id", "Site.config"])
      .groupBy(["Site.id", "Site.config"])
      .execute()
  }),
  listAllSites: protectedProcedure.query(async ({ ctx }) => {
    await validateUserIsIsomerCoreAdmin({
      userId: ctx.user.id,
      gb: ctx.gb,
      roles: [ADMIN_ROLE.CORE],
    })

    return db
      .selectFrom("Site")
      .select(["Site.id", "Site.config", "Site.codeBuildId"])
      .orderBy("Site.id", "asc")
      .execute()
  }),
  getSiteName: protectedProcedure
    .input(getNameSchema)
    .query(async ({ ctx, input: { siteId } }) => {
      await validateUserPermissionsForSite({
        siteId,
        userId: ctx.user.id,
        action: "read",
      })

      const { config } = await db
        .selectFrom("Site")
        .where("Site.id", "=", siteId)
        .select("config")
        .executeTakeFirstOrThrow()

      return { name: config.siteName }
    }),
  getConfig: protectedProcedure
    .input(getConfigSchema)
    .query(async ({ ctx, input: { id } }) => {
      await validateUserPermissionsForSite({
        siteId: id,
        userId: ctx.user.id,
        action: "read",
      })
      return getSiteConfig(db, id)
    }),
  updateSiteConfig: protectedProcedure
    .input(updateSiteConfigSchema)
    .mutation(async ({ ctx, input: { siteId, siteName, ...rest } }) => {
      await validateUserPermissionsForSite({
        siteId,
        userId: ctx.user.id,
        action: "update",
      })

      const user = await db
        .selectFrom("User")
        .where("id", "=", ctx.user.id)
        .selectAll()
        .executeTakeFirstOrThrow()

      const site = await db
        .selectFrom("Site")
        .where("id", "=", siteId)
        .selectAll()
        .executeTakeFirstOrThrow()

      const { config } = site

      const updatedConfig = await db.transaction().execute(async (tx) => {
        const updatedSite = await tx
          .updateTable("Site")
          .set({ config: jsonb({ ...rest, siteName }) })
          .where("id", "=", siteId)
          .returningAll()
          .executeTakeFirstOrThrow()

        await logConfigEvent(tx, {
          eventType: AuditLogEvent.SiteConfigUpdate,
          delta: {
            before: site,
            after: updatedSite,
          },
          by: user,
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
      )
        void updateSearchSGConfig(
          { name: siteName, _kind: "name" },
          updatedConfig.search.clientId,
          updatedConfig.url,
        )

      return updatedConfig
    }),
  updateSiteIntegrations: protectedProcedure
    .input(updateSiteIntegrationsSchema)
    .mutation(async ({ ctx, input: { siteId, data } }) => {
      await validateUserPermissionsForSite({
        siteId,
        userId: ctx.user.id,
        action: "update",
      })
      const user = await db
        .selectFrom("User")
        .where("id", "=", ctx.user.id)
        .selectAll()
        .executeTakeFirstOrThrow()

      return await db.transaction().execute(async (tx) => {
        const site = await tx
          .selectFrom("Site")
          .where("id", "=", siteId)
          .selectAll()
          .executeTakeFirstOrThrow()

        const updatedSite = await tx
          .updateTable("Site")
          .set({ config: jsonb(data) })
          .where("id", "=", siteId)
          .returningAll()
          .executeTakeFirstOrThrow()

        await logConfigEvent(tx, {
          eventType: AuditLogEvent.SiteConfigUpdate,
          delta: {
            before: site,
            after: updatedSite,
          },
          by: user,
          siteId,
        })

        await publishSiteConfig(ctx.user.id, { site }, ctx.logger)

        return updatedSite
      })
    }),
  getTheme: protectedProcedure
    .input(getConfigSchema)
    .query(async ({ ctx, input: { id } }) => {
      await validateUserPermissionsForSite({
        siteId: id,
        userId: ctx.user.id,
        action: "read",
      })
      const theme = await getSiteTheme(id)
      return theme
    }),
  setTheme: protectedProcedure
    .input(setThemeSchema)
    .mutation(async ({ ctx, input: { siteId, theme } }) => {
      await validateUserPermissionsForSite({
        siteId,
        userId: ctx.user.id,
        action: "update",
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

        const newSite = await tx
          .updateTable("Site")
          .set({
            theme: jsonb(theme),
          })
          .where("id", "=", siteId)
          .returningAll()
          .executeTakeFirst()

        if (!newSite)
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to update site theme.",
          })

        await logConfigEvent(tx, {
          siteId,
          eventType: AuditLogEvent.SiteConfigUpdate,
          delta: {
            before: site,
            after: newSite,
          },
          by: user,
        })

        await publishSiteConfig(ctx.user.id, { site }, ctx.logger)
      })

      // NOTE: if the users update their `canvas.inverse`
      // we also need to update their searchsg theme settings
      if (
        site.config.search?.type === "searchSG" &&
        oldTheme.colors.brand.canvas.inverse !==
          theme.colors.brand.canvas.inverse
      ) {
        void updateSearchSGConfig(
          {
            colour: theme.colors.brand.canvas.inverse,
            _kind: "colour",
          },
          site.config.search.clientId,
          site.config.url,
        )
      }
    }),
  getFooter: protectedProcedure
    .input(getConfigSchema)
    .query(async ({ ctx, input: { id } }) => {
      await validateUserPermissionsForSite({
        siteId: id,
        userId: ctx.user.id,
        action: "read",
      })
      return getFooter(db, id)
    }),
  setFooter: protectedProcedure
    .input(setFooterSchema)
    .mutation(async ({ ctx, input: { siteId, footer } }) => {
      await validateUserPermissionsForSite({
        siteId,
        userId: ctx.user.id,
        action: "update",
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
          siteId,
          eventType: AuditLogEvent.FooterUpdate,
          delta: {
            before: oldFooter,
            after: newFooter,
          },
          by: user,
        })

        await publishSiteConfig(
          ctx.user.id,
          { site, footer: newFooter },
          ctx.logger,
        )
      })
    }),
  getNavbar: protectedProcedure
    .input(getConfigSchema)
    .query(async ({ ctx, input: { id } }) => {
      await validateUserPermissionsForSite({
        siteId: id,
        userId: ctx.user.id,
        action: "read",
      })
      return getNavBar(db, id)
    }),
  setNavbar: protectedProcedure
    .input(setNavbarSchema)
    .mutation(async ({ ctx, input: { siteId, navbar } }) => {
      await validateUserPermissionsForSite({
        siteId,
        userId: ctx.user.id,
        action: "update",
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
          siteId,
          eventType: AuditLogEvent.NavbarUpdate,
          delta: {
            before: oldNavbar,
            after: newNavbar,
          },
          by: user,
        })

        await publishSiteConfig(
          ctx.user.id,
          { site, navbar: newNavbar },
          ctx.logger,
        )
      })
    }),
  getLocalisedSitemap: protectedProcedure
    .input(getLocalisedSitemapSchema)
    .query(async ({ ctx, input: { siteId, resourceId } }) => {
      await validateUserPermissionsForSite({
        siteId,
        userId: ctx.user.id,
        action: "read",
      })
      return getLocalisedSitemap(siteId, resourceId)
    }),
  getNotification: protectedProcedure
    .input(getNotificationSchema)
    .query(async ({ ctx, input: { siteId } }) => {
      await validateUserPermissionsForSite({
        siteId,
        userId: ctx.user.id,
        action: "read",
      })

      return await getNotification(siteId)
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
        siteId,
        userId: ctx.user.id,
        action: "update",
      })

      const site = await db.transaction().execute(async () => {
        return await setSiteNotification({
          siteId,
          userId: ctx.user.id,
          notification,
        })
      })

      await publishSiteConfig(ctx.user.id, { site }, ctx.logger)

      return site.config.notification
    },
  ),
  setSiteConfigByAdmin: protectedProcedure
    .input(setSiteConfigByAdminSchema)
    .mutation(
      // TODO: Make use of the site config, navbar and footer JSON schemas to
      // validate the input JSON before parsing. Also ensure that existing site
      // configs in the database meets the schema requirements
      async ({ ctx, input: { siteId, config, theme, navbar, footer } }) => {
        await validateUserIsIsomerCoreAdmin({
          userId: ctx.user.id,
          gb: ctx.gb,
          roles: [ADMIN_ROLE.CORE, ADMIN_ROLE.MIGRATORS],
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
              config: jsonb(safeJsonParse(config) as IsomerSiteConfigProps),
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
            siteId,
            eventType: AuditLogEvent.SiteConfigUpdate,
            delta: {
              before: oldSite,
              after: newSite,
            },
            by: user,
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
            siteId,
            eventType: AuditLogEvent.NavbarUpdate,
            delta: {
              before: oldNavbar,
              after: newNavbar,
            },
            by: user,
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
            siteId,
            eventType: AuditLogEvent.FooterUpdate,
            delta: {
              before: oldFooter,
              after: newFooter,
            },
            by: user,
          })

          await publishSiteConfig(
            ctx.user.id,
            { site: newSite, navbar: newNavbar, footer: newFooter },
            ctx.logger,
          )
        })
      },
    ),
  create: protectedProcedure
    .input(createSiteSchema)
    .mutation(async ({ ctx, input: { siteName } }) => {
      await validateUserIsIsomerCoreAdmin({
        userId: ctx.user.id,
        gb: ctx.gb,
        roles: [ADMIN_ROLE.CORE],
      })

      return createSite({ siteName, userId: ctx.user.id })
    }),
  publish: protectedProcedure
    .input(publishSiteSchema)
    .mutation(async ({ ctx, input: { siteId } }) => {
      await validateUserIsIsomerCoreAdmin({
        userId: ctx.user.id,
        gb: ctx.gb,
        roles: [ADMIN_ROLE.CORE],
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

      return db.transaction().execute(async (tx) => {
        await logPublishEvent(tx, {
          by: byUser,
          eventType: AuditLogEvent.Publish,
          delta: { before: null, after: null },
          metadata: {},
          siteId,
        })
        await publishSite(ctx.logger, siteId)
      })
    }),
  publishAll: protectedProcedure.mutation(async ({ ctx }) => {
    await validateUserIsIsomerCoreAdmin({
      userId: ctx.user.id,
      gb: ctx.gb,
      roles: [ADMIN_ROLE.CORE],
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

    const sites = await db
      .selectFrom("Site")
      .selectAll()
      .where("codeBuildId", "is not", null)
      .execute()

    // Start background processing to not block the main thread and avoid timeouts
    void (async () => {
      // Looping intsead of Promise.all to avoid maxing out Prisma's connection pool
      for (const site of sites) {
        try {
          await db.transaction().execute(async (tx) => {
            await logPublishEvent(tx, {
              by: byUser,
              eventType: AuditLogEvent.Publish,
              delta: { before: null, after: null },
              metadata: {},
              siteId: site.id,
            })
            await publishSite(ctx.logger, site.id)
          })
        } catch (error) {
          ctx.logger.error({
            msg: "Failed to publish site",
            siteId: site.id,
            error,
          })
        }
      }
    })()

    return { siteCount: sites.length }
  }),
})
