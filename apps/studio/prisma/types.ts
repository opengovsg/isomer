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
  IsomerSiteThemeProps as _IsomerSiteThemeProps,
  IsomerSiteWideComponentsProps as _IsomerSiteWideComponentsProps,
} from "@opengovsg/isomer-components"
import type { Tagged } from "type-fest"

type AuditLogJsonValue =
  | string
  | number
  | boolean
  | null
  | Date
  | AuditLogJsonValue[]
  | AuditLogEntitySnapshot

export interface AuditLogEntitySnapshot {
  [key: string]: AuditLogJsonValue
}

export type AuditLogMetadata = AuditLogEntitySnapshot

declare global {
  // oxlint-disable-next-line @typescript-eslint/no-namespace
  namespace PrismaJson {
    // Deferred: Rename all with XXXYYYJson instead of XXXJsonYYY
    type SiteJsonConfig = Tagged<_IsomerSiteConfigProps, "JSONB">
    type SiteThemeJson = Tagged<_IsomerSiteThemeProps, "JSONB">
    type BlobJsonContent = Tagged<_IsomerSchema, "JSONB">
    type NavbarJsonContent = Tagged<
      _IsomerSiteWideComponentsProps["navbar"],
      "JSONB"
    >
    type FooterJsonContent = Tagged<
      _IsomerSiteWideComponentsProps["footerItems"],
      "JSONB"
    >
    interface CreateLogEvent {
      before: null
      after: AuditLogEntitySnapshot
    }
    interface DeleteLogEvent {
      before: AuditLogEntitySnapshot
      after: null
    }
    interface FullLogEvent {
      before: AuditLogEntitySnapshot
      after: AuditLogEntitySnapshot
    }
    interface PublishLogEvent {
      before: AuditLogEntitySnapshot | null
      after: AuditLogEntitySnapshot | null
    }
    type AuditLogDeltaJsonContent =
      | FullLogEvent
      | CreateLogEvent
      | DeleteLogEvent
      | PublishLogEvent
  }
}
