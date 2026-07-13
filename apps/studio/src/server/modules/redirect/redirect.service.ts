import type {
  RedirectValidationIssue,
  RedirectValidationResult,
} from "~/constants/redirect"
import type {
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
import { REDIRECT_MESSAGES, RedirectValidationCode } from "~/constants/redirect"
import {
  isValidExternalDestination,
  normalizeRedirectPath,
  normalizeRedirectSource,
} from "~/schemas/redirect"
import { getReferenceLink } from "~/utils/link"
import { ResourceType } from "~prisma/generated/generatedEnums"

import type { Logger } from "@isomer/logging"

import type { SafeKysely, Transaction } from "../database"
import { logPublishEvent, logRedirectEvent } from "../audit/audit.service"
import { publishSite } from "../aws/codebuild.service"
import { AuditLogEvent, db } from "../database"
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
  // A literal path may carry a "?query"/"#fragment" that isn't part of the
  // resource path — resolve against the bare path.
  const stripQueryFragment = (value: string) => value.split(/[?#]/)[0] ?? value

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

  const created = await db.transaction().execute(async (tx) => {
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

    // Re-enforce the no-loop rule server-side; the preflight is advisory. Unlike
    // the recreate check (constraint-backed), this is a plain read, so two admins
    // racing the mirror pair (/a->/b and /b->/a) could each pass and persist a
    // loop — accepted, since the result is recoverable by deleting either side.
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
    // folder/collection at this URL would be shadowed). Also a plain read, so
    // same accepted race as above. PRECONDITION_FAILED keeps it distinct from
    // the already-exists CONFLICT.
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

  // Publish after the transaction commits so the external CodeBuild call is off
  // the row locks and a failed publish can't roll back a saved redirect
  // (mirrors publishPageResource's two-step publish).
  await publishSite(logger, { siteId })

  return created
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
