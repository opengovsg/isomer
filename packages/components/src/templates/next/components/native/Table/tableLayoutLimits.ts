/**
 * Max logical columns for layout analysis (`hasPhantomColumns` is O(rows × cols)).
 * Tiptap copies colspan/rowspan verbatim from pasted HTML, so treat them as untrusted.
 * 64 is arbitrary: enough for real tables, small enough to bound grid allocation.
 */
export const MAX_TABLE_COLUMNS = 64

/** Max rows `hasPhantomColumns` will walk. Arbitrary cap on grid allocation. */
export const MAX_TABLE_ROWS = 1000

const normalizeBoundedSpan = (value: unknown, max: number): number => {
  if (typeof value !== "number" || !Number.isFinite(value)) return 1
  const span = Math.floor(value)
  return span < 1 ? 1 : Math.min(span, max)
}

/** Clamp untrusted colspan to [1, MAX_TABLE_COLUMNS]. */
export const normalizeColspan = (value: unknown): number =>
  normalizeBoundedSpan(value, MAX_TABLE_COLUMNS)

/** Clamp untrusted rowspan to [1, MAX_TABLE_ROWS]. */
export const normalizeRowspan = (value: unknown): number =>
  normalizeBoundedSpan(value, MAX_TABLE_ROWS)
