// Shared helpers for the gazette Search Record admin scripts (repair and
// remove). Kept here rather than duplicated per-script.

// Minimal shape of the gazette blob content the scripts read.
export interface GazettePageContent {
  page: {
    ref: string
    category: string
    tagged: string[]
    description?: string
  }
}

export const isGazettePageContent = (
  content: unknown,
): content is GazettePageContent => {
  if (typeof content !== "object" || content === null) return false
  const page = (content as { page?: unknown }).page
  if (typeof page !== "object" || page === null) return false
  const p = page as Record<string, unknown>
  return (
    typeof p.ref === "string" &&
    typeof p.category === "string" &&
    Array.isArray(p.tagged)
  )
}

/**
 * Parse gazette resource IDs out of the operator-supplied input CSV.
 *
 * Accepts newlines, commas and/or whitespace as separators. Resource IDs are
 * numeric (BigInt primary keys), so keep only digit-only tokens — this also
 * ignores any header line. Strip leading zeros so the tokens match the
 * canonical decimal form Postgres returns for BigInt ids (an ID pasted as
 * "007" must still find row "7").
 */
export const parseResourceIdsCsv = (csvContent: string): string[] => [
  ...new Set(
    csvContent
      .split(/[\s,]+/)
      .map((id) => id.trim())
      .filter((id) => id !== "" && /^\d+$/.test(id))
      .map((id) => id.replace(/^0+(?=\d)/, "")),
  ),
]
