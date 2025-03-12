/**
 * This type file is used by prisma-json-types-generator to generate typecasts for
 * Json columns in the database to use in the applications.
 * This is further used by the `kysely` and `kysely-prisma` libraries to generate
 * types for the query builder.
 */

import type {
  IsomerLayoutVariants as _IsomerLayoutVariants,
  IsomerPageSchemaType as _IsomerPageSchemaType,
  IsomerSchema as _IsomerSchema,
  IsomerSiteConfigProps as _IsomerSiteConfigProps,
  IsomerSiteThemeProps as _IsomerSiteThemeProps,
  IsomerSiteWideComponentsProps as _IsomerSiteWideComponentsProps,
} from "@opengovsg/isomer-components"
import type { Tagged } from "type-fest"

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace PrismaJson {
    // TODO: Rename all with XXXYYYJson instead of XXXJsonYYY
    type SiteJsonConfig = Tagged<_IsomerSiteConfigProps, "JSONB">
    type SiteThemeJson = Tagged<_IsomerSiteThemeProps, "JSONB">
    type CollectionThemeJson = Tagged<
      _IsomerLayoutVariants["collection"],
      "JSONB"
    >
    type BlobJsonContent = Tagged<_IsomerSchema, "JSONB">
    type NavbarJsonContent = Tagged<
      _IsomerSiteWideComponentsProps["navBarItems"],
      "JSONB"
    >
    type FooterJsonContent = Tagged<
      _IsomerSiteWideComponentsProps["footerItems"],
      "JSONB"
    >
    interface AuditLogDeltaJsonContent {
      before: Record<string, unknown> | null
      after: Record<string, unknown> | null
    }
  }
}
