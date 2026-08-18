import type { Static } from "@sinclair/typebox"
import type { FooterSchemaType, NavbarSchemaType } from "~/interfaces"
import { Type } from "@sinclair/typebox"
import { FAVICON_ACCEPTED_MIME_TYPE_MAPPING } from "~/constants/image"
import {
  AskgovSchema,
  EgazetteAlgoliaSearchSchema,
  generateImageSrcSchema,
  IsomerString,
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

// TODO: Change this to Type.Enum when we upgrade to TypeBox v1
const SiteEntityTypeSchema = Type.Unsafe<SiteEntityType>(
  Type.String({
    title: "Organisation type",
    description:
      "Choose the Schema.org type that best describes the organisation that owns this site. Leave this blank to derive the type from whether this is a government site.",
    enum: SITE_ENTITY_TYPES,
  }),
)

export const SiteEntitySettingsSchema = Type.Object(
  {
    type: Type.Optional(SiteEntityTypeSchema),
    description: Type.Optional(
      Type.String({
        title: "Organisation description",
        description:
          "A short description of the organisation, not the website.",
        format: "textarea",
      }),
    ),
    address: Type.Optional(
      Type.Object(
        {
          streetAddress: Type.Optional(
            Type.String({
              title: "Street address",
              description: "Include the building name and unit number, if any.",
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
          addressCountry: Type.Optional(
            Type.String({
              title: "Country code",
              description: "Use a two-letter country code, such as SG.",
              maxLength: 2,
              pattern: "^[A-Za-z]{2}$",
              errorMessage: {
                pattern: "must be two letters, such as SG",
              },
            }),
          ),
        },
        {
          title: "Address",
          description: "The organisation's primary physical address.",
        },
      ),
    ),
    contactPoint: Type.Optional(
      Type.Object(
        {
          contactType: Type.Optional(
            Type.String({
              title: "Contact type",
              description: "For example, customer service or media enquiries.",
            }),
          ),
          telephone: Type.Optional(
            Type.String({
              title: "Telephone",
              description: "Include the country code, such as +65 6123 4567.",
            }),
          ),
          email: Type.Optional(
            Type.String({
              title: "Email address",
            }),
          ),
        },
        {
          title: "Contact point",
          description:
            "The public contact details for the organisation. The contact page configured in the footer is also reused.",
        },
      ),
    ),
  },
  {
    title: "Organisation structured data",
    description:
      "Help search engines understand the organisation that owns this site.",
  },
)

export const AgencySettingsSchema = Type.Object({
  siteName: IsomerString({
    title: "Site name",
    description:
      "This is displayed on browser tabs, the footer, and the Search Results page. It’s also the default meta title of your homepage.",
    pattern: NON_EMPTY_STRING_REGEX,
    errorMessage: {
      pattern: "cannot be empty or contain only spaces",
    },
  }),
  agencyName: Type.Optional(
    Type.String({
      title: "Website is owned by",
      description: "This isn't displayed anywhere on your site.",
      readOnly: true,
      tooltip: "To change the agency name, contact Isomer Support",
    }),
  ),
  siteEntity: Type.Optional(SiteEntitySettingsSchema),
})

export const SimpleIntegrationsSettingsSchema = Type.Object({
  siteGtmId: Type.Optional(
    Type.String({
      title: "Google Tag Manager (GTM) ID",
      description:
        "You can locate your GTM ID on your Google Tag Manager account. It should start with “GTM-”.",
      pattern: GTM_ID_STRING_REGEX,
    }),
  ),
  search: Type.Optional(
    Type.Union(
      [LocalSearchSchema, SearchSGSearchSchema, EgazetteAlgoliaSearchSchema],
      {
        title: "Search configuration",
        description: "Configuration for the search functionality of the site.",
        // NOTE: Overriding the default `Union` with this because we should
        // not be showing the `localSearch` option to our agency users
        format: "searchsg",
      },
    ),
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
  logoUrl: generateImageSrcSchema({
    title: "Logo",
    description:
      "The logo appears on the navigation bar. It may also be used as a thumbnail if there’s no thumbnail set on a page.",
  }),
  favicon: Type.Optional(
    generateImageSrcSchema({
      title: "Favicon",
      description:
        "This appears on a browser tab to help people recognise your site. We recommend a minimum size of 24px by 24px, in .png or .svg format.",
      allowedMimeTypeMappings: FAVICON_ACCEPTED_MIME_TYPE_MAPPING,
      maxSizeInBytes: 20000, // NOTE: 20 kB
    }),
  ),
})

export const SiteConfigSchema = Type.Intersect([
  AgencySettingsSchema,
  IntegrationsSettingsSchema,
  LogoSettingsSchema,
  Type.Object({
    url: Type.String({
      title: "Base URL of the site",
      description: "The base URL of the site.",
      format: "hidden",
    }),
    theme: Type.Literal("isomer-next", {
      default: "isomer-next",
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
