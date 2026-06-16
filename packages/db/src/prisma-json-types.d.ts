/**
 * Loose ambient declaration of the `PrismaJson` global namespace, used only
 * so that `@isomer/db`'s generated Kysely types (which reference
 * `PrismaJson.X`) can typecheck inside this package without pulling in
 * studio-flavoured shape dependencies (`@opengovsg/isomer-components`,
 * `type-fest`).
 *
 * The PRECISE namespace declaration lives in `apps/studio/prisma/types.ts`
 * and is what shapes JSON column types at the use sites. Studio's TS project
 * picks up that file via its `**\/*.ts` include glob; this stub is only
 * visible inside this package's tsconfig include glob, so the two never
 * collide.
 */

/* oxlint-disable @typescript-eslint/no-namespace, @typescript-eslint/no-empty-object-type */
// Empty interfaces (rather than `unknown` aliases) so the generated
// `Json | null` column types don't trip oxlint's redundant-type-
// constituents rule inside this package. The precise JSON column
// shapes are declared in apps/studio/prisma/types.ts.
declare global {
  namespace PrismaJson {
    interface SiteJsonConfig {}
    interface SiteThemeJson {}
    interface BlobJsonContent {}
    interface NavbarJsonContent {}
    interface FooterJsonContent {}
    interface AuditLogDeltaJsonContent {}
  }
}

export {}
