export interface AuditReportQueryParams {
  siteId: number
  auditLogDateRange: string
}

// NOTE: The string-alias form `as "Date added"` keeps the double-quotes as
// part of the returned column key (Kysely does not strip them), so the
// runtime keys are `"Date added"` / `"Last login"` — quotes included. This
// matches the original script, which relies on `toCsv` stripping the quotes
// from the CSV header. The label text is preserved verbatim.
// (A type alias — not an interface — because only type aliases get an
// implicit index signature, making rows assignable to `Record<string,
// unknown>` so they can be passed straight to `toCsv`.)
// oxlint-disable-next-line typescript/consistent-type-definitions
export type AccessReportRow = {
  Email: string | null
  '"Last login"': Date | null
  Role: string
  '"Date added"': Date
}
