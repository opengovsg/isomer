import type { CollectionPageSchemaType } from "@opengovsg/isomer-components"
import { COLLECTION_VARIANT_OPTIONS } from "@opengovsg/isomer-components"
import { createCollectionIndexJson } from "~/server/modules/collection/collection.service"

export type TagCategories = NonNullable<
  CollectionPageSchemaType["page"]["tagCategories"]
>

type CollectionIndexTemplate = ReturnType<typeof createCollectionIndexJson>

/**
 * The blob this script publishes: exactly the collection-creation template, plus
 * the optional carried-over `tagCategories`. Kept structural (rather than the
 * whole `IsomerSchema` union) so callers can read `page.tagCategories` without
 * narrowing.
 */
export type PublishedIndexBlob = Omit<CollectionIndexTemplate, "page"> & {
  page: CollectionIndexTemplate["page"] & { tagCategories?: TagCategories }
}

/** Where `page.title` came from. Recorded in the report. */
export type TitleSource = "blob" | "resource" | "parent"

export type SkipReason = "malformed-tag-categories" | "no-title"

/** The subset of a query row that classification reads. */
export interface ClassifiableRow {
  resourceTitle: string
  parentTitle: string
  draftContent: unknown
  /** `variant` from the sibling CollectionMeta's published blob, if any. */
  collectionMetaVariant: unknown
}

export type Outcome =
  | {
      kind: "publish"
      next: PublishedIndexBlob
      titleSource: TitleSource
      tagCategoryCount: number
      /**
       * True when this collection renders 2-column today (via the build stub's
       * `variant`) but will render 1-column once we publish a blob that omits
       * `variant`. Counted in the report so the blast radius is visible.
       */
      variantFlip: boolean
    }
  | { kind: "skip"; reason: SkipReason }

// ---------------------------------------------------------------------------
// Readers — the draft blob is untrusted input
// ---------------------------------------------------------------------------

const isRecord = (v: unknown): v is Record<string, unknown> =>
  typeof v === "object" && v !== null && !Array.isArray(v)

const nonEmptyString = (v: unknown): v is string =>
  typeof v === "string" && v.trim().length > 0

const readPage = (content: unknown): Record<string, unknown> | undefined =>
  isRecord(content) && isRecord(content.page) ? content.page : undefined

/**
 * Shape gate only — deliberately does NOT normalise or stamp `display`, which is
 * optional with no JSON Schema default by design and is resolved at render time
 * by `resolveTagCategoryDisplay`.
 *
 * Returns `{ ok: false }` when the value is present but malformed, so the caller
 * skips rather than publishing garbage filters into a live blob.
 */
export const readTagCategories = (
  content: unknown,
): { ok: true; value: TagCategories | undefined } | { ok: false } => {
  const raw = readPage(content)?.tagCategories
  if (raw === undefined) return { ok: true, value: undefined }
  if (!Array.isArray(raw)) return { ok: false }

  const isValid = raw.every(
    (category) =>
      isRecord(category) &&
      nonEmptyString(category.label) &&
      typeof category.id === "string" &&
      Array.isArray(category.options) &&
      category.options.every(
        (option) =>
          isRecord(option) &&
          typeof option.label === "string" &&
          typeof option.id === "string",
      ),
  )
  if (!isValid) return { ok: false }

  // structuredClone so the written blob can never alias the row we read.
  return { ok: true, value: structuredClone(raw) as TagCategories }
}

/**
 * Title precedence: draft blob `page.title` -> `Resource.title` -> `parent.title`.
 *
 * NOTE: `Resource.title` is arguably the fresher value — `folder.router.ts` syncs
 * it onto the IndexPage when a Collection is renamed but never updates the blob,
 * so blob `page.title` can be stale. We honour the blob by decision.
 */
export const resolveTitle = (
  row: Pick<ClassifiableRow, "resourceTitle" | "parentTitle" | "draftContent">,
): { title: string; source: TitleSource } | undefined => {
  const blobTitle = readPage(row.draftContent)?.title
  if (nonEmptyString(blobTitle))
    return { title: blobTitle.trim(), source: "blob" }
  if (nonEmptyString(row.resourceTitle))
    return { title: row.resourceTitle.trim(), source: "resource" }
  if (nonEmptyString(row.parentTitle))
    return { title: row.parentTitle.trim(), source: "parent" }
  return undefined
}

// ---------------------------------------------------------------------------
// The transform
// ---------------------------------------------------------------------------

/**
 * The canonical creation template plus the only two things carried over from the
 * draft: `page.title` (already resolved) and `page.tagCategories`.
 *
 * `tagCategories` is OMITTED when absent or empty, so the no-filters output is
 * identical to a fresh `createCollectionIndexJson(title)`. Absent and `[]` are
 * already equivalent to every reader (`getCollectionTagsForResource` does `?? []`).
 */
export const buildPublishedIndexBlob = ({
  title,
  tagCategories,
}: {
  title: string
  tagCategories?: TagCategories
}): PublishedIndexBlob => {
  const base = createCollectionIndexJson(title)
  if (tagCategories === undefined || tagCategories.length === 0) return base
  return { ...base, page: { ...base.page, tagCategories } }
}

export const classifyRow = (row: ClassifiableRow): Outcome => {
  const tagCategories = readTagCategories(row.draftContent)
  if (!tagCategories.ok)
    return { kind: "skip", reason: "malformed-tag-categories" }

  const resolved = resolveTitle(row)
  if (!resolved) return { kind: "skip", reason: "no-title" }

  // Our template omits `variant`, so the schema default ("collection", 1-column)
  // applies. The build's stub sources `variant` from the sibling CollectionMeta,
  // so a blog-variant collection loses its 2-column layout on the next rebuild.
  const draftVariant = readPage(row.draftContent)?.variant
  const variantFlip =
    draftVariant === COLLECTION_VARIANT_OPTIONS.Blog ||
    row.collectionMetaVariant === COLLECTION_VARIANT_OPTIONS.Blog

  return {
    kind: "publish",
    next: buildPublishedIndexBlob({
      title: resolved.title,
      tagCategories: tagCategories.value,
    }),
    titleSource: resolved.source,
    tagCategoryCount: tagCategories.value?.length ?? 0,
    variantFlip,
  }
}

/**
 * Splits rows into fixed-size batches. The write path uses one transaction per
 * batch rather than one for the whole run: an all-sites run would otherwise hold
 * row locks for its full duration. Safe to interrupt — published rows drop out of
 * the target predicate, so a partial run is resumable by re-running.
 */
export const chunk = <T>(items: T[], size: number): T[][] => {
  if (size < 1) throw new Error(`chunk size must be >= 1, got ${size}`)
  const batches: T[][] = []
  for (let i = 0; i < items.length; i += size) {
    batches.push(items.slice(i, i + size))
  }
  return batches
}
