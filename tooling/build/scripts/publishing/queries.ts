// queries.ts

export const GET_ALL_RESOURCES_WITH_FULL_PERMALINKS = `
  WITH RECURSIVE resource_path (id, title, permalink, parentId, type, content, "fullPermalink") AS (
    SELECT
      r.id,
      r.title,
      r.permalink,
      r."parentId",
      r.type,
      b."content",
      r.permalink AS "fullPermalink"
    FROM
      public."Resource" r
      LEFT JOIN public."Version" v ON v."id" = r."publishedVersionId"
      LEFT JOIN public."Blob" b ON v."blobId" = b.id
    WHERE
      r."parentId" IS NULL AND r."siteId" = $1

    UNION ALL

    SELECT
      r.id,
      r.title,
      r.permalink,
      r."parentId",
      r.type,
      b."content",
      CONCAT(path."fullPermalink", '/', r.permalink) AS "fullPermalink"
    FROM
      public."Resource" r
      LEFT JOIN public."Version" v ON v."id" = r."publishedVersionId"
      LEFT JOIN public."Blob" b ON v."blobId" = b.id
      INNER JOIN resource_path path ON r."parentId" = path.id
  )
  SELECT * FROM resource_path;
`;

export const GET_NAVBAR = `
  SELECT content FROM public."Navbar" WHERE "siteId" = $1;
`;

export const GET_FOOTER = `
  SELECT content FROM public."Footer" WHERE "siteId" = $1;
`;

export const GET_CONFIG = `
  SELECT config FROM public."Site" WHERE "id" = $1;
`;
