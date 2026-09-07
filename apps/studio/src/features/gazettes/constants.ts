// Single source of truth for gazette category values. The SingleSelect items
// (`GAZETTE_CATEGORIES`) and the `GazettesCategory` union (see ./types) are both
// derived from this, so a category only ever needs to be declared once here.
export const GazetteCategories = {
  GovernmentGazettes: "Government Gazette",
  LegislativeSupplements: "Legislative Supplements",
  OtherSupplements: "Other Supplements",
} as const

// SingleSelect items — label and value are identical for gazette categories.
export const GAZETTE_CATEGORIES: { label: string; value: string }[] =
  Object.values(GazetteCategories).map((category) => ({
    label: category,
    value: category,
  }))

export const GAZETTE_SUBCATEGORY_LABEL = "Sub-category"

export const governmentGazetteSubcategories = {
  ADVERTISEMENTS: "Advertisements",
  APPOINTMENTS: "Appointments",
  AUDITED_REPORTS: "Audited Reports",
  BANKRUPTCY_ACT_NOTICE: "Bankruptcy Act Notice",
  CESSATION_OF_SERVICE: "Cessation of Service",
  COMPANIES_ACT_NOTICE: "Companies Act Notice",
  CORRIGENDUM: "Corrigendum",
  DEATH: "Death",
  DISMISSALS: "Dismissals",
  LEAVE: "Leave",
  NOTICES_UNDER_OTHER_ACTS: "Notices under other Acts",
  NOTICES_UNDER_THE_CONSTITUTION: "Notices under the Constitution",
  OTHERS: "Others",
  REVOCATION: "Revocation",
  TENDERS: "Tenders",
  TERMINATION_OF_SERVICE: "Termination of Service",
  VACATION_OF_SERVICE: "Vacation of Service",
} as const

export const governmentGazetteSubcategoriesKeys = Object.values(
  governmentGazetteSubcategories,
)

export const legislativeSupplementsSubcategories = {
  ACTS_SUPPLEMENT: "Acts Supplement",
  BILLS_SUPPLEMENT: "Bills Supplement",
  REVISED_ACTS: "Revised Acts",
  REVISED_SUBSIDIARY_LEGISLATION: "Revised Subsidiary Legislation",
  SUBSIDIARY_LEGISLATION_SUPPLEMENT: "Subsidiary Legislation Supplement",
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
