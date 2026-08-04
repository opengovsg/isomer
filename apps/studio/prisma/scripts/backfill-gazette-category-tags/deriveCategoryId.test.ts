import { describe, expect, it } from "vitest"
import {
  GAZETTE_CATEGORY_LABEL,
  GAZETTE_SUBCATEGORY_LABEL,
  GazetteCategories,
  governmentGazetteSubcategories,
  legislativeSupplementsSubcategories,
  otherSupplementsSubcategories,
} from "~/features/gazettes/constants"

import { buildGazetteTaxonomy, deriveCategoryId } from "./deriveCategoryId"

const CAT_GOV = "cat-gov-uuid"
const CAT_LEG = "cat-leg-uuid"
const CAT_OTH = "cat-oth-uuid"
const SUB_ADVERTISEMENTS = "sub-advertisements-uuid"
const SUB_ACTS = "sub-acts-uuid"
const SUB_TREATIES = "sub-treaties-uuid"

const TAG_CATEGORIES = [
  {
    label: GAZETTE_CATEGORY_LABEL,
    options: [
      { id: CAT_GOV, label: GazetteCategories.GovernmentGazettes },
      { id: CAT_LEG, label: GazetteCategories.LegislativeSupplements },
      { id: CAT_OTH, label: GazetteCategories.OtherSupplements },
    ],
  },
  {
    label: GAZETTE_SUBCATEGORY_LABEL,
    options: [
      {
        id: SUB_ADVERTISEMENTS,
        label: governmentGazetteSubcategories.ADVERTISEMENTS,
      },
      {
        id: SUB_ACTS,
        label: legislativeSupplementsSubcategories.ACTS_SUPPLEMENT,
      },
      {
        id: SUB_TREATIES,
        label: otherSupplementsSubcategories.TREATIES_SUPPLEMENT,
      },
    ],
  },
]

const taxonomy = buildGazetteTaxonomy(TAG_CATEGORIES)

describe("deriveCategoryId", () => {
  it("recovers the category from a legacy subcategory-only tagged array", () => {
    expect(
      deriveCategoryId({ tagged: [SUB_ADVERTISEMENTS], taxonomy }),
    ).toEqual({
      status: "derived",
      categoryId: CAT_GOV,
      subcategoryId: SUB_ADVERTISEMENTS,
    })
  })

  // The inversion has to route to the right one of the three categories, not
  // just to any category — a silent mis-inversion would mislabel every row.
  it("routes each subcategory to its own owning category", () => {
    expect(deriveCategoryId({ tagged: [SUB_ACTS], taxonomy })).toEqual({
      status: "derived",
      categoryId: CAT_LEG,
      subcategoryId: SUB_ACTS,
    })
    expect(deriveCategoryId({ tagged: [SUB_TREATIES], taxonomy })).toEqual({
      status: "derived",
      categoryId: CAT_OTH,
      subcategoryId: SUB_TREATIES,
    })
  })

  // Idempotency: this is what makes a re-run a no-op.
  it("reports an already-migrated row as already-tagged", () => {
    expect(
      deriveCategoryId({ tagged: [CAT_GOV, SUB_ADVERTISEMENTS], taxonomy }),
    ).toEqual({ status: "already-tagged" })
  })

  it("does not depend on the order of tagged", () => {
    expect(
      deriveCategoryId({ tagged: [SUB_ADVERTISEMENTS, CAT_GOV], taxonomy }),
    ).toEqual({ status: "already-tagged" })
  })

  it("is unresolvable when tagged holds no subcategory option", () => {
    expect(deriveCategoryId({ tagged: [], taxonomy })).toMatchObject({
      status: "unresolvable",
    })
    expect(
      deriveCategoryId({ tagged: ["some-unknown-uuid"], taxonomy }),
    ).toMatchObject({ status: "unresolvable" })
  })

  // A label string rather than a uuid — the audit SQL calls this
  // `label_string_in_tagged`. Not something we guess at.
  it("is unresolvable when tagged holds a label string instead of a uuid", () => {
    expect(
      deriveCategoryId({
        tagged: [governmentGazetteSubcategories.ADVERTISEMENTS],
        taxonomy,
      }),
    ).toMatchObject({ status: "unresolvable" })
  })

  it("is unresolvable when the owning category is not an option in the collection", () => {
    const withoutGovCategory = buildGazetteTaxonomy([
      {
        label: GAZETTE_CATEGORY_LABEL,
        options: [
          { id: CAT_LEG, label: GazetteCategories.LegislativeSupplements },
        ],
      },
      TAG_CATEGORIES[1]!,
    ])

    expect(
      deriveCategoryId({
        tagged: [SUB_ADVERTISEMENTS],
        taxonomy: withoutGovCategory,
      }),
    ).toMatchObject({ status: "unresolvable" })
  })
})

describe("buildGazetteTaxonomy", () => {
  // The app matches these group labels exactly, so a case variant must not be
  // silently accepted — the backfill would write uuids the app cannot resolve.
  it("ignores tagCategory groups whose label is a case variant", () => {
    const lowercased = buildGazetteTaxonomy([
      {
        label: "category",
        options: [{ id: CAT_GOV, label: "Government Gazette" }],
      },
      TAG_CATEGORIES[1]!,
    ])

    expect(lowercased.categoryIds.size).toBe(0)
  })
})
