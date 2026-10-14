import type { Client } from "pg";

import type { AssetsMap } from "../types";
import { buildAssetReplacementEntries } from "./rewrite-asset-paths";

const GET_ALL_RESOURCES_WITH_FULL_PERMALINKS = `
WITH RECURSIVE "resourcePath" (id, title, permalink, "parentId", type, "fullPermalink") AS (
    SELECT
        r.id,
        r.title,
        r.permalink,
        r."parentId",
        r.type,
        r.permalink AS "fullPermalink"
    FROM
        public."Resource" r
    WHERE r."siteId" = $1 AND r."parentId" IS NULL

    UNION ALL

    SELECT
        r.id,
        r.title,
        r.permalink,
        r."parentId",
        r.type,
        CONCAT(path."fullPermalink", '/', r.permalink) AS "fullPermalink"
    FROM
        public."Resource" r
    INNER JOIN "resourcePath" path ON r."parentId" = path.id
    WHERE r."siteId" = $1
)

SELECT id, "fullPermalink" FROM "resourcePath";
`;

type StudioifyResource = {
  id: string;
  fullPermalink: string;
};

type ResourcesMap = Record<string, StudioifyResource>;

const studioifyContent = (
  content: string,
  siteId: string,
  assetsMap: AssetsMap,
  resourcesMap: ResourcesMap,
): string => {
  let newContent = content;

  for (const [oldPath, newPath] of buildAssetReplacementEntries(assetsMap)) {
    newContent = newContent
      .replaceAll(`"${oldPath}"`, `"${newPath}"`)
      .replaceAll(`'${oldPath}'`, `'${newPath}'`);
  }

  for (const page of Object.keys(resourcesMap).sort(
    (a, b) => b.length - a.length,
  )) {
    const resourceId = resourcesMap[page]?.id;
    if (!resourceId) {
      continue;
    }

    const resourceRef = `[resource:${siteId}:${resourceId}]`;
    newContent = newContent
      .replaceAll(`"${page}"`, `"${resourceRef}"`)
      .replaceAll(`"${page}/"`, `"${resourceRef}"`)
      .replaceAll(`'${page}'`, `'${resourceRef}'`)
      .replaceAll(`'${page}/'`, `'${resourceRef}'`);
  }

  return newContent;
};

const buildResourcesMap = (
  resources: Array<{ id: string; fullPermalink: string }>,
): ResourcesMap => {
  const resourcesMap: ResourcesMap = {};

  for (const resource of resources) {
    resourcesMap[`/${resource.fullPermalink.replace(/^\/+/, "")}`] = resource;
  }

  return resourcesMap;
};

const getSiteResourcesMap = async (
  client: Client,
  siteId: string,
): Promise<ResourcesMap> => {
  const result = await client.query<{
    id: string;
    fullPermalink: string;
  }>(GET_ALL_RESOURCES_WITH_FULL_PERMALINKS, [siteId]);

  return buildResourcesMap(result.rows);
};

export const studioifyContainerPublished = async ({
  client,
  siteId,
  containerId,
  assetsMap,
}: {
  client: Client;
  siteId: string;
  containerId: string;
  assetsMap: AssetsMap;
}): Promise<number> => {
  const resourcesMap = await getSiteResourcesMap(client, siteId);

  const children = await client.query<{
    id: string;
    permalink: string;
    blobId: string;
    content: unknown;
  }>(
    `SELECT r.id, r.permalink, v."blobId", b.content
     FROM "Resource" r
     INNER JOIN "Version" v ON r."publishedVersionId" = v.id
     INNER JOIN "Blob" b ON v."blobId" = b.id
     WHERE r."parentId" = $1`,
    [containerId],
  );

  let studioifiedCount = 0;

  for (const child of children.rows) {
    const rawContent = JSON.stringify(child.content);
    const updatedContent = studioifyContent(
      rawContent,
      siteId,
      assetsMap,
      resourcesMap,
    );

    await client.query(`UPDATE "Blob" SET content = $1 WHERE id = $2`, [
      updatedContent,
      child.blobId,
    ]);

    console.log(`Studioified published page: ${child.permalink} (${child.id})`);
    studioifiedCount += 1;
  }

  return studioifiedCount;
};
