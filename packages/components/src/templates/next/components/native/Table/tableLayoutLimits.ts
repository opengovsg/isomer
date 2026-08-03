/**
 * Upper bound on logical columns the layout resolver will reason about.
 * `hasPhantomColumns` allocates O(rows × columns), and `colspan`/`rowspan`
 * arrive from Tiptap, which copies them verbatim off pasted HTML with no
 * validation — so these values are untrusted at this boundary regardless of
 * the schema.
 *
 * 64 is an arbitrary cap — large enough for real tables, small enough to keep
 * phantom-grid allocation bounded.
 */
export const MAX_TABLE_COLUMNS = 64

/** Coerce an untrusted span attribute to a usable positive integer. */
export const normalizeSpan = (value: unknown): number => {
  if (typeof value !== "number" || !Number.isFinite(value)) return 1
  const span = Math.floor(value)
  return span < 1 ? 1 : Math.min(span, MAX_TABLE_COLUMNS)
}
