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
  // 1-based physical line number in the uploaded file, so a per-row error can
  // point the editor at the offending line. Blank lines are counted, so this
  // stays the true file line even when leading blanks push the header past
  // line 1.
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
  // part of the first header cell. `\uFEFF` rather than a literal BOM so the
  // intent is visible and editors/formatters can't silently drop it.
  const cleaned = csv.replace(/^\uFEFF/, "")
  // Catch an empty (or whitespace-only) file up front — papaparse reports it as
  // a parse error rather than empty data, and we want the clearer "empty" copy.
  if (cleaned.trim().length === 0) {
    return {
      fileError: "This file is empty. Add your redirects and try again.",
    }
  }

  // Keep blank lines (no "greedy" skip) so every row keeps its physical file
  // line for `rowNumber`; blank rows are dropped below, after numbering. (A
  // quoted field spanning newlines is still one row, so "line" means CSV record.)
  const { data, errors } = Papa.parse<string[]>(cleaned, {
    skipEmptyLines: false,
  })
  // A stray or unterminated quote makes papaparse merge fields and swallow the
  // following rows (it still returns partial `data`), so those redirects would
  // silently vanish from the batch. Reject the whole file. Field-count mismatches
  // are deliberately NOT treated as fatal here — an unquoted comma is a per-row
  // problem surfaced via `malformed`, not a broken file.
  if (errors.some((error) => error.type === "Quotes")) {
    return {
      fileError:
        "We couldn't read this file. Check that every quote (\") is matched, then try again.",
    }
  }
  // A blank line: no cells, or only empty/whitespace cells. papaparse is lenient
  // and still returns rows for messy input, so a genuinely unreadable file falls
  // through to the header check and is flagged as a missing column.
  const isBlankRow = (row: string[]) => row.every((cell) => cell.trim() === "")

  // The header is the first non-blank line (tolerating leading blank lines some
  // spreadsheet exports add). Its position anchors the physical line numbers.
  const headerIndex = data.findIndex((row) => !isBlankRow(row))
  if (headerIndex === -1) {
    return {
      fileError: "This file is empty. Add your redirects and try again.",
    }
  }

  const header = data[headerIndex] ?? []
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

  const expectedColumns = header.length
  const rows = data
    // Number every line (1-based) BEFORE dropping blanks, so a blank line still
    // advances the count and rowNumber stays the true line in the uploaded file.
    .map((row, index) => ({ row, rowNumber: index + 1 }))
    .slice(headerIndex + 1)
    .filter(({ row }) => !isBlankRow(row))
    .map(({ row, rowNumber }) => ({
      rowNumber,
      source: (row[sourceIndex] ?? "").trim(),
      destination: (row[destinationIndex] ?? "").trim(),
      // Non-empty columns beyond the header mean a value contained an unquoted
      // comma and got split into stray fields — papaparse keeps the pieces
      // silently, so the destination read from its column would be truncated.
      malformed:
        row.length > expectedColumns &&
        row.slice(expectedColumns).some((cell) => cell.trim() !== ""),
    }))
  if (rows.length === 0) {
    return {
      fileError:
        "This file has no redirects. Add at least one row and try again.",
    }
  }
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
