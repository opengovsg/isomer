// Single source of truth for the gazette category *labels*. These are the
// labels the collection's "Category" tagCategory options are expected to carry,
// and what `getAllowedSubcategoryLabelsForCategory` keys off.
//
// The Category form field is driven by the collection taxonomy (uuid values,
// resolved via GazetteSubcategoriesContext), not by this object — a gazette's
// category lives in `page.tagged` as an option uuid.
export const GazetteCategories = {
  GovernmentGazettes: "Government Gazette",
  LegislativeSupplements: "Legislative Supplements",
  OtherSupplements: "Other Supplements",
} as const

export const GAZETTE_CATEGORY_LABEL = "Category"

export const GAZETTE_SUBCATEGORY_LABEL = "Sub-category"

/**
 * Rendered in place of a category/subcategory label when a gazette's
 * `page.tagged` holds no uuid matching the collection's Category /
 * Sub-category options — i.e. the row predates the tagCategories cutover and
 * has not been backfilled yet.
 *
 * Shown explicitly rather than falling back to a blank cell or the raw uuid:
 * a blank reads as "this gazette has no category" and a uuid reads as noise,
 * so both hide stragglers from the people best placed to report them.
 */
export const GAZETTE_UNRESOLVED_TAG_LABEL = "Unknown"

export const governmentGazetteSubcategories = {
  NOTICES_UNDER_OTHER_ACTS: "Notices under other Acts",
  APPOINTMENTS: "Appointments",
  CESSATION_OF_SERVICE: "Cessation of Service",
  CORRIGENDUM: "Corrigendum",
  DISMISSALS: "Dismissals",
  LEAVE: "Leave",
  NOTICES_UNDER_THE_CONSTITUTION: "Notices under the Constitution",
  DEATH: "Death",
  TERMINATION_OF_SERVICE: "Termination of Service",
  VACATION_OF_SERVICE: "Vacation of Service",
  BANKRUPTCY_ACT_NOTICE: "Bankruptcy Act Notice",
  COMPANIES_ACT_NOTICE: "Companies Act Notice",
  OTHERS: "Others",
  ADVERTISEMENTS: "Advertisements",
  TENDERS: "Tenders",
  REVOCATION: "Revocation",
  AUDITED_REPORTS: "Audited Reports",
} as const

export const governmentGazetteSubcategoriesKeys = Object.values(
  governmentGazetteSubcategories,
)

export const legislativeSupplementsSubcategories = {
  SUBSIDIARY_LEGISLATION_SUPPLEMENT: "Subsidiary Legislation Supplement",
  BILLS_SUPPLEMENT: "Bills Supplement",
  ACTS_SUPPLEMENT: "Acts Supplement",
  REVISED_ACTS: "Revised Acts",
  REVISED_SUBSIDIARY_LEGISLATION: "Revised Subsidiary Legislation",
} as const

export const legislativeSupplementsSubcategoriesKeys = Object.values(
  legislativeSupplementsSubcategories,
)

export const otherSupplementsSubcategories = {
  GOVERNMENT_GAZETTE_SUPPLEMENT: "Government Gazette Supplement",
  INDUSTRIAL_RELATIONS_SUPPLEMENT: "Industrial Relations Supplement",
  TRADE_MARKS_SUPPLEMENT: "Trade Marks Supplement",
  TREATIES_SUPPLEMENT: "Treaties Supplement",
} as const

export const otherSupplementsSubcategoriesKeys = Object.values(
  otherSupplementsSubcategories,
)

/**
 * Allowed subcategory labels for a top-level gazette category.
 * Shared by the Studio form filter and server create/update validation so
 * pairing rules stay in one place.
 */
export const getAllowedSubcategoryLabelsForCategory = (
  category: string,
): readonly string[] => {
  switch (category) {
    case GazetteCategories.GovernmentGazettes:
      return governmentGazetteSubcategoriesKeys
    case GazetteCategories.LegislativeSupplements:
      return legislativeSupplementsSubcategoriesKeys
    case GazetteCategories.OtherSupplements:
      return otherSupplementsSubcategoriesKeys
    default:
      return []
  }
}
