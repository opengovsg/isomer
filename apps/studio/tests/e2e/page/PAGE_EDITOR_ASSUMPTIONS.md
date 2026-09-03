# Page editor E2E — assumptions & findings to review

Implemented overnight per `PAGE_EDITOR_E2E_SPEC.md` (P0 + P1 + P2 + the full block matrix —
20 new test files) while you were asleep, using many parallel subagents against a shared
`PageEditorPO`. No blocking questions came up, but a lot of non-obvious things were
discovered by reading source (not guessed), including a few real bugs. Delete this file
(and `PAGE_EDITOR_E2E_SPEC.md`, `PAGE_EDITOR_ASSUMPTIONS.md` itself) once reviewed.

## Could not run the suite locally — same blocker as the dashboard phase

Same `apps/studio/.env` / `NEXT_PUBLIC_APP_ENV=preview` + `DANGEROUSLY_SET_STATIC_OTP`
conflict as noted in `tests/e2e/dashboard/ASSUMPTIONS.md` on the other branch — `next dev`
won't boot under `.env.test`. Everything here was verified via `tsgo --noEmit` (clean),
`oxlint --type-aware` (clean), `oxfmt --check` (clean), zero raw `page.*` calls outside
`fixtures/po/*.ts`/`fixtures/helpers.ts` (grepped across every new file), and close reading
of the actual component/schema source for every locator and required-field claim — but
**not** against a running browser. Please run
`pnpm exec playwright test tests/e2e/page --project=admin --project=editor --project=core`
yourself before merging.

## Real bugs found and fixed along the way (not spec issues — actual latent bugs)

1. **`PageEditorPO.openMetaSettings()` was hitting the wrong route entirely.** It clicked
   the top-nav "Meta Settings" link, which navigates to a separate `/pages/:id/settings`
   page (`BasePageMetaSchema` — SEO `Meta description`/`Meta image`, autosave-on-blur, no
   "Save changes" button, toast "Saved page metadata"). The actual per-layout
   `contentPageHeader.summary`/`articlePageHeader.summary` fields live in
   `MetadataEditorStateDrawer`, reached by clicking the layout's own fixed block
   ("Content page header" / "Article page header" / "Page header") in the block-list root
   — same mechanism the pre-existing `editArticleHeaderSummary` already used correctly.
   Fixed the method to click that block instead. This also means my own two new tests in
   `edit-page.test.ts` (P0 item 2.1) were silently relying on the broken version until this
   was caught partway through — they're correct now.
2. **`addBlockByLabel` / `expectBlockPickerOptionVisible/Hidden` were ambiguous.** They
   matched a block's full accessible name (label + description) with a `^label\b` regex —
   but e.g. "Image" is a literal prefix of "Image gallery"'s and "Image with text"'s full
   name too, all three co-present on the Content picker. Fixed to filter by an exact-text
   match on the block's own caption, scoped per button.
3. **`mockPresignedPutUrl` (upload test fixture) built the wrong S3 key shape.** It used
   `e2e-mock/<uuid>/<filename>`; production's `getFileKey` uses `${siteId}/<uuid>/<filename>`
   — the mismatch would have silently broken file-vs-link classification
   (`getLinkHrefType` needs a leading numeric segment) for any test exercising a file
   attachment's post-upload state. Fixed to use the real `siteId`.
4. **My own `block-validation.test.ts` had a wrong premise.** It assumed a freshly-added
   `image` block starts with empty/invalid alt text. It doesn't —
   `DEFAULT_BLOCKS.image.alt = "Enter a descriptive alt text."` is a valid placeholder, so
   Save actually starts _enabled_. Rewrote the test to explicitly clear the field first
   (producing the invalid state itself) rather than assuming the picker's default is
   invalid.

## The single biggest discovery: `DEFAULT_BLOCKS` already pre-fills most blocks validly

`apps/studio/src/components/PageEditor/constants.ts`'s `DEFAULT_BLOCKS` object is what
seeds a newly-added block's content (`ComponentSelector.tsx`), and for nearly every block
type it's already a complete, schema-valid instance (placeholder alt text that passes the
descriptive-alt pattern, real working map/video/formsg embed URLs, 3 pre-filled array items
for infocards/infocols/keystatistics/imagegallery/logocloud). This meant the block-matrix
tests mostly reduce to **add → confirm Save is enabled → save → reload → assert the
placeholder renders in the preview**, not "fill every required field by hand" as the spec
implied. Two confirmed exceptions where the default is _not_ immediately valid:

- **`accordion`**: `details.content` defaults to `[]`, but the schema requires
  `minItems: 1` — Save stays disabled until the nested prose gets real content.
- **`collectionblock`**: `collectionReferenceLink` defaults to `""` (a literal
  known-TODO in the source), and is actually a `SingleSelect` dropdown
  (`format: "collection-dropdown"`), not the ref-picker the spec assumed — had to seed a
  real, _published_ Collection page and select it (draft-only collections/child pages
  don't render in the preview at all — the sitemap query behind both `childrenpages` and
  `collectionblock` filters to `Published` resources only).

## Where the P0/P1/P2 items landed

- **P0** (2.1–2.5): implemented directly by me — extended `edit-page.test.ts` (standalone
  Content + Article header/prose persistence), `live-preview.test.ts`, `block-crud.test.ts`
  (add/reorder/edit/delete, using `blockquote` instead of the spec's suggested `callout`
  as the second block type — plain text fields, no rich-text interaction needed),
  `block-validation.test.ts`, `discard-changes.test.ts`.
- **P1** (3.1–3.7, 3.9): all implemented by parallel subagents against the shared
  `PageEditorPO`. Notable scoping calls:
  - **3.5 internal-link**: tested via the Collection item `ref` field rather than the
    prose-block Tiptap hyperlink flow — same underlying `LinkEditorModal` machinery, but
    the ref-field path was lower-risk since it's adjacent to already-passing coverage.
  - **3.4 rich-text**: covers heading (H2–H5, no H1)/bold/italic/underline/link/bulleted
    list; table insertion (`TableSizePicker`) deliberately skipped — the risk was
    ProseMirror cursor positioning after a list, which could silently overwrite content
    rather than fail loudly, and couldn't be verified live.
  - **3.2 resource-type-fields**: 6 of 8 rows (Collection Page/Link skipped, already
    covered elsewhere per the spec's own note). Required 3 new seed fixtures
    (`seedDatabasePage`, `seedFolderIndexPage`, `seedHomepageHero`).
  - **1.2 (IsomerAdmin fixture)**: turned out to be unnecessary. `TEST_EMAILS.core` /
    `roleTag("core")` are _already_ real `IsomerAdmin`-table rows (used today for godmode
    tests), and `isActiveIsomerAdmin` grants a blanket Admin-equivalent bypass on _any_
    site regardless of `ResourcePermission` rows. No new fixture/login helper was built —
    `raw-json-mode.test.ts` just uses the existing `core` role project directly.
- **P2**: `reorder-conflict.test.ts` (two-browser-context stale-state conflict, both
  sessions as "admin" since role doesn't matter for this scenario), `legacy-index-conversion.test.ts`
  (needed a new seed helper for a pre-migration `IndexPage` with `layout: "content"`, since
  none existed), `raw-json-mode.test.ts` (per above).
- **Block matrix**: `block-matrix-article.test.ts` (8/8), `block-matrix-content.test.ts`
  (14/14), `block-matrix-homepage.test.ts` (9/9, including the two hard cases above),
  `block-matrix-database.test.ts` and `block-matrix-index.test.ts` deliberately scoped
  down — see below.

## Deliberate scope reductions (not silently dropped — flagging explicitly)

- **Database layout**: `DATABASE_ALLOWED_BLOCKS` is _literally_ the same array reference as
  `CONTENT_ALLOWED_BLOCKS` (`apps/studio/src/components/PageEditor/constants.ts`) —
  confirmed by two independent agents. `block-matrix-database.test.ts` covers 4
  representative cases (prose / callout / image / infocards — one per "required-field
  handling shape") rather than repeating all 14 Content cases verbatim, which would be
  pure duplication.
- **Index layout**: `INDEX_ALLOWED_BLOCKS` = `childrenpages` + all of
  `CONTENT_ALLOWED_BLOCKS`. `block-matrix-index.test.ts` thoroughly covers `childrenpages`
  (genuinely Index-only) plus 2 spot-checks (`prose`, `callout`) confirming the shared
  mechanics work on this layout too — not the full 15-case matrix.
- **Rich text**: table insertion skipped (see above).
- **Upload-rejection risky-file-warning**: exercised via the prose-block "Link → File"
  attachment path — the only page-editor call site that actually passes
  `enableRiskyFileWarning={true}` to `FileAttachment` (verified by search; the plain
  `image` block control does not).

## Other things worth knowing

- **Save button label is not consistent across drawers** — this tripped up more than one
  agent initially. Prose blocks use `TipTapProseComponent` ("Save changes"). Every other
  block type uses `ComplexEditorStateDrawer` ("Save block"). Meta Settings and the Raw JSON
  editor both say "Save changes" too. `PageEditorPO` has separate methods for each
  (`saveBlockChanges` vs `saveComplexBlock` vs `saveMetaSettings`) — don't conflate them.
- **Draft resources are invisible in the live preview.** The sitemap query
  (`getLocalisedSitemap`) that backs `childrenpages` and `collectionblock` rendering only
  includes `Published` resources. Several new seed helpers had to publish their target
  pages explicitly for the preview-based assertions to have anything to find.
- **`DiscardChangesModal` is reused verbatim across three different trigger UIs** — the
  drawer-header back chevron (prose/complex blocks, Meta Settings), and the Raw JSON
  editor's "Close drawer" (X icon, top-right) — all share the same component and copy
  ("Are you sure you want to discard your changes?" / "Go back to editing" / "Yes,
  discard changes"), just wired to different `isModified`/`onBackClick` checks.
- **`MetadataEditorStateDrawer`'s Collection-layout branch is dead code** — `RootStateDrawer`
  never actually routes a Collection-layout page into `metadataEditor` state; the real UI
  for a Collection Index's summary is `CollectionEditorStateDrawer`'s "Collection display".
  `meta-settings.test.ts`'s Collection-layout case tests that real surface instead.

## One tooling note (not code, carried over from the dashboard-phase notes)

Same as before: `Skill("isomer-conventions")` resolves to your global
`~/.claude/skills/isomer-conventions` (catalog/dependency-version checks only), not this
repo's own `.claude/skills/isomer-conventions/` (which has the actually-relevant
`e2e-tests.md`/`tests-arrange-act-assert.md` entries). Reviewed against the repo's own
files directly instead.
