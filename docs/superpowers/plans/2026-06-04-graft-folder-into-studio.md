# Graft Folder Into Studio Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a new streamline menu entry that inserts a folder of Studio-format JSON content under an existing folder/collection Resource in a live Isomer Studio site, with per-collision skip/replace prompting.

**Architecture:** Lift the existing `processDirectory` traversal out of the `seedDatabase` closure in `studiofier/index.ts` so it can be reused. Add a new `graft.ts` that validates the parent Resource, detects top-level permalink collisions against existing children, prompts per collision (skip or replace), recursively deletes replaced subtrees, then invokes the shared `processDirectory` with a skip set. Wire a thin menu entry through `streamline/index.ts` that prompts the operator for `siteId`, `parentId`, `sourceDir` and calls into `graftFolder`.

**Tech Stack:** TypeScript, `pg` client, `@inquirer/prompts` (`select`, `confirm`, `input`, `number`), `dotenv`.

**Spec:** `docs/superpowers/specs/2026-06-04-graft-folder-design.md`

---

## File Structure

**Modify:**
- `tooling/scripts/streamline/apps/classic-migration/studiofier/index.ts` — extract `processDirectory` out of the `seedDatabase` closure as a top-level exported function; update `seedDatabase` to call it.
- `tooling/scripts/streamline/apps/classic-migration/studiofier/constants.ts` — add `GET_RESOURCE_DESCENDANTS_INCLUSIVE` recursive CTE.
- `tooling/scripts/streamline/types.ts` — add `"graft-folder-into-site"` to `StreamlineScriptType`.
- `tooling/scripts/streamline/index.ts` — add menu choice and switch arm.

**Create:**
- `tooling/scripts/streamline/apps/classic-migration/studiofier/graft.ts` — exports `graftFolder({ siteId, parentId, sourceDir })`.
- `tooling/scripts/streamline/apps/graft-folder.ts` — exports `graftFolderIntoSite()`, the menu wrapper that prompts for inputs and calls `graftFolder`.

---

## Task 1: Extract processDirectory into a top-level exported function

**Files:**
- Modify: `tooling/scripts/streamline/apps/classic-migration/studiofier/index.ts:165-313` (the `seedDatabase` function containing the nested `processDirectory`).

- [ ] **Step 1: Replace the `seedDatabase` function with the refactored version**

In `studiofier/index.ts`, replace the entire `seedDatabase` function (lines 165–313) with these two top-level declarations. `processDirectory` becomes a top-level exported function that takes `client`, `siteId`, and the new optional `topLevelSkip` parameter; `seedDatabase` becomes a small caller.

```ts
export async function processDirectory(
  client: Client,
  siteId: number,
  dirPath: string,
  parentId: number | null,
  isParentCollection?: boolean,
  topLevelSkip?: Set<string>,
): Promise<void> {
  const allEntries = fs.readdirSync(dirPath, { withFileTypes: true });
  const entries = topLevelSkip
    ? allEntries.filter((e) => !topLevelSkip.has(e.name))
    : allEntries;
  const folders = entries.filter((entry) => entry.isDirectory());
  const folderNames = folders.map((folder) => folder.name);
  const independentPages = entries.filter(
    (entry) =>
      !entry.isDirectory() &&
      entry.name.endsWith(".json") &&
      !folderNames.includes(entry.name.slice(0, -5)),
  );

  for (const folder of folders) {
    console.log(`Processing folder: ${folder.name}`);
    const fullPath = path.join(dirPath, folder.name);

    const isIndexPagePresent = entries.some(
      (entry) => !entry.isDirectory() && entry.name === `${folder.name}.json`,
    );

    if (isIndexPagePresent) {
      console.log(`Found index page for folder ${folder.name}`);
      const indexPagePath = path.join(dirPath, `${folder.name}.json`);
      const content = JSON.parse(fs.readFileSync(indexPagePath, "utf-8"));
      const title = content.page?.title || getProperTitle(folder.name);
      const permalink = "_index";

      const isCollection = content.layout === "collection";

      if (isCollection) {
        const folderResourceId = await createResource(client, {
          title,
          permalink: folder.name.toLowerCase(),
          parentId,
          type: "Collection",
          siteId,
        });

        const blobId = await createBlob(client, content);
        const resourceId = await createResource(client, {
          title,
          permalink,
          parentId: folderResourceId,
          type: "IndexPage",
          siteId,
        });
        await createVersion(client, resourceId, blobId);

        await processDirectory(
          client,
          siteId,
          fullPath,
          folderResourceId,
          true,
        );
      } else {
        const folderResourceId = await createResource(client, {
          title,
          permalink: folder.name.toLowerCase(),
          parentId,
          type: "Folder",
          siteId,
        });

        const blobId = await createBlob(client, content);
        const resourceId = await createResource(client, {
          title,
          permalink,
          parentId: folderResourceId,
          type: "IndexPage",
          siteId,
        });
        await createVersion(client, resourceId, blobId);

        await processDirectory(client, siteId, fullPath, folderResourceId);
      }
    } else {
      const title = getProperTitle(folder.name);
      const folderResourceId = await createResource(client, {
        title,
        permalink: folder.name.toLowerCase(),
        parentId,
        type: "Folder",
        siteId,
      });

      const blobId = await createBlob(client, getIndexPageContent(title));
      const resourceId = await createResource(client, {
        title,
        permalink: "_index",
        parentId: folderResourceId,
        type: "IndexPage",
        siteId,
      });
      await createVersion(client, resourceId, blobId);

      await processDirectory(client, siteId, fullPath, folderResourceId);
    }
  }

  for (const page of independentPages) {
    console.log(`Processing page: ${page.name}`);
    const isRootPage = page.name === "index.json" && parentId === null;

    const fullPath = path.join(dirPath, page.name);
    const content = JSON.parse(fs.readFileSync(fullPath, "utf-8"));
    const title = isRootPage
      ? "Home"
      : content.page?.title || path.basename(page.name, ".json");
    const permalink = isRootPage
      ? ""
      : path.basename(page.name, ".json").toLowerCase();
    const isCollectionLink =
      content.layout === "link" || content.layout === "file";
    const isPageOrder = page.name === "_meta.json";

    if (content.layout === "file") {
      content.layout = "link";
    }

    const blobId = await createBlob(client, content);
    const resourceId = await createResource(client, {
      title,
      permalink,
      parentId,
      type: isRootPage
        ? "RootPage"
        : isParentCollection
          ? isCollectionLink
            ? "CollectionLink"
            : "CollectionPage"
          : isPageOrder
            ? "FolderMeta"
            : "Page",
      siteId,
    });
    await createVersion(client, resourceId, blobId);
  }
}

async function seedDatabase(client: Client, siteId: number, siteName: string) {
  const schemaDir = path.join(__dirname, "..", "repos", siteName, "schema");
  await processDirectory(client, siteId, schemaDir, null);

  await importSiteConfig(client, siteId, siteName);
  await importNavbar(client, siteId, siteName);
  await importFooter(client, siteId, siteName);
}
```

- [ ] **Step 2: Type-check the file**

Run: `npx tsc --noEmit -p tooling/scripts/tsconfig.json`
Expected: PASS (no new errors introduced by the refactor).

If `tooling/scripts/tsconfig.json` does not exist, run the workspace-level type check the repo already uses; check `tooling/scripts/package.json` for a `lint`/`typecheck` script and use that.

- [ ] **Step 3: Commit**

```bash
git add tooling/scripts/streamline/apps/classic-migration/studiofier/index.ts
git commit -m "refactor(studiofier): lift processDirectory out of seedDatabase closure"
```

---

## Task 2: Add recursive descendant SQL constant

**Files:**
- Modify: `tooling/scripts/streamline/apps/classic-migration/studiofier/constants.ts`

- [ ] **Step 1: Append the new constant**

Add this to the end of `studiofier/constants.ts`:

```ts
export const GET_RESOURCE_DESCENDANTS_INCLUSIVE = `
WITH RECURSIVE "descendants" (id) AS (
    SELECT id FROM public."Resource" WHERE id = $1

    UNION ALL

    SELECT r.id
    FROM public."Resource" r
    INNER JOIN "descendants" d ON r."parentId" = d.id
)

SELECT id FROM "descendants";
`;
```

- [ ] **Step 2: Type-check**

Run: `npx tsc --noEmit -p tooling/scripts/tsconfig.json`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add tooling/scripts/streamline/apps/classic-migration/studiofier/constants.ts
git commit -m "feat(studiofier): add recursive descendant SQL constant for resource subtree lookup"
```

---

## Task 3: Implement graftFolder

**Files:**
- Create: `tooling/scripts/streamline/apps/classic-migration/studiofier/graft.ts`

- [ ] **Step 1: Write `graft.ts`**

Create `studiofier/graft.ts` with the following content:

```ts
import * as fs from "fs";
import * as path from "path";
import * as dotenv from "dotenv";
import { Client } from "pg";
import { confirm, select } from "@inquirer/prompts";

import { GET_RESOURCE_DESCENDANTS_INCLUSIVE } from "./constants";
import { processDirectory } from "./index";

dotenv.config({
  path: path.join(__dirname, "..", "..", ".env"),
});

export interface GraftFolderRequest {
  siteId: number;
  parentId: number;
  sourceDir: string;
}

interface TopLevelEntry {
  // Raw on-disk name: folder name or file name including ".json"
  entryName: string;
  // Computed permalink (matches what processDirectory would assign)
  permalink: string;
  // "folder" entries cover both Folder and Collection inserts;
  // "page" covers Page / CollectionPage / CollectionLink / FolderMeta inserts.
  kind: "folder" | "page";
  // For folders, the sibling JSON name if present (used to also skip the
  // sibling when the user chooses to skip a folder collision).
  siblingIndexJson?: string;
}

export const graftFolder = async ({
  siteId,
  parentId,
  sourceDir,
}: GraftFolderRequest) => {
  if (!fs.existsSync(sourceDir)) {
    throw new Error(`Source directory does not exist: ${sourceDir}`);
  }

  const client = new Client({
    connectionString: process.env.ISOMER_STUDIO_DATABASE_URL,
  });

  try {
    await client.connect();
    console.log("Connected to Studio database");

    // 1. Validate parent
    const parentResult = await client.query(
      `SELECT type, "siteId" FROM public."Resource" WHERE id = $1`,
      [parentId],
    );
    if (parentResult.rows.length === 0) {
      throw new Error(`No Resource found with id ${parentId}`);
    }
    const parent = parentResult.rows[0] as { type: string; siteId: number };
    if (parent.siteId !== siteId) {
      throw new Error(
        `Resource ${parentId} belongs to site ${parent.siteId}, not ${siteId}`,
      );
    }
    if (parent.type !== "Folder" && parent.type !== "Collection") {
      throw new Error(
        `Resource ${parentId} has type "${parent.type}"; must be Folder or Collection`,
      );
    }
    const isParentCollection = parent.type === "Collection";

    // 2. Enumerate top-level entries (folders first, then non-shadowed JSON)
    const dirEntries = fs.readdirSync(sourceDir, { withFileTypes: true });
    const folders = dirEntries.filter((e) => e.isDirectory());
    const folderNames = new Set(folders.map((f) => f.name));
    const independentPages = dirEntries.filter(
      (e) =>
        !e.isDirectory() &&
        e.name.endsWith(".json") &&
        !folderNames.has(e.name.slice(0, -5)),
    );

    const topLevelEntries: TopLevelEntry[] = [];
    for (const folder of folders) {
      const siblingJson = `${folder.name}.json`;
      const hasSibling = dirEntries.some(
        (e) => !e.isDirectory() && e.name === siblingJson,
      );
      topLevelEntries.push({
        entryName: folder.name,
        permalink: folder.name.toLowerCase(),
        kind: "folder",
        siblingIndexJson: hasSibling ? siblingJson : undefined,
      });
    }
    for (const page of independentPages) {
      topLevelEntries.push({
        entryName: page.name,
        permalink: path.basename(page.name, ".json").toLowerCase(),
        kind: "page",
      });
    }

    // 3. Detect collisions
    const existingResult = await client.query(
      `SELECT id, permalink, type FROM public."Resource" WHERE "parentId" = $1`,
      [parentId],
    );
    const existingByPermalink = new Map<
      string,
      { id: number; type: string }
    >(
      existingResult.rows.map((r: { id: number; permalink: string; type: string }) => [
        r.permalink,
        { id: r.id, type: r.type },
      ]),
    );

    const skipSet = new Set<string>();
    const replaceTargets: { id: number; permalink: string; type: string }[] = [];

    for (const entry of topLevelEntries) {
      const existing = existingByPermalink.get(entry.permalink);
      if (!existing) continue;

      console.log(
        `Collision: existing ${existing.type} "${entry.permalink}" (id ${existing.id}) vs incoming ${entry.kind} "${entry.entryName}"`,
      );
      const choice = await select<"skip" | "replace">({
        message: `How to handle the collision at "${entry.permalink}"?`,
        choices: [
          { name: "Skip — leave the existing resource alone", value: "skip" },
          {
            name: "Replace — delete the existing subtree and insert the new one",
            value: "replace",
          },
        ],
      });

      if (choice === "skip") {
        skipSet.add(entry.entryName);
        if (entry.siblingIndexJson) {
          skipSet.add(entry.siblingIndexJson);
        }
      } else {
        replaceTargets.push({
          id: existing.id,
          permalink: entry.permalink,
          type: existing.type,
        });
      }
    }

    // 4. Confirm deletions
    if (replaceTargets.length > 0) {
      let totalResources = 0;
      for (const target of replaceTargets) {
        const descendantsResult = await client.query(
          GET_RESOURCE_DESCENDANTS_INCLUSIVE,
          [target.id],
        );
        totalResources += descendantsResult.rows.length;
        console.log(
          `  - "${target.permalink}" (${target.type}, id ${target.id}): ${descendantsResult.rows.length} resource(s) will be deleted`,
        );
      }

      const confirmed = await confirm({
        message: `About to delete ${replaceTargets.length} subtree(s) covering ${totalResources} resource(s) total. Proceed?`,
        default: false,
      });
      if (!confirmed) {
        console.log("Graft aborted by user.");
        return;
      }

      for (const target of replaceTargets) {
        console.log(`Deleting subtree at "${target.permalink}" (id ${target.id})`);
        await deleteResourceSubtree(client, target.id);
      }
    }

    // 5. Insert the new subtree
    console.log(`Inserting source dir ${sourceDir} under parent ${parentId}`);
    await processDirectory(
      client,
      siteId,
      sourceDir,
      parentId,
      isParentCollection,
      skipSet,
    );

    console.log("Graft complete.");
  } catch (err) {
    console.error(err);
    throw err;
  } finally {
    await client.end();
  }
};

async function deleteResourceSubtree(client: Client, rootId: number) {
  const descendantsResult = await client.query<{ id: number }>(
    GET_RESOURCE_DESCENDANTS_INCLUSIVE,
    [rootId],
  );
  const resourceIds = descendantsResult.rows.map((r) => r.id);
  if (resourceIds.length === 0) return;

  const versionsResult = await client.query<{ id: number; blobId: number }>(
    `SELECT id, "blobId" FROM public."Version" WHERE "resourceId" = ANY($1::int[])`,
    [resourceIds],
  );
  const blobIds = versionsResult.rows.map((v) => v.blobId);

  // Order matters because of the circular FK between Resource.publishedVersionId
  // and Version.id: clear the FK before deleting versions.
  await client.query(
    `UPDATE public."Resource" SET "publishedVersionId" = NULL WHERE id = ANY($1::int[])`,
    [resourceIds],
  );
  await client.query(
    `DELETE FROM public."Version" WHERE "resourceId" = ANY($1::int[])`,
    [resourceIds],
  );
  if (blobIds.length > 0) {
    await client.query(
      `DELETE FROM public."Blob" WHERE id = ANY($1::int[])`,
      [blobIds],
    );
  }
  await client.query(
    `DELETE FROM public."Resource" WHERE id = ANY($1::int[])`,
    [resourceIds],
  );
}
```

- [ ] **Step 2: Type-check**

Run: `npx tsc --noEmit -p tooling/scripts/tsconfig.json`
Expected: PASS. If you see `Cannot find module './index'` for the `processDirectory` import, confirm Task 1's `export` keyword landed.

- [ ] **Step 3: Commit**

```bash
git add tooling/scripts/streamline/apps/classic-migration/studiofier/graft.ts
git commit -m "feat(studiofier): add graftFolder for inserting a folder under an existing Studio resource"
```

---

## Task 4: Wire the menu entry

**Files:**
- Modify: `tooling/scripts/streamline/types.ts`
- Create: `tooling/scripts/streamline/apps/graft-folder.ts`
- Modify: `tooling/scripts/streamline/index.ts`

- [ ] **Step 1: Add `"graft-folder-into-site"` to the script union type**

In `tooling/scripts/streamline/types.ts`, update `StreamlineScriptType`:

```ts
export type StreamlineScriptType =
  | "migrate-classic-to-next"
  | "generate-dns-records"
  | "verify-dns-records"
  | "site-launch-1st-window"
  | "site-launch-2nd-window"
  | "graft-folder-into-site";
```

- [ ] **Step 2: Create the menu wrapper**

Create `tooling/scripts/streamline/apps/graft-folder.ts`:

```ts
import * as fs from "fs";
import * as path from "path";
import { input, number } from "@inquirer/prompts";

import { graftFolder } from "./classic-migration/studiofier/graft";

export const graftFolderIntoSite = async () => {
  console.log("Graft a folder of Studio-format JSON into an existing site.");

  const siteId = await number({
    message: "Site ID (Studio Site.id):",
    required: true,
    validate: (v) => (v !== undefined && v > 0) || "Must be a positive integer",
  });
  const parentId = await number({
    message:
      "Parent Resource ID (id of the existing Folder/Collection to graft under):",
    required: true,
    validate: (v) => (v !== undefined && v > 0) || "Must be a positive integer",
  });
  const sourceDirRaw = await input({
    message: "Absolute path to the source folder on disk:",
    validate: (v) =>
      path.isAbsolute(v) || "Must be an absolute path (starts with /)",
  });
  const sourceDir = path.resolve(sourceDirRaw);
  if (!fs.existsSync(sourceDir) || !fs.statSync(sourceDir).isDirectory()) {
    throw new Error(`Not a directory: ${sourceDir}`);
  }

  await graftFolder({
    siteId: siteId!,
    parentId: parentId!,
    sourceDir,
  });
};
```

- [ ] **Step 3: Register the menu choice and switch arm**

In `tooling/scripts/streamline/index.ts`, add the import, the choice, and the switch case. Insert the import alongside the existing app imports:

```ts
import { graftFolderIntoSite } from "./apps/graft-folder";
```

Insert this choice into the `choices` array (at the end, after the existing five):

```ts
{
  name: "Script 6: Graft folder into existing Studio site",
  description:
    "Insert a folder of Studio-format JSON under an existing Folder/Collection.",
  value: "graft-folder-into-site",
},
```

Insert this case into the `switch (script)` block, before the `default` arm:

```ts
case "graft-folder-into-site":
  await graftFolderIntoSite();
  break;
```

- [ ] **Step 4: Type-check**

Run: `npx tsc --noEmit -p tooling/scripts/tsconfig.json`
Expected: PASS. The `never` assignment in the existing `default` arm catches any forgotten case — if it errors, you missed the switch update in Step 3.

- [ ] **Step 5: Commit**

```bash
git add tooling/scripts/streamline/types.ts tooling/scripts/streamline/apps/graft-folder.ts tooling/scripts/streamline/index.ts
git commit -m "feat(streamline): add menu entry to graft folder into existing Studio site"
```

---

## Task 5: Manual verification

No automated tests are added (the spec opts out — see "Testing" section). Verify end-to-end against a Studio dev database.

- [ ] **Step 1: Prepare the test fixtures**

In a scratch directory, create a source tree like this. Each `.json` must be valid Studio-format content (you can copy real blobs from an existing Studio site's `Blob` table):

```
scratch/graft-test/
├── _meta.json                # FolderMeta
├── simple-page.json          # standalone Page
├── about/                    # Folder, synthesized index
│   └── team.json             # Page under "about"
├── policies.json             # IndexPage content for "policies/"
├── policies/                 # Folder with explicit index from policies.json
│   └── privacy.json          # Page under "policies"
└── press.json + press/       # Optionally test collection: set press.json's
                              # `layout` to "collection" and place one or more
                              # pages under press/ to exercise CollectionPage.
```

- [ ] **Step 2: Identify a target site and parent**

Connect to your Studio dev DB and pick:
- A `Site.id` (siteId) — `SELECT id, name FROM public."Site" LIMIT 5;`
- A `Resource.id` (parentId) for that site whose `type` is `Folder` or `Collection` —
  `SELECT id, permalink, type FROM public."Resource" WHERE "siteId" = <siteId> AND type IN ('Folder', 'Collection');`

Note the existing children's permalinks under that parent —
`SELECT id, permalink, type FROM public."Resource" WHERE "parentId" = <parentId>;`

- [ ] **Step 3: First run — no collisions**

From `tooling/scripts/streamline/`, run the menu:

```bash
cd tooling/scripts/streamline && npx tsx index.ts
```

Select "Script 6: Graft folder into existing Studio site". Enter the siteId, parentId, and absolute path to `scratch/graft-test/`. Expected output: per-folder "Processing folder…" logs, then "Graft complete."

Verify:

```sql
SELECT id, permalink, type FROM public."Resource"
WHERE "parentId" = <parentId> ORDER BY id DESC LIMIT 20;
```

Expected: rows for `simple-page`, `about`, `policies`, `_meta`, plus an `_index` row under each new folder.

- [ ] **Step 4: Second run — collision with `skip`**

Without changing the source dir, re-run the menu against the same site/parent. For every collision prompt, choose **"Skip"**. Expected: the script reports no inserts under the parent and exits cleanly. Verify with the same SELECT — row count unchanged.

- [ ] **Step 5: Third run — collision with `replace`**

Edit one of the source files (e.g. change a `title` in `about/team.json`). Re-run, choose **"Replace"** for the `about` collision. At the confirmation prompt, answer Yes. Expected: the old `about` subtree's Resources/Versions/Blobs are deleted; new ones with the updated title are inserted.

Verify the new content is in place:

```sql
SELECT r.id, r.title, b.content
FROM public."Resource" r
JOIN public."Version" v ON v."resourceId" = r.id
JOIN public."Blob" b ON b.id = v."blobId"
WHERE r."parentId" = (SELECT id FROM public."Resource"
                      WHERE "parentId" = <parentId> AND permalink = 'about')
  AND r.permalink = 'team';
```

- [ ] **Step 6: Negative-path checks**

Run the menu three more times with each of these bad inputs; confirm each aborts with a clear error and does not insert any rows:
1. `parentId` that does not exist (e.g. `999999999`).
2. `parentId` that belongs to a different site than the entered `siteId`.
3. `parentId` whose `type` is `Page` (not `Folder` or `Collection`).

- [ ] **Step 7: Refactor regression check**

To confirm Task 1's refactor didn't break the existing classic migration, either:
- Run an end-to-end `migrate-classic-to-next` against a known-good fixture site and diff the resulting Resource/Blob/Version rows against a previous run, **OR**
- If no fixture is available, at minimum verify `npx tsc --noEmit` still passes and visually re-read `seedDatabase` to confirm it calls `processDirectory(client, siteId, schemaDir, null)`.

- [ ] **Step 8: Final commit (if any manual fixes were needed)**

If verification surfaced bugs, fix them with small targeted commits. Otherwise this task ends with no new commit.
