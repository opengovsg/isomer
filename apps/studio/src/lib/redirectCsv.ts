// Shared CSV parsing + errors-file generation for the bulk-upload-redirects
// feature. Isomorphic (papaparse runs in both the browser and Node): the client
// parses a picked file for instant file-level errors and the preview, and the
// server re-parses the same raw text authoritatively before validating. Keeping
// the parse in one place means both sides agree on columns, row numbers, and
// what counts as a malformed file.
import Papa from "papaparse"

// The template's column headers, shown to editors as the Add-redirect form
// labels. The downloadable template and the errors file share these exact
// strings so a corrected errors file re-uploads without renaming anything.
export const BULK_REDIRECT_CSV_HEADERS = {
  source: "When someone visits",
  destination: "Redirect them to",
} as const

// Appended to the errors file only. Not one of the required columns, so it is
// ignored when a corrected errors file is re-uploaded.
export const BULK_REDIRECT_CSV_ERROR_HEADER = "Error"

// Written in the Error column for rows that passed validation, so the errors
// file lists every row (failed ones first) rather than only the failures.
export const BULK_REDIRECT_CSV_NO_ERROR = "No error"

export interface ParsedRedirectRow {
  // 1-based line number in the uploaded file (the header is line 1), so a
  // per-row error can point the editor at the offending line.
  rowNumber: number
  source: string
  destination: string
  // True when the row has stray extra columns — almost always an unquoted comma
  // inside a value — so the source/destination read from the fixed columns can't
  // be trusted. Surfaced as a row error rather than silently truncating a value.
  malformed: boolean
}

// A file-level problem detected before any row is validated — the design's
// upload-stage errors: an empty file, a missing required column, or no data
// rows. `fileError` is user-facing copy. Per-row problems (including a malformed
// row) are surfaced as row errors during validation, not here.
export type ParseRedirectCsvResult =
  | { fileError: string; rows?: undefined }
  | { fileError?: undefined; rows: ParsedRedirectRow[] }

// Case- and whitespace-insensitive header comparison, so "when someone visits",
// " When Someone Visits " and the canonical label all match the same column.
const normalizeHeader = (value: string) => value.trim().toLowerCase()

// Parses raw CSV text into redirect rows, or returns a single file-level error.
// Columns are matched by header name (not position), so extra columns — e.g.
// the Error column on a re-uploaded errors file — are ignored, and the two
// required columns may appear in any order.
export const parseRedirectCsv = (csv: string): ParseRedirectCsvResult => {
  // Strip a leading UTF-8 BOM (spreadsheet exports add one) so it doesn't become
  // part of the first header cell.
  const cleaned = csv.replace(/^﻿/, "")
  // Catch an empty (or whitespace-only) file up front — papaparse reports it as
  // a parse error rather than empty data, and we want the clearer "empty" copy.
  if (cleaned.trim().length === 0) {
    return {
      fileError: "This file is empty. Add your redirects and try again.",
    }
  }

  const { data } = Papa.parse<string[]>(cleaned, {
    skipEmptyLines: "greedy",
  })
  // papaparse is lenient and still returns rows for messy input, so we don't
  // treat a parse `errors` list as fatal for the whole file — a genuinely
  // unreadable file falls through to the header check and is flagged as a
  // missing column. Field-count problems are handled per row (see `malformed`).
  if (data.length === 0) {
    return {
      fileError: "This file is empty. Add your redirects and try again.",
    }
  }

  const header = data[0] ?? []
  const sourceIndex = header.findIndex(
    (cell) =>
      normalizeHeader(cell) ===
      normalizeHeader(BULK_REDIRECT_CSV_HEADERS.source),
  )
  const destinationIndex = header.findIndex(
    (cell) =>
      normalizeHeader(cell) ===
      normalizeHeader(BULK_REDIRECT_CSV_HEADERS.destination),
  )
  if (sourceIndex === -1 || destinationIndex === -1) {
    return {
      fileError: `Your file is missing the "${BULK_REDIRECT_CSV_HEADERS.source}" or "${BULK_REDIRECT_CSV_HEADERS.destination}" column. Use the redirects template.`,
    }
  }

  const dataRows = data.slice(1)
  if (dataRows.length === 0) {
    return {
      fileError:
        "This file has no redirects. Add at least one row and try again.",
    }
  }

  const expectedColumns = header.length
  const rows = dataRows.map((row, index) => ({
    // +2: skip the header (line 1) and shift from 0-based to 1-based.
    rowNumber: index + 2,
    source: (row[sourceIndex] ?? "").trim(),
    destination: (row[destinationIndex] ?? "").trim(),
    // Non-empty columns beyond the header mean a value contained an unquoted
    // comma and got split into stray fields — papaparse keeps the pieces
    // silently, so the destination read from its column would be truncated.
    malformed:
      row.length > expectedColumns &&
      row.slice(expectedColumns).some((cell) => cell.trim() !== ""),
  }))
  return { rows }
}

// A validated row for the errors file: the values as the editor typed them plus
// the plain-language explanation (null when the row passed).
export interface RedirectRowWithError {
  source: string
  destination: string
  error: string | null
}

// Builds the downloadable errors file: every row, failed ones first, with an
// added Error column. Passing rows are kept (marked "No error") so the editor
// fixes the flagged rows in place and re-uploads the same file.
export const buildRedirectErrorsCsv = (
  rows: RedirectRowWithError[],
): string => {
  const failedFirst = [
    ...rows.filter((row) => row.error !== null),
    ...rows.filter((row) => row.error === null),
  ]
  return Papa.unparse({
    fields: [
      BULK_REDIRECT_CSV_HEADERS.source,
      BULK_REDIRECT_CSV_HEADERS.destination,
      BULK_REDIRECT_CSV_ERROR_HEADER,
    ],
    data: failedFirst.map((row) => [
      row.source,
      row.destination,
      row.error ?? BULK_REDIRECT_CSV_NO_ERROR,
    ]),
  })
}
