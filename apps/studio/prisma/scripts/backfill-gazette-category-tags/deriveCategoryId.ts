import {
  GAZETTE_CATEGORY_LABEL,
  GAZETTE_SUBCATEGORY_LABEL,
  GazetteCategories,
  getAllowedSubcategoryLabelsForCategory,
} from "~/features/gazettes/constants"

export interface TagOption {
  id: string
  label: string
}

export interface TagCategory {
  label: string
  options: TagOption[]
}

export interface GazetteTaxonomy {
  /** Category option label -> option id. */
  categoryIdByLabel: Map<string, string>
  /** Sub-category option id -> option label. */
  subcategoryLabelById: Map<string, string>
  /** Every Category option id, for the "already tagged" check. */
  categoryIds: Set<string>
}

/**
 * Indexes a collection's tagCategories for the backfill.
 *
 * Matches the group labels exactly the way the app does
 * (GAZETTE_CATEGORY_LABEL / GAZETTE_SUBCATEGORY_LABEL) rather than
 * case-insensitively. If the stored label were a case variant, writing uuids
 * would not help — the app still would not resolve them — so the caller should
 * treat a missing Category group as a hard error.
 */
export const buildGazetteTaxonomy = (
  tagCategories: TagCategory[],
): GazetteTaxonomy => {
  const categoryOptions =
    tagCategories.find(({ label }) => label === GAZETTE_CATEGORY_LABEL)
      ?.options ?? []
  const subcategoryOptions =
    tagCategories.find(({ label }) => label === GAZETTE_SUBCATEGORY_LABEL)
      ?.options ?? []

  return {
    categoryIdByLabel: new Map(
      categoryOptions.map(({ label, id }) => [label, id]),
    ),
    subcategoryLabelById: new Map(
      subcategoryOptions.map(({ id, label }) => [id, label]),
    ),
    categoryIds: new Set(categoryOptions.map(({ id }) => id)),
  }
}

export type DerivationResult =
  | { status: "already-tagged" }
  | { status: "derived"; categoryId: string; subcategoryId: string }
  | { status: "unresolvable"; reason: string }

/**
 * Recovers the Category option id for a pre-cutover gazette row.
 *
 * Legacy rows were written as `tagged: [subcategoryUuid]` — the subcategory is
 * already present, only the category is missing. The subcategory label maps back
 * to exactly one category because the three lists in
 * `~/features/gazettes/constants` are disjoint (26 labels, no overlap), which
 * makes `getAllowedSubcategoryLabelsForCategory` invertible.
 *
 * Deliberately has no fallback chain. It does not consult `page.category` or the
 * S3 ref — a row this cannot resolve is reported for manual triage rather than
 * guessed at.
 */
export const deriveCategoryId = ({
  tagged,
  taxonomy,
}: {
  tagged: string[]
  taxonomy: GazetteTaxonomy
}): DerivationResult => {
  if (tagged.some((id) => taxonomy.categoryIds.has(id))) {
    return { status: "already-tagged" }
  }

  // Single pass so the id and its label are captured together — looking the
  // label up again afterwards would need a non-null assertion.
  let subcategoryId: string | undefined
  let subcategoryLabel: string | undefined
  for (const id of tagged) {
    const label = taxonomy.subcategoryLabelById.get(id)
    if (label !== undefined) {
      subcategoryId = id
      subcategoryLabel = label
      break
    }
  }

  if (subcategoryId === undefined || subcategoryLabel === undefined) {
    return {
      status: "unresolvable",
      reason: "tagged holds no Sub-category option uuid to derive from",
    }
  }

  const categoryLabel = Object.values(GazetteCategories).find((candidate) =>
    getAllowedSubcategoryLabelsForCategory(candidate).includes(
      subcategoryLabel,
    ),
  )
  if (!categoryLabel) {
    return {
      status: "unresolvable",
      reason: `subcategory "${subcategoryLabel}" does not belong to any known gazette category`,
    }
  }

  const categoryId = taxonomy.categoryIdByLabel.get(categoryLabel)
  if (!categoryId) {
    return {
      status: "unresolvable",
      reason: `category "${categoryLabel}" is not a Category option in this collection`,
    }
  }

  return { status: "derived", categoryId, subcategoryId }
}
