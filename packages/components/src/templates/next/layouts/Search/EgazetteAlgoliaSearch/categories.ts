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
    displayLabel: "Government Gazette",
    subCategories: [
      { displayLabel: "Advertisements", value: "Advertisements" },
      { displayLabel: "Appointments", value: "Appointments" },
      { displayLabel: "Audited Reports", value: "Audited Reports" },
      { displayLabel: "Cessation of Service", value: "Cessation of Service" },
      { displayLabel: "Corrigendum", value: "Corrigendum" },
      { displayLabel: "Death", value: "Death" },
      { displayLabel: "Dismissals", value: "Dismissals" },
      { displayLabel: "Leave", value: "Leave" },
      {
        displayLabel: "Notices (Bankruptcy Act)",
        value: "Bankruptcy Act Notice",
      },
      {
        displayLabel: "Notices (Companies Act)",
        value: "Companies Act Notice",
      },
      {
        displayLabel: "Notices (Constitution)",
        value: "Notices under the Constitution",
      },
      {
        displayLabel: "Notices (other Acts)",
        value: "Notices under other Acts",
      },
      { displayLabel: "Revocation", value: "Revocation" },
      { displayLabel: "Tenders", value: "Tenders" },
      {
        displayLabel: "Termination of Service",
        value: "Termination of Service",
      },
      { displayLabel: "Vacation of Service", value: "Vacation of Service" },
      { displayLabel: "Others", value: "Others" },
    ],
    value: "Government Gazette",
  },
  {
    displayLabel: "Legislation Supplements",
    subCategories: [
      { displayLabel: "Bills Supplement", value: "Bills Supplement" },
      { displayLabel: "Acts Supplement", value: "Acts Supplement" },
      {
        displayLabel: "Subsidiary Legislation Supplement",
        value: "Subsidiary Legislation Supplement",
      },
      { displayLabel: "Revised Acts", value: "Revised Acts" },
      {
        displayLabel: "Revised Subsidiary Legislation",
        value: "Revised Subsidiary Legislation",
      },
    ],
    value: "Legislative Supplements",
  },
  {
    displayLabel: "Other Supplements",
    subCategories: [
      {
        displayLabel: "Government Gazette Supplement",
        value: "Government Gazette Supplement",
      },
      {
        displayLabel: "Industrial Relations Supplement",
        value: "Industrial Relations Supplement",
      },
      {
        displayLabel: "Trade Marks Supplement",
        value: "Trade Marks Supplement",
      },
      { displayLabel: "Treaties Supplement", value: "Treaties Supplement" },
    ],
    value: "Other Supplements",
  },
]
