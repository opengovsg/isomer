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

/** Delete a single resource row created during a test. */
export const deleteResource = (resourceId: string) =>
  db.deleteFrom("Resource").where("id", "=", resourceId).execute()

/** Delete resources on a site whose title matches a SQL LIKE pattern. */
export const deleteResourcesByTitleLike = (
  siteId: number,
  titlePattern: string,
) =>
  db
    .deleteFrom("Resource")
    .where("siteId", "=", siteId)
    .where("title", "like", titlePattern)
    .execute()

// Defaults mirror tests/integration/helpers/seed/index.ts setupSite().
const DEFAULT_NAVBAR_CONTENT = {
  items: [
    {
      url: "/item-one",
      name: "Expandable nav item",
      items: [
        {
          url: "/item-one/pa-network-one",
          name: "PA's network one",
          description: "Click here and brace yourself for mild disappointment.",
        },
        {
          url: "/item-one/pa-network-two",
          name: "PA's network two",
          description: "Click here and brace yourself for mild disappointment.",
        },
        {
          url: "/item-one/pa-network-three",
          name: "PA's network three",
        },
        {
          url: "/item-one/pa-network-four",
          name: "PA's network four",
          description:
            "Click here and brace yourself for mild disappointment. This one has a pretty long one",
        },
        {
          url: "/item-one/pa-network-five",
          name: "PA's network five",
          description:
            "Click here and brace yourself for mild disappointment. This one has a pretty long one",
        },
        {
          url: "/item-one/pa-network-six",
          name: "PA's network six",
          description: "Click here and brace yourself for mild disappointment.",
        },
      ],
    },
  ],
}

const DEFAULT_FOOTER_CONTENT = {
  siteNavItems: [
    { url: "/about", title: "About us" },
    { url: "/partners", title: "Our partners" },
    { url: "/grants-and-programmes", title: "Grants and programmes" },
    { url: "/contact-us", title: "Contact us" },
    { url: "/something-else", title: "Something else" },
    { url: "/resources", title: "Resources" },
  ],
  contactUsLink: "/contact-us",
  termsOfUseLink: "/terms-of-use",
  feedbackFormLink: "https://www.form.gov.sg",
  privacyStatementLink: "/privacy",
}

/** Restore navbar content to the provisioned-site default. */
export const resetSiteNavbar = (siteId: number) =>
  db
    .updateTable("Navbar")
    .set({ content: jsonb(DEFAULT_NAVBAR_CONTENT) })
    .where("siteId", "=", siteId)
    .execute()

/** Seed 8 top-level navbar items (the schema's maxItems) for max-limit tests. */
export const resetSiteNavbarAtMaxItems = (siteId: number) =>
  db
    .updateTable("Navbar")
    .set({
      content: jsonb({
        items: Array.from({ length: 8 }, (_, i) => ({
          name: `Max item ${i + 1}`,
          url: `/max-item-${i + 1}`,
        })),
      }),
    })
    .where("siteId", "=", siteId)
    .execute()

/** Restore footer content to the provisioned-site default. */
export const resetSiteFooter = (siteId: number) =>
  db
    .updateTable("Footer")
    .set({ content: jsonb(DEFAULT_FOOTER_CONTENT) })
    .where("siteId", "=", siteId)
    .execute()

/** Seed footer column 1 with 8 links (the schema's maxItems) for max-limit tests. */
export const resetSiteFooterColumn1AtMaxItems = (siteId: number) =>
  db
    .updateTable("Footer")
    .set({
      content: jsonb({
        ...DEFAULT_FOOTER_CONTENT,
        siteNavItems: Array.from({ length: 8 }, (_, i) => ({
          url: `/max-item-${i + 1}`,
          title: `Max item ${i + 1}`,
        })),
      }),
    })
    .where("siteId", "=", siteId)
    .execute()

/** Clear integration fields from site config for integrations settings tests. */
export const resetSiteIntegrations = async (siteId: number) => {
  const site = await db
    .selectFrom("Site")
    .where("id", "=", siteId)
    .select("config")
    .executeTakeFirstOrThrow()

  const config = site.config as IsomerSiteConfigProps & {
    siteGtmId?: string
    askgov?: unknown
    vica?: unknown
    search?: unknown
  }

  const {
    siteGtmId: _siteGtmId,
    askgov: _askgov,
    vica: _vica,
    search: _search,
    ...rest
  } = config

  await db
    .updateTable("Site")
    .set({ config: jsonb(rest) })
    .where("id", "=", siteId)
    .execute()
}

/** Reset logo and favicon fields in site config. */
export const resetSiteLogoSettings = async (siteId: number) => {
  const site = await db
    .selectFrom("Site")
    .where("id", "=", siteId)
    .select("config")
    .executeTakeFirstOrThrow()

  const config = site.config as IsomerSiteConfigProps & {
    favicon?: string
  }

  const { favicon: _favicon, ...rest } = config

  await db
    .updateTable("Site")
    .set({ config: jsonb({ ...rest, logoUrl: "" }) })
    .where("id", "=", siteId)
    .execute()
}

/** Remove all redirects for a site (used between mutating redirect tests). */
export const resetSiteRedirects = (siteId: number) =>
  db.deleteFrom("Redirect").where("siteId", "=", siteId).execute()
