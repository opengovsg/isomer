import type { Static } from "@sinclair/typebox"
import type { FooterSchemaType, NavbarSchemaType } from "~/interfaces"
import { Type } from "@sinclair/typebox"
import { FAVICON_ACCEPTED_MIME_TYPE_MAPPING } from "~/constants/image"
import {
  AskgovSchema,
  EgazetteAlgoliaSearchSchema,
  generateImageSrcSchema,
  LocalSearchSchema,
  SearchSGSearchSchema,
  VicaSchema,
  ZendeskSchema,
} from "~/interfaces"
import { NotificationSettingsSchema } from "~/interfaces/internal/Notification"
import { GTM_ID_STRING_REGEX, NON_EMPTY_STRING_REGEX } from "~/utils/validation"

import type { IsomerSitemap } from "./sitemap"

export const SITE_ENTITY_TYPES = [
  "Organization",
  "GovernmentOrganization",
  "EducationalOrganization",
  "NGO",
] as const

export type SiteEntityType = (typeof SITE_ENTITY_TYPES)[number]

// NOTE: Change this to Type.Enum when we upgrade to TypeBox v1
const SiteEntityTypeSchema = Type.Unsafe<SiteEntityType>(
  Type.String({
    description:
      "Choose the Schema.org type that best describes the organisation that owns this site. Leave this blank to derive the type from whether this is a government site.",
    enum: SITE_ENTITY_TYPES,
    title: "Organisation type",
  }),
)

export const SiteEntitySettingsSchema = Type.Object(
  {
    address: Type.Optional(
      Type.Object(
        {
          addressCountry: Type.Optional(
            Type.String({
              description: "Use a two-letter country code, such as SG.",
              errorMessage: {
                pattern: "must be two letters, such as SG",
              },
              maxLength: 2,
              pattern: "^[A-Za-z]{2}$",
              title: "Country code",
            }),
          ),
          addressLocality: Type.Optional(
            Type.String({
              title: "City or locality",
            }),
          ),
          postalCode: Type.Optional(
            Type.String({
              title: "Postal code",
            }),
          ),
          streetAddress: Type.Optional(
            Type.String({
              description: "Include the building name and unit number, if any.",
              title: "Street address",
            }),
          ),
        },
        {
          description: "The organisation's primary physical address.",
          title: "Address",
        },
      ),
    ),
    contactPoint: Type.Optional(
      Type.Object(
        {
          contactType: Type.Optional(
            Type.String({
              description: "For example, customer service or media enquiries.",
              title: "Contact type",
            }),
          ),
          email: Type.Optional(
            Type.String({
              title: "Email address",
            }),
          ),
          telephone: Type.Optional(
            Type.String({
              description: "Include the country code, such as +65 6123 4567.",
              title: "Telephone",
            }),
          ),
        },
        {
          description:
            "The public contact details for the organisation. The contact page configured in the footer is also reused.",
          title: "Contact point",
        },
      ),
    ),
    description: Type.Optional(
      Type.String({
        description:
          "A short description of the organisation, not the website.",
        format: "textarea",
        title: "Organisation description",
      }),
    ),
    type: Type.Optional(SiteEntityTypeSchema),
  },
  {
    description:
      "Help search engines understand the organisation that owns this site.",
    format: "hidden",
    title: "Organisation structured data",
  },
)

export const AgencySettingsSchema = Type.Object({
  agencyName: Type.Optional(
    Type.String({
      description: "This isn't displayed anywhere on your site.",
      readOnly: true,
      title: "Website is owned by",
      tooltip: "To change the agency name, contact Isomer Support",
    }),
  ),
  siteEntity: Type.Optional(SiteEntitySettingsSchema),
  siteName: Type.String({
    description:
      "This is displayed on browser tabs, the footer, and the Search Results page. It’s also the default meta title of your homepage.",
    errorMessage: {
      pattern: "cannot be empty or contain only spaces",
    },
    pattern: NON_EMPTY_STRING_REGEX,
    title: "Site name",
  }),
})

export const SimpleIntegrationsSettingsSchema = Type.Object({
  search: Type.Optional(
    Type.Union(
      [LocalSearchSchema, SearchSGSearchSchema, EgazetteAlgoliaSearchSchema],
      {
        description: "Configuration for the search functionality of the site.",
        format: "searchsg",
        title: "Search configuration",
        // NOTE: Overriding the default `Union` with this because we should
        // not be showing the `localSearch` option to our agency users
      },
    ),
  ),
  siteGtmId: Type.Optional(
    Type.String({
      description:
        "You can locate your GTM ID on your Google Tag Manager account. It should start with “GTM-”.",
      pattern: GTM_ID_STRING_REGEX,
      title: "Google Tag Manager (GTM) ID",
    }),
  ),
})

export const ComplexIntegrationsSettingsSchema = Type.Object({
  askgov: Type.Optional(AskgovSchema),
  vica: Type.Optional(VicaSchema),
  zendesk: Type.Optional(ZendeskSchema),
})

export const IntegrationsSettingsSchema = Type.Intersect([
  ComplexIntegrationsSettingsSchema,
  SimpleIntegrationsSettingsSchema,
])

export const LogoSettingsSchema = Type.Object({
  favicon: Type.Optional(
    generateImageSrcSchema({
      allowedMimeTypeMappings: FAVICON_ACCEPTED_MIME_TYPE_MAPPING,
      description:
        "This appears on a browser tab to help people recognise your site. We recommend a minimum size of 24px by 24px, in .png or .svg format.",
      // NOTE: 20 kB
      maxSizeInBytes: 20_000,
      title: "Favicon",
    }),
  ),
  logoUrl: generateImageSrcSchema({
    description:
      "The logo appears on the navigation bar. It may also be used as a thumbnail if there’s no thumbnail set on a page.",
    title: "Logo",
  }),
})

export const SiteConfigSchema = Type.Intersect([
  AgencySettingsSchema,
  IntegrationsSettingsSchema,
  LogoSettingsSchema,
  Type.Object({
    isGovernment: Type.Optional(
      Type.Boolean({
        description:
          "Whether the site is a Government site, affects the display of the masthead and the copyright footer.",
        format: "hidden",
        title: "Is this a Government site?",
      }),
    ),
    theme: Type.Literal("isomer-next", {
      default: "isomer-next",
      format: "hidden",
    }),
    url: Type.String({
      description: "The base URL of the site.",
      format: "hidden",
      title: "Base URL of the site",
    }),
  }),
  NotificationSettingsSchema,
])

export type IsomerSiteConfigProps = Static<typeof SiteConfigSchema>

export interface IsomerGeneratedSiteProps {
  siteMap: IsomerSitemap
  environment?: string
  lastUpdated: string
  assetsBaseUrl?: string
  isomerMsClarityId?: string
}

export interface IsomerDerivedSiteProps {
  siteMapArray: IsomerSitemap[]
}

export interface IsomerSiteWideComponentsProps {
  navbar: NavbarSchemaType
  footerItems: FooterSchemaType
}

export type IsomerSiteProps = IsomerGeneratedSiteProps &
  IsomerDerivedSiteProps &
  IsomerSiteWideComponentsProps &
  IsomerSiteConfigProps

export type AgencySettings = Static<typeof AgencySettingsSchema>
export type SiteEntitySettings = Static<typeof SiteEntitySettingsSchema>
export type IntegrationsSettings = Static<typeof IntegrationsSettingsSchema>
export type SimpleIntegrationsSettings = Static<
  typeof SimpleIntegrationsSettingsSchema
>
export type ComplexIntegrationsSettings = Static<
  typeof ComplexIntegrationsSettingsSchema
>

export type ComplexIntegrations = keyof ComplexIntegrationsSettings
