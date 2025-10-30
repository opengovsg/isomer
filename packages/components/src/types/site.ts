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
import { NotificationSettingsSchema } from "~/interfaces/internal/Notification"

export const AgencySettingsSchema = Type.Object({
  siteName: Type.String({
    title: "Site name",
    description:
      "This is displayed on browser tabs, the footer, and the Search Results page. It’s also the default meta title of your homepage.",
  }),
  agencyName: Type.Optional(
    Type.String({
      title: "Website is owned by",
      description: "This isn't displayed anywhere on your site.",
      readOnly: true,
      tooltip: "To change the agency name, contact Isomer Support",
    }),
  ),
})

export const SimpleIntegrationsSettingsSchema = Type.Object({
  siteGtmId: Type.Optional(
    Type.String({
      title: "Google Tag Manager (GTM) ID",
      description:
        "You can locate your GTM ID on your Google Tag Manager account. It should start with “GTM-”.",
    }),
  ),
  search: Type.Optional(
    Type.Union([LocalSearchSchema, SearchSGSearchSchema], {
      title: "Search configuration",
      description: "Configuration for the search functionality of the site.",
      // NOTE: Overriding the default `Union` with this because we should
      // not be showing the `localSearch` option to our agency users
      format: "searchsg",
    }),
  ),
})

export const ComplexIntegrationsSettingsSchema = Type.Object({
  askgov: Type.Optional(AskgovSchema),
  vica: Type.Optional(VicaSchema),
})

export const IntegrationsSettingsSchema = Type.Intersect([
  ComplexIntegrationsSettingsSchema,
  SimpleIntegrationsSettingsSchema,
])

export const SiteConfigSchema = Type.Intersect([
  AgencySettingsSchema,
  IntegrationsSettingsSchema,
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
  }),
  NotificationSettingsSchema,
])

export type IsomerSiteConfigProps = Static<typeof SiteConfigSchema>

export interface IsomerGeneratedSiteProps {
  siteMap: IsomerSitemap
  environment?: string
  lastUpdated: string
  assetsBaseUrl?: string
  isomerGtmId?: string
  isomerMsClarityId?: string
  usePartytown?: boolean // for partial rollout and testing purposes, to remove once we verify it is working with no regressions
}

export interface IsomerSiteWideComponentsProps {
  navbar: NavbarSchemaType
  footerItems: FooterSchemaType
}

export type IsomerSiteProps = IsomerGeneratedSiteProps &
  IsomerSiteWideComponentsProps &
  IsomerSiteConfigProps

export type AgencySettings = Static<typeof AgencySettingsSchema>
export type IntegrationsSettings = Static<typeof IntegrationsSettingsSchema>
export type SimpleIntegrationsSettings = Static<
  typeof SimpleIntegrationsSettingsSchema
>
export type ComplexIntegrationsSettings = Static<
  typeof ComplexIntegrationsSettingsSchema
>

export type ComplexIntegrations = keyof ComplexIntegrationsSettings
