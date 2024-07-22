/**
 * This type file is used by prisma-json-types-generator to generate typecasts for
 * Json columns in the database to use in the applications.
 * This is further used by the `kysely` and `kysely-prisma` libraries to generate
 * types for the query builder.
 */

import type {
  IsomerPageSchemaType as _IsomerPageSchemaType,
  IsomerSchema as _IsomerSchema,
  IsomerSiteConfigProps as _IsomerSiteConfigProps,
  IsomerSiteWideComponentsProps as _IsomerSiteWideComponentsProps,
} from "@opengovsg/isomer-components"

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace PrismaJson {
    type SiteJsonConfig = _IsomerSiteConfigProps
    type BlobJsonContent = _IsomerSchema
    type NavbarJsonContent = _IsomerSiteWideComponentsProps["navBarItems"]
    type FooterJsonContent = _IsomerSiteWideComponentsProps["footerItems"]
  }
}
