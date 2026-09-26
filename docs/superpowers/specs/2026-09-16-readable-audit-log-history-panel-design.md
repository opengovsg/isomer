# Readable audit logs — page history panel (Phase 1)

## Context

See the Notion doc ["Readable audit logs"](https://app.notion.com/p/opengov/Readable-audit-logs-3db77dbba78880448a69f91b7b8c8170) for full background. Summary: Isomer's audit log today stores the full before/after `Blob.content` for every `ResourceUpdate` event, but there's no UI to let a lay user make sense of what changed on a page. The doc evaluates a few strategies and lands on **Approach 1 (visual diff)**, specifically **DOM diffing** (via a library like [diffDOM](https://github.com/fiduswriter/diffDOM)) rather than pixel diffing or a from-scratch textual diff.

This spec covers **Phase 1 only**: a "History" panel in the page editor that lists one entry per qualifying `ResourceUpdate` audit log row, each with a "View changes" button. The actual diffDOM-powered visual diff view (what happens when you click "View changes") is scoped as **Phase 2**, described briefly under Non-goals, and is not implemented here.

## Scope

**In scope (Phase 1):**
- A new tRPC query that lists `ResourceUpdate` audit log entries for a given resource, filtered to only those with an actual content (blob) difference.
- A new "History" panel in the studio page editor listing those entries (timestamp, actor, "View changes" button), with "load more" pagination.
- The "View changes" button is wired to a callback/prop but has no diff-rendering behavior yet (placeholder only).

**Out of scope (Phase 1):**
- Rendering the actual side-by-side diff view (Phase 2 — see Non-goals).
- Any audit log event type other than `ResourceUpdate` (e.g. `Publish`, `ResourceCreate`, `ResourceDelete`).
- Metadata-only changes (permalink, etc.) that don't touch `Blob.content`.
- Cross-log context (e.g. explaining a bare "Publish" event using a neighboring "ResourceDelete" event) — this is an open question in the source doc, not addressed here.

## Background: relevant existing schema

- `packages/db/prisma/schema.prisma`:
  - `AuditLogEvent` enum includes `ResourceUpdate`.
  - `AuditLog` model: `id`, `userId`, `siteId`, `eventType`, `createdAt`, `metadata: Json`, `delta: Json` (typed as `PrismaJson.AuditLogDeltaJsonContent`), `ipAddress`.
  - `Blob` model: `content: Json` (page schema), referenced by `Resource.draftBlob` and `Version.blob`.
- `apps/studio/src/server/modules/audit/audit.types.ts`: `ResourceEventDeltaMap` — for `ResourceUpdate`, `delta` is `{ before: FullResource, after: FullResource }`, where `FullResource` may include `{ blob: Blob, resource: Resource }`. This means before/after page content is already captured on every `ResourceUpdate` row; no schema changes are needed for this feature.
- Existing audit log surface is export-only: `apps/studio/src/server/modules/audit/audit.router.ts` only has `getExportWindow`/`createExportRequest`; there is no existing "list audit logs for a resource" read endpoint.
- `apps/studio/src/features/editing-experience/` is the main page-editor feature area (Chakra UI, tRPC `useQuery`/`useSuspenseQuery`, `withSuspense` HOC pattern).

## Design

### Backend: `audit.router.ts` — `listResourceUpdates`

New query procedure:

- **Input:** `{ resourceId: string, siteId: string, cursor?: string, limit?: number }` (`limit` defaults to 20).
- **Query logic:**
  1. Select `AuditLog` rows where `siteId` matches, `eventType = 'ResourceUpdate'`, and the row's `delta`/`metadata` reference `resourceId`.
  2. Order by `createdAt desc`, cursor-paginate on `id`/`createdAt` (standard cursor pattern).
  3. Filter to rows where `delta.before.blob.content` deep-differs from `delta.after.blob.content`. This can be done in the query layer (Kysely, per repo convention for reads) or as a post-fetch filter in the service — prefer filtering as close to the query as practical, but a JS deep-equal post-filter is acceptable given audit log volume per resource is expected to be low.
  4. Rows where either side lacks a `blob` (i.e. `FullResource` without a blob) are treated as non-qualifying and excluded.
- **Output per row:** `{ id, createdAt, actor: { id, name, email }, beforeContent: IsomerSchema, afterContent: IsomerSchema }`.
- Lives alongside the existing `getExportWindow`/`createExportRequest` procedures in the same router; add a corresponding service function in `audit.service.ts` following the existing read/write separation in that module.

### Frontend: `PageHistoryPanel`

- New component under `apps/studio/src/features/editing-experience/components/history/PageHistoryPanel.tsx`.
- Entry point: a new "View page history" button in the editor's root left-rail panel (`RootStateDrawer`), opening this panel as a **drawer** (chosen over a modal so the page stays visible underneath). Concretely, this means adding `"history"` as a new state in the existing `DrawerState` state machine that already drives this left rail (the same mechanism used for `"metadataEditor"`, `"rawJsonEditor"`, etc.), rather than a button in the top navbar next to Publish — the navbar renders outside the `EditorDrawerProvider` context boundary that this state machine depends on, so a navbar-triggered drawer would require a larger provider restructuring out of scope here.
- Data: `trpc.audit.listResourceUpdates` via the app's standard infinite/cursor query pattern, wrapped in `withSuspense`.
- Each row renders: formatted timestamp, actor name/email, and a "View changes" button.
- A "Load more" button at the bottom calls `fetchNextPage()` while `hasNextPage` is true.
- Empty state: if there are zero qualifying entries, show "No changes yet" (or similar) in place of the list.
- The "View changes" button calls an `onViewChanges(row)` prop/handler. For Phase 1, this handler is a no-op or shows a placeholder (e.g. a toast/tooltip "Diff view coming soon") — no diff rendering is implemented yet.

### Error handling

- Query failure surfaces through the existing tRPC error-boundary/toast pattern already used elsewhere in `editing-experience` — no new error UI needed.
- Access control: no new permission model. Anyone who can open the page editor for this resource can see its history (same authorization boundary as viewing/editing the page itself).

### Testing

- **Backend:** unit test for `listResourceUpdates` covering: only `ResourceUpdate` events are returned, only rows with a real content diff are returned (rows with no diff or missing blob are excluded), correct `resourceId`/`siteId` scoping, and cursor pagination (first page, subsequent page via cursor, `hasNextPage` semantics).
- **Frontend:** Vitest component test for `PageHistoryPanel` covering: renders rows from mocked query data, renders the empty state when there are no rows, "Load more" calls `fetchNextPage`, clicking "View changes" invokes `onViewChanges` with the correct row.

## Non-goals (Phase 2, future work — not implemented in this spec)

When a user clicks "View changes," Phase 2 will render the DOM diff:

- Render `beforeContent`/`afterContent` via `RenderEngine` into two sandboxed iframes (reusing the existing `PreviewIframe`/`react-frame-component` pattern).
- Run `diffDOM` (new dependency — not currently installed anywhere in the monorepo) against each iframe's `document.body` to compute a list of typed diff operations (add/remove/modify/move).
- Display **side-by-side before/after panes**, with changed regions highlighted on the after pane. Use a colorblind-safe highlight scheme (avoid a straight red/green pairing) — e.g. distinguish added/removed/modified by a combination of hue and style (fill vs. strikethrough vs. outline), not hue alone.
- This phase needs its own design pass before implementation (annotation strategy for removed nodes that no longer exist in the after-tree, handling attribute-only diff noise, etc.) and is intentionally not detailed further here.

## Open questions carried over from the source doc (unaddressed by either phase)

1. Whether users actually want a true audit log vs. a change log (this design assumes change log — one diff per update, as the doc's "common observations" section suggests is what users are actually asking for).
2. How to give context across neighboring log entries (e.g. a bare "Publish" only makes sense next to a "ResourceDelete").
