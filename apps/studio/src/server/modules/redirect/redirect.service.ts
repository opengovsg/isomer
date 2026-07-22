import type {
  RedirectValidationIssue,
  RedirectValidationResult,
} from "~/constants/redirect"
import type {
  BulkRedirectsCsvInput,
  CountRedirectsByDestinationInput,
  CountRedirectsInput,
  CreateRedirectInput,
  DeleteRedirectInput,
  GetRedirectBySourceInput,
  ListRedirectsInput,
  RedirectSortField,
  ResolveRedirectReferencesInput,
} from "~/schemas/redirect"
import type { DB } from "~prisma/generated/generatedTypes"
import {
  getResourceIdFromReferenceLink,
  REFERENCE_LINK_REGEX,
} from "@opengovsg/isomer-components"
import { TRPCError } from "@trpc/server"
import { sql } from "kysely"
import { chunk, get } from "lodash-es"
import {
  BULK_DUPLICATE_SOURCE_MESSAGE,
  BULK_MALFORMED_ROW_MESSAGE,
  REDIRECT_MESSAGES,
  RedirectValidationCode,
} from "~/constants/redirect"
import { parseRedirectCsv } from "~/lib/redirectCsv"
import {
  isValidExternalDestination,
  normalizeRedirectPath,
  normalizeRedirectSource,
  redirectRowSchema,
} from "~/schemas/redirect"
import { getReferenceLink } from "~/utils/link"
import { ResourceType } from "~prisma/generated/generatedEnums"

import type { Logger } from "@isomer/logging"

import type { SafeKysely, Transaction } from "../database"
import { logPublishEvent, logRedirectEvent } from "../audit/audit.service"
import { publishSite } from "../aws/codebuild.service"
import { AuditLogEvent, db } from "../database"
import { PG_ERROR_CODES } from "../database/constants"
import {
  getDescendantResourceIds,
  getResourceByFullPermalink,
  getResourceFullPermalinks,
  getResourceIdByPermalink,
  getResourceIdsByPermalinks,
} from "../resource/resource.service"

// Sort field → column. `publishedAt` maps to `createdAt`; `satisfies` keeps the
// map exhaustive so a new sort field without a column is a compile error.
const SORT_FIELD_TO_COLUMN = {
  source: "source",
  destination: "destination",
  publishedAt: "createdAt",
} as const satisfies Record<
  RedirectSortField,
  "source" | "destination" | "createdAt"
>

// Anchored form of the shared [resource:siteId:resourceId] reference, capturing
// siteId/resourceId (the shared regex is unanchored). A value only counts as a
// reference when it is exactly one.
const REFERENCE_DESTINATION_REGEX = new RegExp(
  `^${REFERENCE_LINK_REGEX.source}$`,
)

// Write timestamps with the database clock, matching the columns' @default(now()).
// A JS `new Date()` is serialized by the pg driver in the Node process's local
// timezone; because these are `timestamp without time zone` columns, Postgres
// stores that local wall-clock verbatim — so a value written as new Date() lands
// hours off from the UTC that the now() default writes on a fresh insert. Using
// now() server-side keeps every createdAt/deletedAt consistent and in UTC.
const dbNow = sql<Date>`now()`

// A destination is exactly one of three shapes. The `type` discriminant keeps
// the branches in resolveDestinationForStorage explicit instead of a chain of
// string checks.
type ParsedDestination =
  | { type: "reference"; value: string }
  | { type: "external"; value: string }
  | { type: "internalPath"; value: string }

const parseDestination = (destination: string): ParsedDestination => {
  if (REFERENCE_DESTINATION_REGEX.test(destination)) {
    return { type: "reference", value: destination }
  }
  if (destination.startsWith("/")) {
    return { type: "internalPath", value: destination }
  }
  return { type: "external", value: destination }
}

// Resolves a destination to its stored form. A bare internal path becomes a
// [resource:...] reference (so it follows page renames, and starts working once
// the page is published); references and external URLs are stored verbatim. A
// path that can't map to a single resource — a query- or fragment-suffixed path,
// or one with no matching resource at all — stays literal. A resource that
// exists but is unpublished still resolves to a reference: the preflight warns
// it isn't live yet, and the published redirect rules only include it once it is.
const resolveDestinationForStorage = async (
  siteId: number,
  destination: string,
): Promise<string> => {
  const parsed = parseDestination(destination)
  switch (parsed.type) {
    case "reference":
    case "external":
      return parsed.value
    case "internalPath": {
      if (parsed.value.includes("?") || parsed.value.includes("#")) {
        return parsed.value
      }
      const resourceId = await getResourceIdByPermalink(siteId, parsed.value)
      // No resource at this path — keep the literal path; the preflight warns.
      if (resourceId === null) {
        return parsed.value
      }
      return getReferenceLink({
        siteId: String(siteId),
        resourceId: String(resourceId),
      })
    }
  }
}

// Batch publish-state for a set of resource ids. A Page/CollectionPage is live
// when it has a published version; a Folder/Collection is served by its
// IndexPage, so it's live when that index page is published (mirrors
// getResourceByFullPermalink's container handling).
const getPublishedStateByResourceIds = async (
  siteId: number,
  resourceIds: number[],
): Promise<Map<number, boolean>> => {
  const result = new Map<number, boolean>()
  if (resourceIds.length === 0) {
    return result
  }
  const ids = resourceIds.map(String)
  const resources = await db
    .selectFrom("Resource")
    .where("Resource.siteId", "=", siteId)
    .where("Resource.id", "in", ids)
    .select(["Resource.id", "Resource.type", "Resource.publishedVersionId"])
    .execute()

  const containerIds = resources
    .filter(
      (r) =>
        r.type === ResourceType.Folder || r.type === ResourceType.Collection,
    )
    .map((r) => String(r.id))
  const publishedByContainerId = new Map<string, boolean>()
  if (containerIds.length > 0) {
    const indexPages = await db
      .selectFrom("Resource")
      .where("Resource.siteId", "=", siteId)
      .where("Resource.parentId", "in", containerIds)
      .where("Resource.type", "=", ResourceType.IndexPage)
      .select(["Resource.parentId", "Resource.publishedVersionId"])
      .execute()
    for (const indexPage of indexPages) {
      publishedByContainerId.set(
        String(indexPage.parentId),
        indexPage.publishedVersionId !== null,
      )
    }
  }

  for (const resource of resources) {
    const isContainer =
      resource.type === ResourceType.Folder ||
      resource.type === ResourceType.Collection
    result.set(
      Number(resource.id),
      isContainer
        ? (publishedByContainerId.get(String(resource.id)) ?? false)
        : resource.publishedVersionId !== null,
    )
  }
  return result
}

// Strips a "?query"/"#fragment" off a path, leaving the bare path before the
// first "?" or "#". A redirect source is always a clean path, so a destination
// like "/b?x" has to compare as "/b" — both when resolving it for display and
// when matching it against sources for loop detection.
const stripQueryFragment = (value: string) => value.split(/[?#]/)[0] ?? value

// Resolves stored internal destinations (both [resource:...] references and
// literal "/paths") for the table. For references it returns the destination
// page's current permalink for display (null if the page is gone). `warn` is
// true when the destination doesn't resolve to a published page — i.e. it's
// missing (no such page/folder) or exists but isn't published yet — so the
// table can flag redirects that currently lead nowhere. External URLs never
// warn. Input keeps the `references` name but accepts any internal destination.
export const resolveRedirectReferences = async ({
  siteId,
  references,
}: ResolveRedirectReferencesInput): Promise<
  { reference: string; permalink: string | null; warn: boolean }[]
> => {
  // Classify each destination synchronously. References are anchored AND must
  // belong to this site; a cross-site reference can't resolve here. Literal
  // paths carry their bare path so they can be resolved together in one batch
  // (rather than a DB round-trip each).
  const classified = references.map((reference) => {
    const match = REFERENCE_DESTINATION_REGEX.exec(reference)
    if (match) {
      const resourceId = Number(match[1]) === siteId ? Number(match[2]) : null
      return { reference, kind: "reference" as const, resourceId, path: null }
    }
    if (reference.startsWith("/")) {
      return {
        reference,
        kind: "literal" as const,
        resourceId: null,
        path: stripQueryFragment(reference),
      }
    }
    return {
      reference,
      kind: "external" as const,
      resourceId: null,
      path: null,
    }
  })

  const idByPath = await getResourceIdsByPermalinks(
    siteId,
    classified.flatMap(({ path }) => (path !== null ? [path] : [])),
  )

  const parsed = classified.map(({ reference, kind, resourceId, path }) => ({
    reference,
    kind,
    resourceId: path !== null ? (idByPath.get(path) ?? null) : resourceId,
  }))

  const resourceIds = parsed
    .map(({ resourceId }) => resourceId)
    .filter((id): id is number => id !== null)
  const [permalinks, publishedState] = await Promise.all([
    getResourceFullPermalinks(siteId, resourceIds),
    getPublishedStateByResourceIds(siteId, resourceIds),
  ])

  return parsed.map(({ reference, kind, resourceId }) => {
    if (kind === "external") {
      return { reference, permalink: null, warn: false }
    }
    // Only references render the resolved permalink; a literal path shows as
    // typed, so its display permalink stays null.
    const permalink =
      kind === "reference" && resourceId !== null
        ? (permalinks.get(resourceId) ?? null)
        : null
    // Warn when the internal destination has no published page behind it: the
    // resource is missing (no id, or a reference whose page was deleted) or it
    // exists but isn't published yet.
    const isMissing =
      resourceId === null || (kind === "reference" && permalink === null)
    const warn = isMissing || !(publishedState.get(resourceId ?? -1) ?? false)
    return { reference, permalink, warn }
  })
}

const getByUser = async (byUserId: string) =>
  db
    .selectFrom("User")
    .selectAll()
    .where("id", "=", byUserId)
    .executeTakeFirstOrThrow(
      () =>
        new TRPCError({
          code: "BAD_REQUEST",
          message: "Please ensure that you are logged in!",
        }),
    )

const getLiveRedirectBySource = (
  dbInstance: SafeKysely,
  { siteId, source }: { siteId: number; source: string },
) =>
  dbInstance
    .selectFrom("Redirect")
    .selectAll()
    .where("siteId", "=", siteId)
    .where("source", "=", source)
    .where("deletedAt", "is", null)
    .executeTakeFirst()

// Resolves a stored destination to a comparable/displayable path: a reference
// to the page's current permalink, a literal path normalised, an external URL
// (or a reference to a missing page) verbatim.
const resolveStoredDestination = async (
  siteId: number,
  storedDestination: string,
): Promise<string> => {
  if (storedDestination.startsWith("/")) {
    return normalizeRedirectPath(storedDestination)
  }
  const resourceId = getResourceIdFromReferenceLink(storedDestination)
  if (resourceId === "") {
    // Not an internal path and not a `[resource:...]` reference, so the only
    // remaining valid shape is an external https URL (the form destinations are
    // validated into on write). Assert it rather than silently returning the
    // raw string — if a new destination format is ever added without updating
    // this resolver, this surfaces the gap loudly instead of leaking an
    // unresolved value into comparisons and the UI.
    if (!isValidExternalDestination(storedDestination)) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: `Unrecognised redirect destination format: ${storedDestination}`,
      })
    }
    return storedDestination
  }
  const permalinks = await getResourceFullPermalinks(siteId, [
    Number(resourceId),
  ])
  return permalinks.get(Number(resourceId)) ?? storedDestination
}

// Detects whether adding `source -> destination` would chain into, or close a
// loop with, an existing redirect — looking exactly one hop deep. If the
// destination is itself the source of a live redirect, that redirect's resolved
// target is the next hop; the new redirect closes a loop when that target
// resolves back to `source` (the mirror pair `/a -> /b` while `/b -> /a`).
// Longer cycles (`/a -> /b -> /c -> /a`) are intentionally not chased — they're
// rare, and the single-hop check keeps this to one extra read while still
// surfacing the immediate next hop as a non-looping chain warning. Stored
// destinations may be `[resource:...]` references, resolved to the page's
// current permalink before comparing. Only internal paths chain; an external
// https destination never matches a source. `source` is assumed already
// normalised (lowercased), so the destination is normalised the same way before
// it is looked up as a source.
const getChainedRedirect = async (
  dbInstance: SafeKysely,
  {
    siteId,
    source,
    destination,
  }: { siteId: number; source: string; destination: string },
) => {
  if (!destination.startsWith("/")) {
    return null
  }
  const normalizedDestination = normalizeRedirectSource(destination)
  const redirect = await getLiveRedirectBySource(dbInstance, {
    siteId,
    source: normalizedDestination,
  })
  if (!redirect) {
    return null
  }

  const target = await resolveStoredDestination(siteId, redirect.destination)
  // The new redirect closes a loop when the existing redirect's (internal)
  // target normalises back to `source`; an external target can never match.
  const isLoop =
    target.startsWith("/") && normalizeRedirectSource(target) === source

  return { redirect, normalizedDestination, target, isLoop }
}

// Preflight for redirect.create: returns blocking errors without mutating.
// Advisory only — create re-enforces every error. Destination-liveness is no
// longer warned here; the table flags not-yet-published destinations instead.
export const validateRedirect = async ({
  siteId,
  source,
  destination,
}: CreateRedirectInput): Promise<RedirectValidationResult> => {
  const errors: RedirectValidationIssue[] = []

  // Recreating a live redirect for the same source is not allowed — the user
  // must delete the existing one first.
  const existing = await getLiveRedirectBySource(db, { siteId, source })
  if (existing) {
    errors.push({
      code: RedirectValidationCode.AlreadyExists,
      message: REDIRECT_MESSAGES.alreadyExists,
    })
  }

  // A redirect whose source is a published page's live URL would shadow that
  // page, so block it. Resolves a folder/collection to its index page, so a
  // live container is caught too. Only published resources block — an
  // unpublished page isn't live yet, and publishing it later is guarded on the
  // page side.
  const pageAtSource = await getResourceByFullPermalink({
    siteId,
    fullPermalink: source,
  })
  if (pageAtSource && pageAtSource.publishedVersionId !== null) {
    errors.push({
      code: RedirectValidationCode.SourceIsExistingPage,
      message: REDIRECT_MESSAGES.sourceIsExistingPage,
    })
  }

  const chained = await getChainedRedirect(db, { siteId, source, destination })
  if (chained?.isLoop) {
    errors.push({
      code: RedirectValidationCode.RedirectLoop,
      message: REDIRECT_MESSAGES.loop,
      description: `${chained.normalizedDestination} already redirects to ${source}. Visitors will get stuck in between pages. Delete existing redirects or direct to a different page.`,
    })
  }

  return { errors }
}

export const listRedirects = async ({
  siteId,
  sortBy,
  sortDirection,
  limit,
  offset,
}: ListRedirectsInput) => {
  // Live rows only; createdAt is the publish time (creates publish immediately).
  let query = db
    .selectFrom("Redirect")
    .select(["id", "source", "destination", "createdAt as publishedAt"])
    .where("siteId", "=", siteId)
    .where("deletedAt", "is", null)
    .orderBy(SORT_FIELD_TO_COLUMN[sortBy], sortDirection)

  // Tie-break on `source`, then `id` (unique), so equal-valued rows keep a
  // stable order across paginated requests.
  if (sortBy !== "source") {
    query = query.orderBy("source", sortDirection)
  }

  return query
    .orderBy("id", sortDirection)
    .limit(limit)
    .offset(offset)
    .execute()
}

export const countRedirects = async ({ siteId }: CountRedirectsInput) => {
  const { count } = await db
    .selectFrom("Redirect")
    .select((eb) => eb.fn.countAll().as("count"))
    .where("siteId", "=", siteId)
    .where("deletedAt", "is", null)
    .executeTakeFirstOrThrow()
  return Number(count)
}

export const createRedirect = async ({
  siteId,
  source,
  destination,
  byUserId,
  logger,
}: CreateRedirectInput & {
  byUserId: string
  logger: Logger<string>
}) => {
  const byUser = await getByUser(byUserId)

  const created = await db
    .transaction()
    .execute(async (tx) => {
      // Bound the wait for the lock so a stalled holder can't block this write
      // indefinitely; the wait aborts as a retryable CONFLICT (see the .catch).
      await sql`SET LOCAL lock_timeout = ${sql.lit(REDIRECT_LOCK_TIMEOUT_MS)}`.execute(
        tx,
      )
      // Serialise redirect writes for this site (the same lock bulkCreateRedirects
      // takes), so a single create and a concurrent bulk create can't each miss
      // the other's uncommitted row in the loop/shadow guards below and both
      // publish a loop. Released automatically at commit/rollback.
      await sql`SELECT pg_advisory_xact_lock(${REDIRECT_WRITE_LOCK_NAMESPACE}, ${siteId})`.execute(
        tx,
      )

      // Reject creating over a live redirect. A soft-deleted row for the same
      // source still holds the (siteId, source) unique constraint and is revived
      // by the upsert below.
      const existing = await tx
        .selectFrom("Redirect")
        .selectAll()
        .where("siteId", "=", siteId)
        .where("source", "=", source)
        .executeTakeFirst()
      if (existing && existing.deletedAt === null) {
        throw new TRPCError({
          code: "CONFLICT",
          message: `A redirect already exists for ${source}`,
        })
      }

      // Re-enforce the no-loop rule server-side; the preflight is advisory. The
      // per-site advisory lock above serialises redirect writes, so a concurrent
      // create can't slip the other half of a mirror pair (/a->/b and /b->/a)
      // past this read — the later writer waits, then sees the committed row.
      const chained = await getChainedRedirect(tx, {
        siteId,
        source,
        destination,
      })
      if (chained?.isLoop) {
        // UNPROCESSABLE_CONTENT is reserved for the loop guard — the form maps it
        // to the loop message on the destination field; don't reuse it elsewhere.
        throw new TRPCError({
          code: "UNPROCESSABLE_CONTENT",
          message: REDIRECT_MESSAGES.loop,
        })
      }

      // Re-enforce the source-vs-published-page guard (a published page or live
      // folder/collection at this URL would be shadowed). A page publish doesn't
      // take the redirect lock, so this plain read can still race one going live
      // — accepted, since a redirect shadowing a page is recoverable by deleting
      // it. PRECONDITION_FAILED keeps it distinct from the already-exists CONFLICT.
      const pageAtSource = await getResourceByFullPermalink({
        siteId,
        fullPermalink: source,
      })
      if (pageAtSource && pageAtSource.publishedVersionId !== null) {
        throw new TRPCError({
          code: "PRECONDITION_FAILED",
          message: REDIRECT_MESSAGES.sourceIsExistingPage,
        })
      }

      // Resolve an internal-path destination to a [resource:...] reference (so it
      // follows page renames); a path with no live page yet is kept literal (the
      // preflight already warned). Never blocks the create.
      const storedDestination = await resolveDestinationForStorage(
        siteId,
        destination,
      )

      const created = await tx
        .insertInto("Redirect")
        .values({ siteId, source, destination: storedDestination })
        .onConflict((oc) =>
          oc
            .columns(["siteId", "source"])
            .doUpdateSet({
              destination: storedDestination,
              deletedAt: null,
              // Revived rows republish now, so refresh createdAt (the publish
              // time shown to users).
              createdAt: dbNow,
            })
            // Only soft-deleted rows may be revived; a concurrent live create
            // must surface as a conflict, not silently overwrite.
            .where("Redirect.deletedAt", "is not", null),
        )
        .returningAll()
        // A null row means the upsert skipped a live redirect — a conflict.
        .executeTakeFirstOrThrow(
          () =>
            new TRPCError({
              code: "CONFLICT",
              message: `A redirect already exists for ${source}`,
            }),
        )

      // delta holds the real before/after rows committed.
      await logRedirectEvent(tx, {
        siteId,
        by: byUser,
        eventType: AuditLogEvent.RedirectCreate,
        delta: { before: existing ?? null, after: created },
      })

      // Every mutation republishes the site; audited as a separate Publish event.
      await logPublishEvent(tx, {
        siteId,
        by: byUser,
        delta: { before: null, after: null },
        eventType: AuditLogEvent.Publish,
        metadata: { redirects: { created: [created] } },
      })

      return created
    })
    .catch(rethrowLockTimeoutAsConflict)

  // Publish after the transaction commits so the external CodeBuild call is off
  // the row locks and a failed publish can't roll back a saved redirect
  // (mirrors publishPageResource's two-step publish).
  await publishSite(logger, { siteId })

  return created
}

// ---------------------------------------------------------------------------
// Bulk upload (CSV)
// ---------------------------------------------------------------------------

// Rows are inserted in chunks so a large upload doesn't build one enormous
// INSERT (mirrors the migration script's chunking). Postgres also caps a
// statement at 65535 bind parameters, so the chunk keeps every batched insert
// (redirects and their audit rows) well under that.
const BULK_REDIRECT_INSERT_CHUNK_SIZE = 500

// Arbitrary namespace for the per-site advisory lock that serialises redirect
// writes (single create + bulk create) so their loop/shadow rechecks can't race
// each other. There is no other advisory-lock user, but the two-key form keeps
// this from ever colliding with a future one; pg_advisory_xact_lock releases
// automatically when the transaction ends.
const REDIRECT_WRITE_LOCK_NAMESPACE = 0x5244 // "RD"

// Cap how long a redirect write waits for the per-site advisory lock. A writer
// that waits longer aborts (Postgres 55P03) rather than blocking indefinitely on
// a stalled holder and tying up a pooled connection. 15s is well above the
// lock's normal hold time — it only covers the in-transaction DB work, since
// publishSite runs after commit.
const REDIRECT_LOCK_TIMEOUT_MS = 15_000

// Shown when a write aborts on that timeout: another redirect write for the same
// site is in flight, so the caller just retries.
const REDIRECT_WRITE_BUSY_MESSAGE =
  "Another change to this site's redirects is in progress. Please try again."

// True when a query aborted waiting for a lock — here, the advisory lock's
// lock_timeout firing.
const isLockTimeoutError = (error: unknown): boolean =>
  get(error, "code") === PG_ERROR_CODES.lockTimeout

// Rethrow a lock-timeout wait as a retryable CONFLICT; pass everything else
// through unchanged (so the transaction's own TRPCErrors keep their codes).
const rethrowLockTimeoutAsConflict = (error: unknown): never => {
  if (isLockTimeoutError(error)) {
    throw new TRPCError({
      code: "CONFLICT",
      message: REDIRECT_WRITE_BUSY_MESSAGE,
    })
  }
  throw error
}

// Thrown inside the bulk insert when a source stopped being publishable between
// validation and the insert — either it gained a live redirect (the upsert
// skipped it, a shortfall) or a page was published at it (the in-txn recheck).
// bulkCreate catches it to re-validate and return fresh row verdicts rather than
// surface a generic failure.
class BulkRedirectRaceError extends Error {}

// One row after evaluation: the values as the editor typed them (for the errors
// file + preview), the normalized values (for the DB checks + insert), and the
// single chosen error (null when the row passed).
interface EvaluatedRedirectRow {
  rowNumber: number
  source: string
  destination: string
  normalizedSource: string | null
  normalizedDestination: string | null
  error: string | null
}

// Public per-row verdict returned to the client (drops the internal normalized
// values). Ordered as parsed; the client sorts errors first for the errors file.
export interface BulkRedirectRowResult {
  rowNumber: number
  source: string
  destination: string
  error: string | null
}

export interface BulkRedirectValidationResult {
  // A file-level problem (empty / missing column / unreadable / too big) that
  // stops evaluation before any row is checked; null when the file parsed.
  fileError: string | null
  rows: BulkRedirectRowResult[]
  validCount: number
  errorCount: number
}

// Resolves stored redirect destinations to the source-comparable path they
// point at (for loop detection): an internal path normalized as a source, a
// [resource:...] reference resolved to the page's current permalink, everything
// else (external URL, missing/cross-site reference) to null (never chains).
// References are resolved in one batch rather than a query each.
const resolveStoredDestinationsToSources = async (
  siteId: number,
  storedDestinations: string[],
): Promise<Map<string, string | null>> => {
  const result = new Map<string, string | null>()
  const referenceIdByDestination = new Map<string, number>()
  for (const destination of new Set(storedDestinations)) {
    if (destination.startsWith("/")) {
      // Compare against sources by the bare path: a source can't carry "?"/"#",
      // so "/b?x" must resolve to the "/b" node or a /a->/b?x, /b->/a loop is
      // missed (a request to /b?x still matches the /b source rule).
      result.set(
        destination,
        normalizeRedirectSource(stripQueryFragment(destination)),
      )
      continue
    }
    const match = REFERENCE_DESTINATION_REGEX.exec(destination)
    if (match && Number(match[1]) === siteId) {
      referenceIdByDestination.set(destination, Number(match[2]))
      continue
    }
    result.set(destination, null)
  }

  const referenceIds = [...referenceIdByDestination.values()]
  const permalinks = referenceIds.length
    ? await getResourceFullPermalinks(siteId, referenceIds)
    : new Map<number, string>()
  for (const [destination, resourceId] of referenceIdByDestination) {
    const permalink = permalinks.get(resourceId)
    result.set(
      destination,
      permalink ? normalizeRedirectSource(permalink) : null,
    )
  }
  return result
}

// Batched form of resolveDestinationForStorage: an internal path that maps to a
// resource becomes a [resource:...] reference; a query/fragment path or a path
// with no matching resource stays literal; references and external URLs are
// stored verbatim. Resolves every internal path in one query rather than one per
// row, at the cost of matching getResourceIdsByPermalinks' structural resolution
// (the container id itself, not via its index page — the canonical id the build
// remaps to anyway).
const resolveDestinationsForStorage = async (
  siteId: number,
  destinations: string[],
): Promise<Map<string, string>> => {
  const result = new Map<string, string>()
  // First pass resolves everything storable as-is (query/fragment paths,
  // external URLs, existing references) and sets those directly, collecting the
  // internal paths that still need a resource lookup. parseDestination returns
  // value === destination for an internal path, so the path doubles as the key.
  const internalPaths: string[] = []
  for (const destination of new Set(destinations)) {
    const parsed = parseDestination(destination)
    if (
      parsed.type !== "internalPath" ||
      parsed.value.includes("?") ||
      parsed.value.includes("#")
    ) {
      result.set(destination, destination)
      continue
    }
    internalPaths.push(parsed.value)
  }

  // Second pass resolves only those internal paths: each becomes a [resource:...]
  // reference when a resource lives at that permalink, or stays literal when none
  // does (a typo or an as-yet-uncreated page — it just won't follow moves).
  const idByPath = internalPaths.length
    ? await getResourceIdsByPermalinks(siteId, internalPaths)
    : new Map<string, number | null>()
  for (const path of internalPaths) {
    const resourceId = idByPath.get(path) ?? null
    result.set(
      path,
      resourceId === null
        ? path
        : getReferenceLink({
            siteId: String(siteId),
            resourceId: String(resourceId),
          }),
    )
  }
  return result
}

// Finds every node that lies on a cycle in the functional redirect graph `edges`
// (each source maps to at most one next source). One traversal over the whole
// graph — O(total edges) — instead of re-walking the chain from each row, which
// is O(N^2) and lets a long uploaded chain (up to ~100k rows within the 1MB cap)
// block the single-threaded event loop. A node is on a cycle iff following its
// chain returns to it, so membership in the returned set is exactly the old
// per-row "chain from `start` returns to `start`" check — a source on the tail
// leading INTO a cycle is (correctly) not included.
const findCycleNodes = (edges: Map<string, string | null>): Set<string> => {
  const cycleNodes = new Set<string>()
  const state = new Map<string, "walking" | "explored">()
  for (const start of edges.keys()) {
    if (state.has(start)) {
      continue
    }
    // Walk forward, recording the path, until the chain ends (null), reaches an
    // already-explored node, or revisits a node still on the current path.
    const path: string[] = []
    let current: string | null = start
    while (current !== null && !state.has(current)) {
      state.set(current, "walking")
      path.push(current)
      current = edges.get(current) ?? null
    }
    // The walk stops in one of three ways, and only the last is a cycle:
    //   - current === null       → the chain terminates; no cycle.
    //   - state is "explored"    → it merged into an already-resolved chain
    //                              (e.g. a tail leading into someone else's
    //                              path); no new cycle on this walk.
    //   - state is "walking"     → we looped back onto the current path; every
    //                              node from there to the end lies on the cycle.
    // (So we can't assert current === null for the no-cycle case — the explored
    // exit is equally valid.)
    if (current !== null && state.get(current) === "walking") {
      for (const node of path.slice(path.indexOf(current))) {
        cycleNodes.add(node)
      }
    }
    for (const node of path) {
      state.set(node, "explored")
    }
  }
  return cycleNodes
}

// Evaluates every CSV row against the same rules as a single create, plus the
// two cross-file checks the design calls for (duplicate source in the file, loop
// formed within the batch). Each row keeps at most one error, chosen in
// precedence order: format → duplicate-in-file → already-on-table → shadows a
// page → loop. Returns the internal rows (with normalized values) so the caller
// can both build the public verdict and insert the surviving rows.
const runBulkValidation = async (
  siteId: number,
  csv: string,
): Promise<{ fileError: string | null; rows: EvaluatedRedirectRow[] }> => {
  const parsed = parseRedirectCsv(csv)
  if (parsed.fileError !== undefined) {
    return { fileError: parsed.fileError, rows: [] }
  }

  // 1) Per-row format validation via the shared row schema (same rules, and the
  // same messages, as the inline add form). A row split by an unquoted comma is
  // rejected first — its parsed destination is truncated, so it can't be trusted.
  const rows: EvaluatedRedirectRow[] = parsed.rows.map(
    ({ rowNumber, source, destination, malformed }) => {
      const base = { rowNumber, source, destination }
      if (malformed) {
        return {
          ...base,
          normalizedSource: null,
          normalizedDestination: null,
          error: BULK_MALFORMED_ROW_MESSAGE,
        }
      }
      const result = redirectRowSchema.safeParse({ source, destination })
      if (!result.success) {
        return {
          ...base,
          normalizedSource: null,
          normalizedDestination: null,
          error:
            result.error.issues[0]?.message ?? "This redirect isn't valid.",
        }
      }
      return {
        ...base,
        normalizedSource: result.data.source,
        normalizedDestination: result.data.destination,
        error: null,
      }
    },
  )

  // 2) Duplicate source within the uploaded file.
  const sourceCounts = new Map<string, number>()
  for (const row of rows) {
    if (row.error === null && row.normalizedSource !== null) {
      sourceCounts.set(
        row.normalizedSource,
        (sourceCounts.get(row.normalizedSource) ?? 0) + 1,
      )
    }
  }
  for (const row of rows) {
    if (
      row.error === null &&
      row.normalizedSource !== null &&
      (sourceCounts.get(row.normalizedSource) ?? 0) > 1
    ) {
      row.error = BULK_DUPLICATE_SOURCE_MESSAGE
    }
  }

  // Load every live redirect once; reused for the on-table check and the loop
  // graph so the whole batch is validated against the DB in memory.
  const liveRedirects = await db
    .selectFrom("Redirect")
    .select(["source", "destination"])
    .where("siteId", "=", siteId)
    .where("deletedAt", "is", null)
    .execute()

  // 3) Source already redirected on the table.
  const liveSources = new Set(liveRedirects.map((redirect) => redirect.source))
  for (const row of rows) {
    if (
      row.error === null &&
      row.normalizedSource !== null &&
      liveSources.has(row.normalizedSource)
    ) {
      row.error = REDIRECT_MESSAGES.alreadyExists
    }
  }

  // 4) Source shadows a live published page or container.
  const sourcesToCheck = [
    ...new Set(
      rows.flatMap((row) =>
        row.error === null && row.normalizedSource !== null
          ? [row.normalizedSource]
          : [],
      ),
    ),
  ]
  if (sourcesToCheck.length > 0) {
    const idByPermalink = await getResourceIdsByPermalinks(
      siteId,
      sourcesToCheck,
    )
    const resourceIds = [...idByPermalink.values()].filter(
      (id): id is number => id !== null,
    )
    const publishedState = await getPublishedStateByResourceIds(
      siteId,
      resourceIds,
    )
    for (const row of rows) {
      if (row.error !== null || row.normalizedSource === null) {
        continue
      }
      const resourceId = idByPermalink.get(row.normalizedSource) ?? null
      if (resourceId !== null && publishedState.get(resourceId)) {
        row.error = REDIRECT_MESSAGES.sourceIsExistingPage
      }
    }
  }

  // 5) Loops in the combined graph. Only rows that survived the checks above
  // (and so would actually be created) contribute an edge, alongside every
  // existing live redirect. Batch destinations are resolved to their target
  // source the same way as stored ones — a `[resource:...]` reference must
  // contribute the right edge. A path-only check would drop a reference to a
  // null edge, letting a reference-formed loop slip past validation while the
  // in-transaction recheck (which resolves references) catches it, so the two
  // must agree.
  const resolvedDestinations = await resolveStoredDestinationsToSources(
    siteId,
    [
      ...liveRedirects.map((redirect) => redirect.destination),
      ...rows.flatMap((row) =>
        row.error === null && row.normalizedDestination !== null
          ? [row.normalizedDestination]
          : [],
      ),
    ],
  )
  const edges = new Map<string, string | null>()
  for (const redirect of liveRedirects) {
    edges.set(
      redirect.source,
      resolvedDestinations.get(redirect.destination) ?? null,
    )
  }
  for (const row of rows) {
    if (row.error !== null || row.normalizedSource === null) {
      continue
    }
    // A surviving row has a unique source and never collides with an existing
    // redirect's source (both were flagged above), so this never clobbers an
    // existing edge.
    edges.set(
      row.normalizedSource,
      row.normalizedDestination !== null
        ? (resolvedDestinations.get(row.normalizedDestination) ?? null)
        : null,
    )
  }
  const cycleNodes = findCycleNodes(edges)
  for (const row of rows) {
    if (row.error !== null || row.normalizedSource === null) {
      continue
    }
    if (cycleNodes.has(row.normalizedSource)) {
      row.error = REDIRECT_MESSAGES.loop
    }
  }

  return { fileError: null, rows }
}

const toValidationResult = (
  fileError: string | null,
  rows: EvaluatedRedirectRow[],
): BulkRedirectValidationResult => {
  const publicRows: BulkRedirectRowResult[] = rows.map(
    ({ rowNumber, source, destination, error }) => ({
      rowNumber,
      source,
      destination,
      error,
    }),
  )
  return {
    fileError,
    rows: publicRows,
    validCount: publicRows.filter((row) => row.error === null).length,
    errorCount: publicRows.filter((row) => row.error !== null).length,
  }
}

// Validates an uploaded CSV without writing anything. Powers the modal's
// "Process redirects" step: drives the errors screen or the ready-to-publish
// preview.
export const bulkValidateRedirects = async ({
  siteId,
  csv,
}: BulkRedirectsCsvInput): Promise<BulkRedirectValidationResult> => {
  const { fileError, rows } = await runBulkValidation(siteId, csv)
  return toValidationResult(fileError, rows)
}

// Result of committing a bulk upload: a published count on success, or the fresh
// validation to re-render the errors screen when re-validation now fails (a race
// since the preview) — never a partial publish.
export type BulkCreateRedirectsResult =
  | { ok: true; publishedCount: number }
  | { ok: false; validation: BulkRedirectValidationResult }

// Publishes a whole validated batch: re-validates server-side (trust boundary +
// race guard), inserts every row in one transaction (chunked, reviving any
// soft-deleted row like a single create), audits one RedirectCreate per row plus
// one Publish, then rebuilds the site once.
export const bulkCreateRedirects = async ({
  siteId,
  csv,
  byUserId,
  logger,
}: BulkRedirectsCsvInput & {
  byUserId: string
  logger: Logger<string>
}): Promise<BulkCreateRedirectsResult> => {
  const byUser = await getByUser(byUserId)

  const { fileError, rows } = await runBulkValidation(siteId, csv)
  if (fileError !== null || rows.some((row) => row.error !== null)) {
    return { ok: false, validation: toValidationResult(fileError, rows) }
  }

  // Every surviving row has normalized values (error === null implies both were
  // set). The guard narrows the types without an assertion; it never drops a row
  // here since we returned early above on any error.
  const validRows = rows.flatMap((row) =>
    row.normalizedSource !== null && row.normalizedDestination !== null
      ? [
          {
            source: row.normalizedSource,
            destination: row.normalizedDestination,
          },
        ]
      : [],
  )
  const storedByDestination = await resolveDestinationsForStorage(
    siteId,
    validRows.map((row) => row.destination),
  )
  const valuesToInsert = validRows.map((row) => ({
    siteId,
    source: row.source,
    destination: storedByDestination.get(row.destination) ?? row.destination,
  }))
  const sources = valuesToInsert.map((value) => value.source)

  try {
    const created = await db.transaction().execute(async (tx) => {
      // Bound the wait for the lock so a stalled holder can't block this write
      // indefinitely; the wait aborts as a retryable CONFLICT (see the catch).
      await sql`SET LOCAL lock_timeout = ${sql.lit(REDIRECT_LOCK_TIMEOUT_MS)}`.execute(
        tx,
      )
      // Serialise redirect writes for this site: two concurrent bulk creates
      // could otherwise each miss the other's uncommitted rows in the rechecks
      // below (READ COMMITTED doesn't see them) and both publish — e.g. one
      // inserting /a -> /b while the other inserts /b -> /a, forming a loop. The
      // xact lock makes the later transaction wait, so its recheck sees the
      // committed rows and aborts. Released automatically at commit/rollback.
      await sql`SELECT pg_advisory_xact_lock(${REDIRECT_WRITE_LOCK_NAMESPACE}, ${siteId})`.execute(
        tx,
      )

      // Re-read every existing row (live or soft-deleted) for these sources
      // first, so each audit entry's `before` is the real committed row. Chunked
      // so a large batch's WHERE source IN (...) can't exceed Postgres' 65535
      // bind-parameter cap.
      const existingRows = (
        await Promise.all(
          chunk(sources, BULK_REDIRECT_INSERT_CHUNK_SIZE).map((batch) =>
            tx
              .selectFrom("Redirect")
              .selectAll()
              .where("siteId", "=", siteId)
              .where("source", "in", batch)
              .execute(),
          ),
        )
      ).flat()
      const existingBySource = new Map(
        existingRows.map((row) => [row.source, row]),
      )

      // Re-enforce the source-vs-published-page guard here, close to the insert.
      // A page could have gone live at one of these sources since validation, and
      // the upsert only guards against a concurrent live redirect (the shortfall
      // check below) — so a redirect shadowing the now-live page would otherwise
      // publish. Mirrors createRedirect's in-transaction recheck. On a hit, abort
      // so the catch re-validates and returns fresh per-row errors (keeping the
      // ok:false contract) rather than committing a shadowing redirect.
      if (sources.length > 0) {
        const idByPermalink = await getResourceIdsByPermalinks(siteId, sources)
        const pageResourceIds = [...idByPermalink.values()].filter(
          (id): id is number => id !== null,
        )
        const publishedState = await getPublishedStateByResourceIds(
          siteId,
          pageResourceIds,
        )
        const shadowsLivePage = sources.some((source) => {
          const resourceId = idByPermalink.get(source) ?? null
          return resourceId !== null && publishedState.get(resourceId) === true
        })
        if (shadowsLivePage) {
          throw new BulkRedirectRaceError()
        }
      }

      const insertedRows: typeof existingRows = []
      for (const batch of chunk(
        valuesToInsert,
        BULK_REDIRECT_INSERT_CHUNK_SIZE,
      )) {
        const inserted = await tx
          .insertInto("Redirect")
          .values(batch)
          .onConflict((oc) =>
            oc
              .columns(["siteId", "source"])
              .doUpdateSet((eb) => ({
                destination: eb.ref("excluded.destination"),
                deletedAt: null,
                // Revived rows republish now, so refresh createdAt (the publish
                // time shown to users).
                createdAt: dbNow,
              }))
              // Only soft-deleted rows may be revived; a live one must not be
              // silently overwritten.
              .where("Redirect.deletedAt", "is not", null),
          )
          .returningAll()
          .execute()
        insertedRows.push(...inserted)
      }

      // One returned row per input is expected (new rows insert, soft-deleted rows
      // revive). A shortfall means a source went live between validation and the
      // insert (the upsert skipped it) — abort the txn so a partial batch never
      // publishes; bulkCreate catches this and re-validates for fresh row errors.
      if (insertedRows.length !== valuesToInsert.length) {
        throw new BulkRedirectRaceError()
      }

      // Re-check for loops against the just-inserted batch plus any redirect
      // created concurrently. Validation ruled out loops as of its read, but a
      // redirect completing one (e.g. /b -> /a landing after a batch /a -> /b was
      // validated) could have been created since — the shortfall and
      // published-page rechecks don't catch that. Read the table via tx (so it
      // sees this batch and any committed concurrent redirect), rebuild the
      // combined graph, and abort if a batch source now lies on a cycle (mirrors
      // createRedirect's in-transaction loop guard).
      const liveAfterInsert = await tx
        .selectFrom("Redirect")
        .select(["source", "destination"])
        .where("siteId", "=", siteId)
        .where("deletedAt", "is", null)
        .execute()
      const resolvedAfter = await resolveStoredDestinationsToSources(
        siteId,
        liveAfterInsert.map((redirect) => redirect.destination),
      )
      const graphAfter = new Map<string, string | null>()
      for (const redirect of liveAfterInsert) {
        graphAfter.set(
          redirect.source,
          resolvedAfter.get(redirect.destination) ?? null,
        )
      }
      const cycleNodes = findCycleNodes(graphAfter)
      if (sources.some((source) => cycleNodes.has(source))) {
        throw new BulkRedirectRaceError()
      }

      // One RedirectCreate per redirect, pairing each committed row with its real
      // before-row. Inserted in the same chunks as the redirects rather than one
      // round-trip per row (via logRedirectEvent) — a large upload would
      // otherwise run thousands of sequential inserts inside the transaction,
      // holding locks and a connection far longer than needed.
      const auditValues = insertedRows.map((row) => ({
        siteId,
        eventType: AuditLogEvent.RedirectCreate,
        delta: {
          before: existingBySource.get(row.source) ?? null,
          after: row,
        },
        userId: byUser.id,
        metadata: {},
      }))
      for (const batch of chunk(auditValues, BULK_REDIRECT_INSERT_CHUNK_SIZE)) {
        await tx.insertInto("AuditLog").values(batch).execute()
      }

      // The whole batch republishes once, audited as a single Publish event.
      // Store only the count here — the per-row detail lives in the RedirectCreate
      // entries above, so embedding every inserted row would just bloat this one
      // AuditLog row (thousands of rows on a large upload).
      await logPublishEvent(tx, {
        siteId,
        by: byUser,
        delta: { before: null, after: null },
        eventType: AuditLogEvent.Publish,
        metadata: { redirects: { createdCount: insertedRows.length } },
      })

      return insertedRows
    })

    // Publish once after commit (see createRedirect's two-step publish).
    await publishSite(logger, { siteId })

    return { ok: true, publishedCount: created.length }
  } catch (error) {
    // A writer that waited past the lock_timeout for the per-site advisory lock
    // aborts here; surface it as a retryable conflict rather than a 500.
    if (isLockTimeoutError(error)) {
      throw new TRPCError({
        code: "CONFLICT",
        message: REDIRECT_WRITE_BUSY_MESSAGE,
      })
    }
    if (error instanceof BulkRedirectRaceError) {
      // A source gained a live redirect or a published page between validation
      // and the insert. Re-validate against the now-current table so the modal
      // shows the offending row(s) rather than a generic failure — this keeps
      // the ok:false contract.
      const { fileError, rows } = await runBulkValidation(siteId, csv)
      const validation = toValidationResult(fileError, rows)
      // The race may have cleared by the time we re-validate (e.g. the
      // conflicting redirect was deleted). With nothing left to flag, ok:false
      // would strand the modal on an errors screen listing no rows, so surface a
      // transient conflict instead — the client prompts a retry, which succeeds.
      if (validation.fileError === null && validation.errorCount === 0) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "The site changed while publishing. Please try again.",
        })
      }
      return { ok: false, validation }
    }
    throw error
  }
}

// Redirects driven by a permalink change (move / rename). Both run inside the
// caller's transaction and publish nothing — the caller's publish covers them.

// Creates the "old URL -> this page" redirect when a page's permalink changes.
// Source/destination are server-derived (the page's old permalink + a reference
// to itself), so we skip the existing-page, loop and format guards createRedirect
// runs for typed-in input. They hold by construction: the page just vacated the
// old path, and a published page is never left on a live redirect source (the
// publish-block plus the move/edit shadow guard), so the old path carries at most
// a soft-deleted redirect, which the upsert revives. Only (siteId, source)
// uniqueness is enforced.
export const createRedirectForPermalinkChange = async (
  tx: Transaction<DB>,
  {
    siteId,
    oldFullPermalink,
    resourceId,
    byUserId,
  }: {
    siteId: number
    oldFullPermalink: string
    resourceId: string
    byUserId: string
  },
) => {
  const source = normalizeRedirectSource(oldFullPermalink)
  const destination = getReferenceLink({
    siteId: String(siteId),
    resourceId: String(resourceId),
  })
  const byUser = await getByUser(byUserId)

  const existing = await tx
    .selectFrom("Redirect")
    .selectAll()
    .where("siteId", "=", siteId)
    .where("source", "=", source)
    .executeTakeFirst()

  const created = await tx
    .insertInto("Redirect")
    .values({ siteId, source, destination })
    .onConflict((oc) =>
      oc
        .columns(["siteId", "source"])
        .doUpdateSet({ destination, deletedAt: null, createdAt: dbNow })
        // Only revive a soft-deleted row; a live one must surface as a conflict.
        .where("Redirect.deletedAt", "is not", null),
    )
    .returningAll()
    .executeTakeFirstOrThrow(
      () =>
        new TRPCError({
          code: "CONFLICT",
          message: `A redirect already exists for ${source}`,
        }),
    )

  await logRedirectEvent(tx, {
    siteId,
    by: byUser,
    eventType: AuditLogEvent.RedirectCreate,
    delta: { before: existing ?? null, after: created },
  })

  return created
}

// Blocks a permalink change that would land a PUBLISHED page on a path already
// served by a live redirect pointing ELSEWHERE — the redirect would shadow the
// page on the published site (the mirror of the publish-block guard). A redirect
// pointing back at this page is the reclaim case (cleared separately), not a
// block, so it is excluded here. Caller gates this on the page being published.
export const assertPermalinkNotShadowed = async (
  tx: Transaction<DB>,
  {
    siteId,
    newFullPermalink,
    resourceId,
  }: { siteId: number; newFullPermalink: string; resourceId: string },
) => {
  const reference = getReferenceLink({
    siteId: String(siteId),
    resourceId: String(resourceId),
  })
  const shadowing = await tx
    .selectFrom("Redirect")
    .select("Redirect.id")
    .where("Redirect.siteId", "=", siteId)
    .where("Redirect.source", "=", normalizeRedirectSource(newFullPermalink))
    .where("Redirect.destination", "!=", reference)
    .where("Redirect.deletedAt", "is", null)
    .executeTakeFirst()
  if (shadowing) {
    throw new TRPCError({
      code: "CONFLICT",
      message: `A redirect already exists at ${newFullPermalink}. Remove it on the Redirections page first.`,
    })
  }
}

// When a permalink change lands a page on a path whose redirect points back at
// that same page (a self-shadow/loop), soft-delete it — the page reclaims its
// URL. Scoped to redirects referencing THIS page; one pointing elsewhere is
// blocked by assertPermalinkNotShadowed instead.
export const clearReclaimedRedirect = async (
  tx: Transaction<DB>,
  {
    siteId,
    newFullPermalink,
    resourceId,
    byUserId,
  }: {
    siteId: number
    newFullPermalink: string
    resourceId: string
    byUserId: string
  },
) => {
  const source = normalizeRedirectSource(newFullPermalink)
  const reference = getReferenceLink({
    siteId: String(siteId),
    resourceId: String(resourceId),
  })

  const reclaimed = await tx
    .selectFrom("Redirect")
    .selectAll()
    .where("siteId", "=", siteId)
    .where("source", "=", source)
    .where("destination", "=", reference)
    .where("deletedAt", "is", null)
    .executeTakeFirst()
  if (!reclaimed) {
    return null
  }

  const byUser = await getByUser(byUserId)
  const after = await tx
    .updateTable("Redirect")
    .set({ deletedAt: dbNow })
    .where("id", "=", reclaimed.id)
    .returningAll()
    .executeTakeFirstOrThrow()
  await logRedirectEvent(tx, {
    siteId,
    by: byUser,
    eventType: AuditLogEvent.RedirectDelete,
    delta: { before: reclaimed, after },
  })
  return after
}

// Single entry point both permalink-change flows (move and rename) call to keep
// redirects consistent. Owns the ordering the flows depend on so they can't
// drift: block a shadowing redirect (published page only) -> clear a redirect
// the page reclaims -> optionally preserve the old URL. Runs inside the caller's
// transaction and publishes nothing — the caller's publish covers it. A no-op
// when the URL is unchanged, so callers may invoke it unconditionally.
export const applyPermalinkChangeRedirects = async (
  tx: Transaction<DB>,
  {
    siteId,
    oldFullPermalink,
    newFullPermalink,
    resourceId,
    isPublished,
    shouldCreateRedirect,
    byUserId,
  }: {
    siteId: number
    oldFullPermalink: string
    newFullPermalink: string
    resourceId: string
    isPublished: boolean
    shouldCreateRedirect: boolean
    byUserId: string
  },
) => {
  // Nothing to reconcile when the URL did not actually change.
  if (oldFullPermalink === newFullPermalink) {
    return
  }

  // A published page must not land on a path a live redirect already points
  // elsewhere from — it would be shadowed (mirror of the publish-block). The
  // throw rolls back the enclosing move/rename.
  if (isPublished) {
    await assertPermalinkNotShadowed(tx, {
      siteId,
      newFullPermalink,
      resourceId,
    })
  }
  // Drop any redirect that pointed back here (it would self-shadow).
  await clearReclaimedRedirect(tx, {
    siteId,
    newFullPermalink,
    resourceId,
    byUserId,
  })
  // Preserve the old URL when asked, for a published page.
  if (shouldCreateRedirect && isPublished) {
    await createRedirectForPermalinkChange(tx, {
      siteId,
      oldFullPermalink,
      resourceId,
      byUserId,
    })
  }
}

export const deleteRedirect = async ({
  siteId,
  id,
  byUserId,
  logger,
}: DeleteRedirectInput & {
  byUserId: string
  logger: Logger<string>
}): Promise<void> => {
  const byUser = await getByUser(byUserId)

  await db.transaction().execute(async (tx) => {
    const before = await tx
      .selectFrom("Redirect")
      .selectAll()
      .where("siteId", "=", siteId)
      .where("id", "=", id)
      .where("deletedAt", "is", null)
      .executeTakeFirstOrThrow(
        () =>
          new TRPCError({
            code: "NOT_FOUND",
            message: "Redirect not found",
          }),
      )

    const deleted = await tx
      .updateTable("Redirect")
      .set({ deletedAt: dbNow })
      .where("id", "=", before.id)
      .returningAll()
      .executeTakeFirstOrThrow()

    // delta holds the real before/after rows committed.
    await logRedirectEvent(tx, {
      siteId,
      by: byUser,
      eventType: AuditLogEvent.RedirectDelete,
      delta: { before, after: deleted },
    })

    // Every mutation republishes the site; audited as a separate Publish event.
    await logPublishEvent(tx, {
      siteId,
      by: byUser,
      delta: { before: null, after: null },
      eventType: AuditLogEvent.Publish,
      metadata: { redirects: { deleted: [deleted] } },
    })
  })

  // Publish after the transaction commits (see createRedirect).
  await publishSite(logger, { siteId })
}

// Powers the page-settings warning: is `source` a live redirect's source, and
// where does it point? `source` (a candidate page URL) is normalised like stored
// sources before the lookup. `destination` is the resolved permalink for display;
// `destinationResourceId` is the referenced resource (null for literal/external
// destinations) so the caller can tell whether the redirect points back at the
// page being edited (which would be reclaimed on save, not a real warning).
export const getRedirectBySource = async ({
  siteId,
  source,
}: GetRedirectBySourceInput): Promise<{
  destination: string
  destinationResourceId: number | null
} | null> => {
  const redirect = await getLiveRedirectBySource(db, {
    siteId,
    source: normalizeRedirectSource(source),
  })
  if (!redirect) {
    return null
  }
  // Resolve via the full reference so we can confirm the embedded siteId matches
  // this site. getResourceIdFromReferenceLink discards the siteId, and the caller
  // suppresses the shadow warning on a resourceId match — a reference embedding a
  // different site's id with a colliding resourceId would suppress it wrongly. The
  // lookup is already siteId-scoped so the ids should match; if they don't, fall
  // back to null (show the warning) rather than trust a cross-site id.
  const match = REFERENCE_DESTINATION_REGEX.exec(redirect.destination)
  const destinationResourceId =
    match && Number(match[1]) === siteId ? Number(match[2]) : null
  return {
    destination: await resolveStoredDestination(siteId, redirect.destination),
    destinationResourceId,
  }
}

// All `[resource:...]` references that point at the resource or any descendant
// — the redirects that break when that subtree is deleted. Reference-only by
// design: a destination stored as a literal path or external URL is not counted
// (only internal-page references follow a resource).
const getDescendantReferences = async (
  trx: SafeKysely,
  { siteId, resourceId }: { siteId: number; resourceId: string },
): Promise<string[]> => {
  const resourceIds = await getDescendantResourceIds(trx, {
    siteId,
    resourceId,
  })
  return resourceIds.map((id) =>
    getReferenceLink({ siteId: String(siteId), resourceId: id }),
  )
}

// Counts the live redirects whose destination points at the resource or any
// descendant, so the delete-page modal can warn before deletion. Shares its
// resolution with the cascade below, so the count matches what gets removed.
export const countRedirectsPointingToResource = async ({
  siteId,
  resourceId,
}: CountRedirectsByDestinationInput): Promise<number> => {
  const references = await getDescendantReferences(db, { siteId, resourceId })
  // An empty `in` list is invalid SQL, so guard like getWithFullPermalink.
  if (references.length === 0) {
    return 0
  }
  const { count } = await db
    .selectFrom("Redirect")
    .select((eb) => eb.fn.countAll().as("count"))
    .where("siteId", "=", siteId)
    .where("destination", "in", references)
    .where("deletedAt", "is", null)
    .executeTakeFirstOrThrow()
  return Number(count)
}

// Soft-deletes every live redirect that points at the resource or any
// descendant, run inside the resource-delete transaction so it commits with the
// delete (the delete's single site publish then covers the removal). Each
// redirect gets its own RedirectDelete audit entry, mirroring deleteRedirect.
export const softDeleteRedirectsPointingToResource = async (
  tx: Transaction<DB>,
  {
    siteId,
    resourceId,
    byUserId,
  }: { siteId: number; resourceId: string; byUserId: string },
) => {
  const references = await getDescendantReferences(tx, { siteId, resourceId })
  // An empty `in` list is invalid SQL, so guard like getWithFullPermalink.
  if (references.length === 0) {
    return []
  }
  const toDelete = await tx
    .selectFrom("Redirect")
    .selectAll()
    .where("siteId", "=", siteId)
    .where("destination", "in", references)
    .where("deletedAt", "is", null)
    .execute()
  if (toDelete.length === 0) {
    return []
  }

  const byUser = await getByUser(byUserId)
  // Soft-delete the whole set in one statement, then emit a per-redirect audit
  // entry (mirroring deleteRedirect) by pairing each before-row with its
  // committed after-row.
  const deleted = await tx
    .updateTable("Redirect")
    .set({ deletedAt: dbNow })
    .where(
      "id",
      "in",
      toDelete.map((redirect) => redirect.id),
    )
    .returningAll()
    .execute()

  const afterById = new Map(deleted.map((after) => [after.id, after]))
  for (const before of toDelete) {
    const after = afterById.get(before.id)
    if (!after) continue
    await logRedirectEvent(tx, {
      siteId,
      by: byUser,
      eventType: AuditLogEvent.RedirectDelete,
      delta: { before, after },
    })
  }
  return deleted
}
