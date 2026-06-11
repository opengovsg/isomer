/**
 * Loose ambient declaration of the `PrismaJson` global namespace.
 *
 * The publishing tsconfig resolves `~generated/*` to `@isomer/db`'s generated
 * Kysely types (see tsconfig `paths`). Those generated types reference
 * `PrismaJson.X` JSON-column shapes whose precise declaration lives in
 * `apps/studio/prisma/types.ts` — which is outside this package's tsconfig
 * include glob. This stub mirrors `packages/db/src/prisma-json-types.d.ts` so
 * the generated types typecheck here without pulling in studio-flavoured shape
 * dependencies. It is typecheck-only; runtime resolution is unaffected.
 */

/* oxlint-disable @typescript-eslint/no-namespace, @typescript-eslint/no-empty-object-type */
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
