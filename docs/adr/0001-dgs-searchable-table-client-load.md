# DGS Searchable Table loads the full dataset into the client

DGS (data.gov.sg) is deprecating the `q` full-text-search parameter on its `datastore_search` API, and has not yet introduced any replacement for partial-string or substring matching. To preserve search functionality in the `DGSSearchableTable` block we will fetch the entire dataset into the browser in parallel 4MB chunks and perform search, filter pagination, and rendering on the client. This is a temporary workaround: if DGS later ships server-side partial-match search, we should revert to a server-search model and lift the 20MB cap.

## Context

The `DGSSearchableTable` block (`packages/components/src/templates/next/components/internal/SearchableTable/DGS/`) previously branched on dataset size:

- `< 4MB`: load everything client-side and search locally (`StaticDGSSearchableTable`)
- `>= 4MB`: paginate server-side and use `q` for full-text search (`DynamicDGSSearchableTable`)

With `q` going away, the over-4MB branch cannot support search. The largest published dataset is currently under 20MB, so loading everything into the client remains feasible if we page around DGS's 4MB-per-response cap.

## Decision

- Delete `DynamicDGSSearchableTable.tsx`. `DGSSearchableTable.tsx` collapses to a single client-load-all render path.
- Compute chunks as `numChunks = ceil(datasetSize / 4MB)`, where `datasetSize` comes from the dataset metadata endpoint. Probe `total` with a `limit=1` call, then fan out `numChunks` parallel data calls with `limit = ceil(total / numChunks)`.
- Each chunk retries twice with backoff. Persistent failure surfaces a full error state — never partial data, to avoid false-negative searches on official data.
- Hard cap `metadata.size` at **20MB**. Above the cap the component renders an explicit error. The same cap is enforced in Studio's editor at `JsonFormsDgsDatasetIdControl`, alongside the existing CSV-format check, so editors are blocked from saving oversized datasets before publish.
- `filters` and `sort` remain DGS API parameters (server-side). When the editor has not supplied `sort`, we inject `sort=_id` (CKAN's internal stable row id) so offset/limit paging across concurrent chunks is safe.
- `useDgsData` is rewritten in place: API simplifies to `{ resourceId, filters, sort }`; `q`, `limit`, `offset`, and `fetchAll` are removed.

## Considered Options

- **Keep the dynamic path as fallback for oversize datasets.** Rejected: without `q` it cannot search, so it has no functional advantage over the error state at the cap.
- **Add a variance buffer to chunk sizing** (e.g., target 3.2MB per chunk) to guard against silent truncation when rows are unevenly sized. Rejected for simplicity. Accepted risk: heavily skewed row sizes could push a chunk over 4MB; DGS truncates silently in that case.
- **Show partial data with a banner when a chunk fails permanently.** Rejected: a citizen searching for their record could get a false negative without realising the dataset is incomplete. Explicit error is more honest.
- **Move `filters`/`sort` to client-side.** Rejected. Server-side `filters` reduce transfer, and a server-side `sort` (the editor's or `_id`) is required for correctness when paging concurrent chunks.

## Consequences

- All `DGSSearchableTable` renders now incur N+2 requests up front (metadata + probe + N data chunks) before showing data. Mitigated by parallel fan-out: wall-clock cost is ≈ slowest chunk.
- Browser memory grows with dataset size, bounded by the 20MB cap. Mobile devices on slow networks will feel this on first paint.
- The 20MB cap is a hard ceiling visible to content editors. If a dataset grows past it, the editor sees an error in Studio before publish; if it grows past it after publish (DGS-side edit), the published page renders an error.
- Reversible: when DGS ships partial-match search, the chunking machinery can be deleted and the cap lifted in a follow-up.
