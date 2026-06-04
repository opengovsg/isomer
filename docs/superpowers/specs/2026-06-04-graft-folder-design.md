# Graft a folder into an existing Studio site

## Problem

`tooling/scripts/streamline/apps/classic-migration/studiofier/index.ts` performs a one-shot migration of a classic Isomer site into Studio. It always starts from an empty `Site` row and walks the full schema tree from root.

We want to insert a single folder of already-Studio-format JSON content under an existing folder in a live Studio site, without re-running the whole migration. Use cases include adding sections after a migration, importing content exported from another Studio site, or fixing up a partial migration.

## Scope

In scope:
- Insert a folder subtree (Folder / Collection / IndexPage / Page / CollectionPage / CollectionLink / FolderMeta) under an existing parent Resource.
- Reuse the existing `processDirectory` traversal logic.
- Per-collision interactive prompt: skip the colliding entry, or replace it (delete existing subtree + insert new).
- New menu entry in `streamline/index.ts`.

Out of scope:
- Classic → Studio conversion. Source JSON is assumed to already be in Studio format.
- Asset copying and S3 sync. Source is assumed to be pure content with no new images/files.
- Reference rewriting (`studioifyContent`). No asset paths or internal links need rewriting.
- Grafting at site root (parentId = null). Only nesting under an existing folder is supported in this pass.
- Resolving the parent by permalink path. The parent is identified by its numeric `Resource.id`.
- Transaction wrapping. Matches existing studiofier behavior; partial graft is possible on failure.

## Inputs

Collected interactively via `@inquirer/prompts` from the new menu entry:

| Input | Type | Notes |
|---|---|---|
| `siteId` | `number` | Studio `Site.id`. Used as foreign key on inserted rows. |
| `parentId` | `number` | Studio `Resource.id` of the existing Folder or Collection to graft under. Must belong to `siteId`. Must be type `Folder` or `Collection`. |
| `sourceDir` | `string` | Absolute path to a directory on disk containing the Studio-format JSON tree. |

## On-disk layout

Same shape `processDirectory` already understands:

- `<sourceDir>/foo.json` + `<sourceDir>/foo/` → folder with an explicit index page sourced from `foo.json`. If `foo.json` has `layout: "collection"`, the inserted parent is a `Collection`; otherwise a `Folder`.
- `<sourceDir>/foo/` alone (no sibling `foo.json`) → folder with a synthesized index page (`getIndexPageContent`).
- `<sourceDir>/foo.json` (no sibling `foo/`) → page. Inside a collection parent, becomes `CollectionPage`, or `CollectionLink` if `layout` is `"link"` or `"file"`.
- `<sourceDir>/_meta.json` → `FolderMeta`.
- `index.json` is **not** treated as a `RootPage` — `RootPage` semantics only apply when `parentId` is null at the seedDatabase entry point, which doesn't happen here. An `index.json` would just become a regular `Page` named `index`. Document this limitation; callers should not place `index.json` at the top of the source folder.

The existing classic-only normalizations inside `processDirectory` (stripping `permalink`/`lastModified` from `content.page`, rewriting `layout: "file"` → `"link"`) are harmless no-ops when the input is already Studio-format and stay as-is.

## Algorithm

1. Open a `pg.Client` against `ISOMER_STUDIO_DATABASE_URL`.
2. Validate the parent:
   - `SELECT type, "siteId" FROM "Resource" WHERE id = $1`
   - Abort if not found, if `siteId` does not match the requested `siteId`, or if `type` is not in `('Folder', 'Collection')`.
3. Walk top-level entries of `sourceDir`. For each entry, compute the permalink the grafter would use (same rules as `processDirectory`: folder name lowercased, or filename without `.json` lowercased).
4. For each top-level permalink, query existing children: `SELECT id, permalink, type FROM "Resource" WHERE "parentId" = $1`.
5. For each collision:
   - Print a brief description (existing permalink, type, id; incoming type from source).
   - Prompt with `@inquirer/prompts` `select`: `skip` | `replace`.
   - On `skip`: add the entry name to a skip set passed into `processDirectory`. See "Skip implementation" below.
   - On `replace`: recursively delete the existing Resource subtree (see "Deletion" below), then leave the entry to be inserted normally.
6. Invoke the extracted `processDirectory(client, siteId, sourceDir, parentId, isParentCollection)`. The `isParentCollection` flag is derived from the validated parent's type.
7. Close the client.

Collisions inside deeper subtrees of the source (not at the top level) are **not** prompted. They cannot collide with anything because anything below a replaced parent has been deleted, and anything below a skipped parent is also skipped. Anything below a non-colliding top-level entry is inserting under a brand-new parent and so cannot collide.

### Skip implementation

To avoid invasive changes to `processDirectory`, the grafter accepts a `Set<string>` of top-level entry names to skip and filters them before recursion. Concretely, the extracted function gains an optional `topLevelSkip?: Set<string>` parameter that is consulted only on the first call; recursive calls pass `undefined`.

### Deletion (replace path)

For each top-level entry being replaced:

1. `SELECT id FROM "Resource"` recursively via a CTE rooted at the colliding resource (mirror the existing `GET_ALL_RESOURCES_WITH_FULL_PERMALINKS` pattern but rooted at a single id).
2. `DELETE FROM "Version" WHERE "resourceId" = ANY($ids)` — drops version rows first.
3. `DELETE FROM "Blob" WHERE id = ANY($blobIds)` — drops the blobs those versions pointed at. Studio's current schema creates one Blob per Version (see `createBlob` in `studiofier/index.ts`), so blobs are not shared and this is safe.
4. `DELETE FROM "Resource" WHERE id = ANY($ids)` — drops resources last.

This must run before the new subtree is inserted under the same `parentId` and permalink.

Add a final confirmation prompt before performing any deletes, listing the resources that will be removed. The user already chose "replace" per collision, but a tree summary protects against accidental large deletes.

## Where it lives

- New file: `tooling/scripts/streamline/apps/classic-migration/studiofier/graft.ts`.
  - Exports `graftFolder({ siteId, parentId, sourceDir }: GraftFolderRequest)`.
- Refactor: `processDirectory` is extracted from the `seedDatabase` closure in `studiofier/index.ts` into an exported top-level function. Signature:

  ```ts
  export async function processDirectory(
    client: Client,
    siteId: number,
    dirPath: string,
    parentId: number | null,
    isParentCollection?: boolean,
    topLevelSkip?: Set<string>,
  ): Promise<void>
  ```

  Internally, `seedDatabase` keeps calling `processDirectory(client, siteId, schemaDir, null)` so existing behavior is unchanged. `createBlob`, `createResource`, `createVersion`, `getProperTitle`, and `getIndexPageContent` move alongside it (or stay in `index.ts` and are imported by `graft.ts`).
- New menu entry in `tooling/scripts/streamline/index.ts`:
  - Add `"graft-folder-into-site"` to `StreamlineScriptType` in `tooling/scripts/streamline/types.ts`.
  - Add a `choices` entry: `{ name: "Script 6: Graft folder into existing Studio site", value: "graft-folder-into-site", description: "Insert a folder of Studio-format JSON under an existing folder/collection." }`.
  - Wire the switch arm to `await graftFolderIntoSite()` — a thin wrapper that prompts for `siteId`, `parentId`, `sourceDir`, then calls `graftFolder`.

## Error handling

- Parent validation failures → throw with a clear message; the menu wrapper catches and prints.
- DB errors during insert → bubble up; matches `studiofySite`'s style of logging and aborting.
- No transaction. If a graft fails halfway, the user re-runs and uses `replace` on the now-partial collisions. Acceptable for an interactive tooling script.

## Testing

Manual verification only, in line with the rest of `streamline/`:

1. Spin up a Studio dev database with at least one site and one folder.
2. Prepare a `sourceDir` with: one folder containing two pages, one standalone page, one `_meta.json`, one folder with a sibling JSON index, one folder whose sibling JSON has `layout: "collection"` (and child pages).
3. Run the menu entry with `parentId` pointing at the existing folder. Verify all expected Resource/Blob/Version rows are inserted.
4. Re-run against the same `sourceDir`, choose `skip` for one top-level, `replace` for another. Verify the skipped subtree is untouched and the replaced subtree's old rows are gone.
5. Pass a `parentId` belonging to a different site or a non-folder resource → verify abort.

No automated tests are added; the existing studiofier has none and this is a one-shot operator tool.

## Non-goals reminder

- No support for grafting at the root (`parentId = null`). If needed later, lift the parent-validation step's restriction and document the `RootPage` caveat.
- No reference rewriting. If a future caller needs to graft Studio JSON that contains classic-style asset paths or permalink links, layer that on top with a separate pass; do not bake it into `graftFolder`.
- No bulk/CSV input. One graft per invocation.
