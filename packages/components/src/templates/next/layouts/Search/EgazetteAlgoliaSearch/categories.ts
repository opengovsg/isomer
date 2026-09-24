export interface EgazetteSubCategory {
  /** Value as stored in Algolia (the `subCategory` facet). */
  value: string
  /** Label shown in the UI. */
  displayLabel: string
}

export interface EgazetteCategory {
  /** Value as stored in Algolia (the `category` facet). */
  value: string
  /** Label shown in the UI. */
  displayLabel: string
  subCategories?: EgazetteSubCategory[]
}

// The egazette taxonomy is fixed and owned by the publishing pipeline in
// isomer-egazette, so it is hard-coded here rather than configured per-site.
// Order is significant — it mirrors the declared order of the legacy Jekyll
// `algolia-search.js` arrays, and `displayLabel` reflects its
// CATEGORY_INTERNAL_MAPPING (e.g. "Legislative Supplements" displays as
// "Legislation Supplements", "Bankruptcy Act Notice" as "Notices (Bankruptcy Act)").
export const EGAZETTE_CATEGORIES: EgazetteCategory[] = [
  {
    value: "Government Gazette",
    displayLabel: "Government Gazette",
    subCategories: [
      { value: "Advertisements", displayLabel: "Advertisements" },
      { value: "Appointments", displayLabel: "Appointments" },
      { value: "Audited Reports", displayLabel: "Audited Reports" },
      { value: "Cessation of Service", displayLabel: "Cessation of Service" },
      { value: "Corrigendum", displayLabel: "Corrigendum" },
      { value: "Death", displayLabel: "Death" },
      { value: "Dismissals", displayLabel: "Dismissals" },
      { value: "Leave", displayLabel: "Leave" },
      {
        value: "Bankruptcy Act Notice",
        displayLabel: "Notices (Bankruptcy Act)",
      },
      {
        value: "Companies Act Notice",
        displayLabel: "Notices (Companies Act)",
      },
      {
        value: "Notices under the Constitution",
        displayLabel: "Notices (Constitution)",
      },
      {
        value: "Notices under other Acts",
        displayLabel: "Notices (other Acts)",
      },
      { value: "Revocation", displayLabel: "Revocation" },
      { value: "Tenders", displayLabel: "Tenders" },
      {
        value: "Termination of Service",
        displayLabel: "Termination of Service",
      },
      { value: "Vacation of Service", displayLabel: "Vacation of Service" },
      { value: "Others", displayLabel: "Others" },
    ],
  },
  {
    value: "Legislative Supplements",
    displayLabel: "Legislation Supplements",
    subCategories: [
      { value: "Bills Supplement", displayLabel: "Bills Supplement" },
      { value: "Acts Supplement", displayLabel: "Acts Supplement" },
      {
        value: "Subsidiary Legislation Supplement",
        displayLabel: "Subsidiary Legislation Supplement",
      },
      { value: "Revised Acts", displayLabel: "Revised Acts" },
      {
        value: "Revised Subsidiary Legislation",
        displayLabel: "Revised Subsidiary Legislation",
      },
    ],
  },
  {
    value: "Other Supplements",
    displayLabel: "Other Supplements",
    subCategories: [
      {
        value: "Government Gazette Supplement",
        displayLabel: "Government Gazette Supplement",
      },
      {
        value: "Industrial Relations Supplement",
        displayLabel: "Industrial Relations Supplement",
      },
      {
        value: "Trade Marks Supplement",
        displayLabel: "Trade Marks Supplement",
      },
      { value: "Treaties Supplement", displayLabel: "Treaties Supplement" },
    ],
  },
]
