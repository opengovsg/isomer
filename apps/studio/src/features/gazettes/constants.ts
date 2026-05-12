export const GAZETTE_CATEGORIES: { label: string; value: string }[] = [
  { label: "Government Gazette", value: "Government Gazette" },
  { label: "Legislation Supplements", value: "Legislation Supplements" },
  { label: "Other Supplements", value: "Other Supplements" },
]

export const GAZETTE_SUBCATEGORY_LABEL = "Sub-category"

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
