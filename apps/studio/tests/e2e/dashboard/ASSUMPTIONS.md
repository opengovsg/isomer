# Dashboard E2E (ISOM-2457) — assumptions & findings to review

Implemented overnight per `SPEC.md` while you were asleep. No blocking questions came
up, but several non-obvious things were discovered by reading source (not guessed) that
are worth a sanity check. Delete this file once reviewed.

## Could not run the suite locally — please run it yourself

`pnpm dev:e2e` fails to boot in this sandbox: your local `apps/studio/.env` sets
`NEXT_PUBLIC_APP_ENV=preview` and `DANGEROUSLY_SET_STATIC_OTP=ISOMER` (singpass/OTP
bypass for manual dev use). Next.js loads `.env` unconditionally in addition to
`.env.test`, and since `.env.test` doesn't set `DANGEROUSLY_SET_STATIC_OTP` at all,
Next picks it up fresh from `.env` while `NEXT_PUBLIC_APP_ENV` stays `'test'` (already
set by `.env.test`) — `env.mjs`'s validator then correctly rejects the combination
("DANGEROUSLY_SET_STATIC_OTP may only be set in preview environments"). This is a
pre-existing local-machine conflict, not something introduced by this change (already
flagged in a prior session). I did not have write access to `.env` to work around it.
Everything below was verified via `tsgo --noEmit` (clean), `oxlint --type-aware` (clean),
`oxfmt --check` (clean), and close reading of the actual component source/`node_modules`
for every new locator — but **not** against a running browser. Please run
`pnpm exec playwright test tests/e2e/dashboard --project=editor --project=admin` yourself
before merging.

## Non-obvious behavior discovered while implementing

1. **Sidebar rows render the resource's own permalink, not its title.**
   `DirectorySidebarContent.tsx` passes `label={`/${item.permalink}`}` to `RowEntry` and
   never reads `item.title`. This is different from the folder/collection dashboard
   table, which shows titles (`TitleCell.tsx`). I've documented this with a one-line
   comment on the relevant `DashboardPO` methods and seed folders/pages with explicit,
   readable permalinks (not the usual random-suffix helper) so sidebar assertions stay
   legible. Worth a sanity check that this is intended UX, not a bug.

2. **Sidebar auto-expand only reaches the directly-routed resource, not its ancestors.**
   `DirectorySidebarContent`'s `useEffect(() => { if (isActive) setExpandedIndex(0) })`
   only fires for the node whose own `resourceId`/`folderId`/`collectionId` matches the
   current route. Viewing a folder two levels deep (e.g. `parentFolder/childFolder`)
   auto-expands `childFolder`'s own accordion, but **not** `parentFolder`'s — so
   `childFolder` wouldn't even be visible in the sidebar unless the user (or the test)
   manually expands `parentFolder` first. `sidebar-navigation.test.ts`'s nested-navigation
   tests expand ancestors manually via `toggleSidebarItem` rather than asserting
   auto-expand beyond one level, since the SPEC's "auto-expand down to it" wording
   doesn't appear to hold for 2+ levels. Flagging in case this is actually a product gap
   worth a ticket — I didn't file one, per the "don't scope-creep" instruction.

3. **The page editor route doesn't render `DirectorySidebar` at all.** `/pages/[pageId]`
   uses `PageEditingLayout`, not `SiteEditorLayout` (which is where `DirectorySidebar` is
   mounted). So clicking a `Page` node in the sidebar navigates you to a screen where the
   sidebar no longer exists — there's no "active Page" sidebar state to assert. Sidebar
   active-highlighting tests are scoped to Folder/Collection nodes only (the only routes
   where the sidebar persists), matching what's actually exercised by `useIsActive`.

4. **Folder `ResourceTable` and the Collection table are the same component** (same
   `ResourceSortMenu`, same `Datatable`/pagination). Rather than adding a second,
   near-identical set of PO methods, `resource-table.test.ts` uses new
   `sortResourceTableBy` / `goToResourceTablePage` / `expectResourceRow*` methods on
   `DashboardPO` that thinly delegate to the existing `sortCollectionBy` /
   `goToCollectionTablePage` / `expectCollectionRow*` methods — mirroring the existing
   `openCollectionResourceMenu` → `openResourceMenu` delegation already in the file.

## Decisions made without stopping to ask

- **Test granularity**: split a few SPEC bullets that named multiple behaviors (e.g.
  "clicking a site... / role sees both sites... / nonexistent vs unauthorized...",
  "expand/collapse", "switching the sort dropdown" across 3 options) into one test per
  behavior, per this repo's `tests-arrange-act-assert.md` convention ("one Act per
  test — split if a test has multiple Act phases"). The SPEC's `site-access.test.ts`
  bullet list maps to 5 tests instead of 3 files' worth of 3 bullets, etc. — same
  coverage, smaller units.
- **Sort/URL-sort test data**: seeded three pages with deliberately distinct
  title-vs-permalink orderings (Charlie/Alpha/Bravo titles, aaa-/bbb-/ccc- permalink
  prefixes) so "Recently edited", "Alphabetical", and "URL" sorts each produce a
  different, unambiguous row order to assert against.
- **`resource/search.test.ts` relocation**: moved and extended in place as
  `dashboard/search.test.ts` per decision #2; git history for the file is preserved via
  `git rm` + new file (not a tracked rename, since content changed enough that git may
  not detect it as one — worth double-checking the diff renders sensibly in review).
- **`.claude/skills/isomer-conventions/conventions/e2e-tests.md`**: added the one-line
  topic-folder note per decision #11.

## One tooling note (not code)

`Skill("isomer-conventions")` in this environment resolves to a _different_,
narrower skill at `~/.claude/skills/isomer-conventions` (your global/user-level skill —
catalog/dependency-version checks only), not this repo's own
`.claude/skills/isomer-conventions/` (which has the `e2e-tests.md` /
`tests-arrange-act-assert.md` entries actually relevant here). I reviewed against the
repo's own convention files directly instead. You may want to rename one of the two to
avoid the collision going forward.
