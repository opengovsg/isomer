import * as fs from "fs";
import { Client } from "pg";
import { Tagged } from "type-fest";

export const readAllFiles = (path: string): string[] => {
  if (fs.statSync(path).isFile()) {
    return [path];
  }

  const entries = fs.readdirSync(path, { withFileTypes: true });
  return entries.flatMap((ent) => {
    if (ent.isDirectory()) return readAllFiles(`${ent.parentPath}/${ent.name}`);
    return [`${ent.parentPath}/${ent.name}`];
  });
};

type SanitisedAssetName = Tagged<string, "SanitisedAssetName">;
export const getSanitisedAssetName = (name: string): SanitisedAssetName => {
  const withoutLeadingSlash = name.startsWith("/") ? name.slice(1) : name;

  return withoutLeadingSlash.replaceAll("/", "-") as SanitisedAssetName;
};

// FIXME: We should use kysely and extract db into its own package
export async function createBlob(
  client: Client,
  content: any,
): Promise<number> {
  if (!content.page) {
    // For _pages.json
    const result = await client.query(
      `INSERT INTO public."Blob" (content) VALUES ($1) RETURNING id`,
      [JSON.stringify(content)],
    );
    return result.rows[0].id;
  }

  const { permalink, lastModified, ...rest } = content.page;
  const newContent = {
    ...content,
    page: rest,
  };

  const result = await client.query(
    `INSERT INTO public."Blob" (content) VALUES ($1) RETURNING id`,
    [content],
  );
  return result.rows[0].id;
}

export const getRootPageId = async (
  client: Client,
  siteId: number,
): Promise<number> => {
  const result = await client.query(
    `SELECT "id" FROM "Resource" WHERE "siteId" = ${siteId} AND "type" = 'RootPage'`,
  );

  return result.rows[0].id;
};

export const getResourceId = async (client: Client, resourceId: number) => {
  const result = await client.query(
    `SELECT "id" FROM "Resource" WHERE "id" = ${resourceId}`,
  );

  return result.rows[0].id;
};

export async function createResource(
  client: Client,
  {
    title,
    permalink,
    parentId,
    type,
    siteId,
  }: {
    title: string;
    permalink: string;
    parentId: number | null;
    type:
      | "Page"
      | "Folder"
      | "IndexPage"
      | "RootPage"
      | "Collection"
      | "CollectionPage"
      | "CollectionLink"
      | "FolderMeta";
    siteId: number;
  },
): Promise<number> {
  const result = await client.query(
    `INSERT INTO public."Resource" (title, permalink, "parentId", type, state, "publishedVersionId", "siteId") VALUES ($1, $2, $3, $4, $5, NULL, $6) RETURNING id`,
    [title, permalink, parentId, type, "Published", siteId],
  );
  return result.rows[0].id;
}

export const addBlobToResource = async (
  client: Client,
  resourceId: number,
  blobId: number,
) => {
  await client.query(
    `UPDATE "Resource" SET "draftBlobId" = ${blobId} WHERE "id" = ${resourceId}`,
  );
};

export async function createVersion(
  client: Client,
  resourceId: number,
  blobId: number,
) {
  const result = await client.query(
    `INSERT INTO public."Version" ("resourceId", "blobId", "versionNum", "publishedBy") VALUES ($1, $2, $3, $4) RETURNING id`,
    [resourceId, blobId, 1, process.env.PUBLISHER_USER_ID],
  );
  const versionId = result.rows[0].id;

  // Update the resource with the new publishedVersionId
  await client.query(
    `UPDATE public."Resource" SET "publishedVersionId" = $1 WHERE id = $2`,
    [versionId, resourceId],
  );
}
