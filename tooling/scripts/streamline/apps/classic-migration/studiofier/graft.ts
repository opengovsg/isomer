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
