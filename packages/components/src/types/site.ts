import type { Static } from "@sinclair/typebox"
import { Type } from "@sinclair/typebox"

import type { IsomerSitemap } from "./sitemap"
import type { FooterSchemaType, NavbarSchemaType } from "~/interfaces"
import {
  AskgovSchema,
  LocalSearchSchema,
  SearchSGSearchSchema,
  VicaSchema,
  WizgovSchema,
} from "~/interfaces"
import { NotificationSchema } from "~/interfaces/internal/Notification"

export const SiteConfigSchema = Type.Object({
  siteName: Type.String({
    title: "Name of the site",
    description: "The name of the site, displayed in the footer.",
  }),
  url: Type.String({
    title: "Base URL of the site",
    description: "The base URL of the site.",
  }),
  agencyName: Type.Optional(
    Type.String({
      title: "Agency name",
      description:
        "The name of the agency, displayed in the copyright footer for non-Government websites.",
    }),
  ),
  theme: Type.Union(
    [Type.Literal("isomer-classic"), Type.Literal("isomer-next")],
    { default: "isomer-next" },
  ),
  logoUrl: Type.String({
    title: "Logo URL",
    description: "The URL of the logo to be displayed in the navbar.",
  }),
  isGovernment: Type.Optional(
    Type.Boolean({
      title: "Is this a Government site?",
      description:
        "Whether the site is a Government site, affects the display of the masthead and the copyright footer.",
    }),
  ),
  favicon: Type.Optional(
    Type.String({
      title: "Favicon URL",
      description: "The URL of the favicon to be displayed in the browser tab.",
    }),
  ),
  search: Type.Optional(
    Type.Union([LocalSearchSchema, SearchSGSearchSchema], {
      title: "Search configuration",
      description: "Configuration for the search functionality of the site.",
    }),
  ),
  notification: Type.Optional(NotificationSchema),
  siteGtmId: Type.Optional(
    Type.String({
      title: "Google Tag Manager ID",
      description:
        "The Google Tag Manager ID for the site, used for tracking and analytics.",
    }),
  ),
  vica: Type.Optional(VicaSchema),
  wizgov: Type.Optional(WizgovSchema),
  askgov: Type.Optional(AskgovSchema),
})

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
