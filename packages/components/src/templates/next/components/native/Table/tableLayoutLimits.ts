/**
 * Max logical columns for layout analysis (`hasPhantomColumns` is O(rows × cols)).
 * Tiptap copies colspan/rowspan verbatim from pasted HTML, so treat them as untrusted.
 * 64 is arbitrary: enough for real tables, small enough to bound grid allocation.
 */
export const MAX_TABLE_COLUMNS = 64

/** Max rows `hasPhantomColumns` will walk. Arbitrary cap on grid allocation. */
export const MAX_TABLE_ROWS = 1000

type TableSpanAttribute = string | number | null | undefined

const normalizeBoundedSpan = (
  value: TableSpanAttribute,
  max: number,
): number => {
  const numericSpan =
    value !== null &&
    value !== undefined &&
    String(value) === String(Number(value)) &&
    Number.isFinite(Number(value))
      ? Number(value)
      : Number.NaN
  if (!Number.isFinite(numericSpan)) {return 1}
  const span = Math.floor(numericSpan)
  return span < 1 ? 1 : Math.min(span, max)
}

/** Clamp untrusted colspan to [1, MAX_TABLE_COLUMNS]. */
export const normalizeColspan = (value: TableSpanAttribute): number =>
  normalizeBoundedSpan(value, MAX_TABLE_COLUMNS)

/** Clamp untrusted rowspan to [1, MAX_TABLE_ROWS]. */
export const normalizeRowspan = (value: TableSpanAttribute): number =>
  normalizeBoundedSpan(value, MAX_TABLE_ROWS)
