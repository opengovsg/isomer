# Readable audit logs — DOM diff view (Phase 2)

## Context

Phase 1 (see `docs/superpowers/specs/2026-09-16-readable-audit-log-history-panel-design.md`, merged as PR #3417) shipped a "History" panel in the Studio page editor listing one row per `ResourceUpdate` audit log entry with an actual content change, each with a "View changes" button. That button was an intentional no-op placeholder — this spec covers what happens when it's clicked.

Per the source [Notion doc](https://app.notion.com/p/opengov/Readable-audit-logs-3db77dbba78880448a69f91b7b8c8170)'s "Approach 1: adopting a visual diff" section, we render both versions of a page through `RenderEngine` and compute a **DOM diff** (via [diffDOM](https://github.com/fiduswriter/diffDOM)) between the two rendered outputs, rather than a pixel diff or a from-scratch textual diff. diffDOM exposes a `route` (a path locating each changed node) for every diff operation it finds, which lets us pinpoint and highlight the *specific* element that changed — not just present two static, unannotated renders.

## Scope

**In scope:**
- A full-screen modal, opened from the History panel's "View changes" button, showing the page's `beforeContent`/`afterContent` (already available from the Phase 1 list query — no new fetch) side by side.
- A DOM diff computed client-side between the two rendered outputs, with the changed elements highlighted independently in each pane (added/modified in the after-pane, removed/modified in the before-pane).
- A toggle to turn the highlight overlay on/off without closing the modal.

**Out of scope:**
- Any change to how audit log entries are listed (Phase 1, already shipped).
- Semantic/component-aware diffing (e.g. recognizing a block *move* as a single operation rather than a remove+add pair) — this is a raw DOM diff; see the accepted limitation below.
- Cross-log context (explaining one event using a neighboring one) — still an open question from the source doc, unaddressed by either phase.

## Design

### Trigger & modal shell

- `HistoryStateDrawer.tsx` (Phase 1) gains local state tracking which row's diff is currently open (`useState<ResourceUpdateRow | null>`). Clicking a row's "View changes" button sets that row, opening a new `PageDiffModal`.
- `PageDiffModal` is a Chakra `Modal size="full"` with `ModalContent overflow="hidden"`, following the existing precedent in this codebase (`CreatePageModal.tsx`, `CreateCollectionPageModal.tsx` both use this exact pattern for full-page takeovers).
- The modal receives the row directly as a prop (`{ createdAt, actor, beforeContent, afterContent }`) — the data is already in hand from the Phase 1 list query, no new fetch needed.
- **Header:** the change's timestamp + actor name, a highlight on/off `Switch`, and a close button that dismisses the modal back to the History panel. The editor's own state is untouched underneath — this is a pure overlay.
- **Body:** two columns, Before | After. Each mounts the existing `PreviewIframe` component directly (not the full `ViewportContainer` — its viewport-switcher/toolbar chrome isn't needed here), each wrapping a `PreviewWithCustomSitemap`-style render fed with the respective `beforeContent`/`afterContent`. Both panes use the *same* `siteId`/`permalink`/`siteMap` (pulled from the existing `useEditorDrawerContext()`/sibling hooks) — only the page content differs between panes, so site-level config (navbar, footer, theme) is shared and identical.

### Diff computation

- New dependency: `diffdom` (confirmed absent from every `package.json` in the monorepo today — this is a new addition, added to `apps/studio/package.json`).
- Once both iframes have finished mounting (via `PreviewIframe`'s existing `callback` hook), a `useDomDiff` hook runs `new DiffDOM().diff(beforeIframe.contentDocument.body, afterIframe.contentDocument.body)`, producing a list of typed operations, each carrying a `route` (an array of child-node indices) that locates the affected node.
- **Partitioning:** operations describing a removal or an old value (`removeElement`, `removeTextElement`, `removeAttribute`, the "before" side of `modifyTextElement`) resolve their route against the **before** iframe's DOM. Operations describing an addition or a new value (`addElement`, `addTextElement`, `addAttribute`, the "after" side of `modifyTextElement`) resolve against the **after** iframe's DOM. Each pane is annotated independently — removed content is not reinserted into the after-pane, since the full "before" render already shows it in place on the left.
- **Highlighting:** for each resolved node, inject a highlight — a background tint (blue = added, amber = removed, purple = modified) plus a small icon badge (`+`, `−`, `~`) — so meaning never depends on color alone (the source doc's author noted red/green specifically is a bad pair here). The on/off toggle adds/removes a CSS class on these injected elements; it does not re-run the diff.
- **Diff scope:** the whole `document.body` of each iframe is diffed, not a carved-out "content" region. Navbar/footer/theme chrome is identical between before/after (same site config, only page content changes), so diffDOM naturally produces zero operations there. This costs some extra traversal but avoids the complexity of isolating a content subtree.
- **Accepted limitation (v1):** this is a raw DOM diff, not a semantic one. A block reorder may surface as a remove+add pair rather than a single "moved" annotation, and incidental render-pipeline attribute noise (if any) would show up as a spurious "modified" highlight. Not solved in this phase — no semantic/component-aware diffing is attempted.
  - **Update from implementation (Task 3, confirmed against real `diff-dom@5.2.1` output):** this limitation is sharper than originally anticipated. When a page edit touches more than one sibling block at once — the common case for a real save, not an edge case — `diff-dom`'s index-based pairwise walk over sibling lists can misattribute the diff entirely: a highlight can land on an unchanged node while the actually-changed node gets none, and a genuine deletion can produce no "removed" highlight anywhere. This is worse than "imprecise labeling of a correctly-located change" (the original framing) — it can be actively misleading for typical multi-block edits. Still not solved in this phase (no semantic diffing attempted), but Task 4's UI and any future user-facing copy about the diff view's reliability should account for this being a common-case limitation, not a rare corner case.

### File structure

New files, all under `apps/studio/src/features/editing-experience/components/Drawer/` (alongside the existing `HistoryStateDrawer.tsx`):

- `PageDiffModal.tsx` — the full-screen modal shell (header, toggle, two-column layout); owns "is the diff ready" state.
- `useDomDiff.ts` — given two `HTMLIFrameElement` refs (or content-ready callbacks) for before/after, returns `{ status: "pending" | "ready" | "error", highlights: {...} }`. Encapsulates the `diffDOM` call and the before/after route partitioning described above.
- `applyDiffHighlights.ts` — a small, independently-testable utility: given a document body plus a list of routes/change-types, walks each route and mutates the DOM to inject the highlight wrapper + badge. Kept separate from `useDomDiff` so it doesn't require mounting real iframes to test.

### Error handling

- If `diffDOM` throws (a malformed route, an unexpected node type) or either iframe fails to produce a usable `document.body`, the modal falls back to showing the two plain, unhighlighted renders with a small inline notice ("Couldn't compute a detailed diff — showing before/after only") rather than failing the whole modal. This mirrors the same "don't let one bad thing take down the whole view" approach already used in Phase 1's backend (a malformed audit log row is dropped and logged rather than 500ing the whole list).

### Testing

- `applyDiffHighlights.ts`: plain Vitest unit tests (no browser mode needed) — feed it a hand-built DOM tree and a list of fake routes/change-types, assert the right nodes receive the right highlight class and badge.
- `PageDiffModal` / `useDomDiff`: a Vitest Browser Mode component test using two small, deliberately different static HTML fixtures rendered via real iframes, verifying end-to-end that a known before/after difference produces the expected highlight in the expected pane. Running the real `diffDOM` against small fixtures is more trustworthy here than mocking its output.
- A toggle test: switching the highlight `Switch` off makes the highlight elements invisible/inert; switching it on makes them reappear.

## Known follow-up (non-blocking, identified in final review)

`useDomDiff` assumes callers hand it fully-resolved iframe content synchronously (documented as a comment in the hook itself). In practice, `PreviewWithCustomSitemap` has its own internal `Suspense` boundary around three tRPC queries, and the iframe-mount callback that feeds `useDomDiff` fires independently of whether that suspended content has actually resolved. Today this is masked because `PageDiffModal`'s `getLocalisedSitemap` query shares a cache key with `EditPagePreview`, which is always mounted first in the only current entry point (the History panel is only reachable from within the page editor, which has already warmed that cache). If this pattern is ever reused from an entry point that doesn't guarantee a warm cache, `useDomDiff` could silently diff two loading skeletons instead of real content, and — since it keys off `Document` object identity rather than content readiness — would never recompute once the real content resolved in place. Fix before reusing this pattern elsewhere: either surface loading state through `useDomDiff`'s `status`, or make the cache-warmth dependency explicit and tested at the `PageDiffModal` call site.

## Open questions carried over from the source doc (unaddressed by this phase)

1. Whether users actually want a true audit log vs. a change log — unchanged from Phase 1's framing.
2. How to give context across neighboring log entries (e.g. a bare "Publish" only makes sense next to a "ResourceDelete").
