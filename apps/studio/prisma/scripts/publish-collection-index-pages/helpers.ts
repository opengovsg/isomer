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
export type TitleSource = "parent" | "resource" | "permalink"

/** The subset of a query row that classification reads. */
export interface ClassifiableRow {
  resourceTitle: string
  parentTitle: string
  parentPermalink: string
  draftContent: unknown
  /** `variant` from the sibling CollectionMeta's published blob, if any. */
  collectionMetaVariant: unknown
}

export type Outcome = {
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
 * Copies `page.tagCategories` from the draft wholesale, with no shape
 * validation — the app's own save path is what enforces the schema, so a
 * draft blob that made it into the DB is trusted as-is. `null` and `undefined`
 * both mean "absent", since the app itself uses them interchangeably.
 *
 * structuredClone so the written blob can never alias the row we read.
 */
export const readTagCategories = (
  content: unknown,
): TagCategories | undefined => {
  const raw = readPage(content)?.tagCategories
  if (raw === undefined || raw === null) return undefined
  return structuredClone(raw) as TagCategories
}

/**
 * Title for `page.title` in the published blob. Mirrors the site build's
 * dangling-directory stub (`tooling/build/scripts/publishing/index.ts`), which
 * uses the Collection `Resource.title`, not the unpublished draft blob.
 *
 * Precedence: parent.title -> IndexPage Resource.title -> permalink slug title.
 * Draft `page.title` is intentionally ignored — it can be stale after renames
 * and is not what the live stub reads today.
 */
const titleFromPermalink = (permalink: string): string => {
  const pageName = permalink.replace(/-/g, " ")
  return pageName.charAt(0).toUpperCase() + pageName.slice(1)
}

export const resolveTitle = (
  row: Pick<
    ClassifiableRow,
    "resourceTitle" | "parentTitle" | "parentPermalink"
  >,
): { title: string; source: TitleSource } => {
  if (nonEmptyString(row.parentTitle))
    return { title: row.parentTitle.trim(), source: "parent" }
  if (nonEmptyString(row.resourceTitle))
    return { title: row.resourceTitle.trim(), source: "resource" }
  if (nonEmptyString(row.parentPermalink))
    return {
      title: titleFromPermalink(row.parentPermalink.trim()),
      source: "permalink",
    }
  return { title: "", source: "parent" }
}

// ---------------------------------------------------------------------------
// The transform
// ---------------------------------------------------------------------------

/**
 * The canonical creation template plus `page.tagCategories` from the draft.
 * `page.title` comes from {@link resolveTitle}, not the draft blob.
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
  const resolved = resolveTitle(row)

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
      tagCategories,
    }),
    titleSource: resolved.source,
    tagCategoryCount: tagCategories?.length ?? 0,
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
