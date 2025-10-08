import type { Static } from "@sinclair/typebox"
import { Type } from "@sinclair/typebox"

import type { IsomerSitemap } from "./sitemap"
import type { FooterSchemaType, NavbarSchemaType } from "~/interfaces"
import {
  AskgovSchema,
  LocalSearchSchema,
  SearchSGSearchSchema,
  VicaSchema,
} from "~/interfaces"
import { NotificationSchema } from "~/interfaces/internal/Notification"

export const AgencySettingsSchema = Type.Object({
  siteName: Type.String({
    title: "Site name",
    description:
      "This is displayed on browser tabs, the footer, and the Search Results page. It’s also the default meta title of your homepage.",
  }),
  agencyName: Type.Optional(
    Type.String({
      title: "Website is owned by",
      description: "This isn't displayed anywhere on your site",
      readOnly: true,
      tooltip: "To change the agency name, contact Isomer Support",
    }),
  ),
})

export const SiteConfigSchema = Type.Intersect([
  AgencySettingsSchema,
  Type.Object({
    url: Type.String({
      title: "Base URL of the site",
      description: "The base URL of the site.",
      format: "hidden",
    }),
    theme: Type.Union(
      [Type.Literal("isomer-classic"), Type.Literal("isomer-next")],
      {
        default: "isomer-next",
        format: "hidden",
      },
    ),
    logoUrl: Type.String({
      title: "Logo URL",
      description: "The URL of the logo to be displayed in the navbar.",
      format: "hidden",
    }),
    isGovernment: Type.Optional(
      Type.Boolean({
        title: "Is this a Government site?",
        description:
          "Whether the site is a Government site, affects the display of the masthead and the copyright footer.",
        format: "hidden",
      }),
    ),
    favicon: Type.Optional(
      Type.String({
        title: "Favicon URL",
        description:
          "The URL of the favicon to be displayed in the browser tab.",
        format: "hidden",
      }),
    ),
    search: Type.Optional(
      Type.Union([LocalSearchSchema, SearchSGSearchSchema], {
        title: "Search configuration",
        description: "Configuration for the search functionality of the site.",
        format: "hidden",
      }),
    ),
    notification: Type.Optional(NotificationSchema),
    siteGtmId: Type.Optional(
      Type.String({
        title: "Google Tag Manager ID",
        description:
          "The Google Tag Manager ID for the site, used for tracking and analytics.",
        format: "hidden",
      }),
    ),
    vica: Type.Optional(VicaSchema),
    askgov: Type.Optional(AskgovSchema),
  }),
])

export type IsomerSiteConfigProps = Static<typeof SiteConfigSchema>

export interface IsomerGeneratedSiteProps {
  siteMap: IsomerSitemap
  environment?: string
  lastUpdated: string
  assetsBaseUrl?: string
  isomerGtmId?: string
}

export interface IsomerSiteWideComponentsProps {
  navbar: NavbarSchemaType
  footerItems: FooterSchemaType
}

export type IsomerSiteProps = IsomerGeneratedSiteProps &
  IsomerSiteWideComponentsProps &
  IsomerSiteConfigProps

export type AgencySettings = Static<typeof AgencySettingsSchema>
