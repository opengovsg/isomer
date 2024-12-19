export const GET_ALL_RESOURCES_WITH_FULL_PERMALINKS = `
WITH RECURSIVE "resourcePath" (id, title, permalink, parentId, type, content, "fullPermalink", "publishedVersionId") AS (
    -- Base case for all resources
    SELECT
        r.id,
        r.title,
        r.permalink,
        r."parentId",
        r.type,
        CASE
            WHEN r.type IN ('Page', 'CollectionPage', 'CollectionLink', 'IndexPage', 'RootPage', 'FolderMeta', 'CollectionMeta') THEN b."content"
            ELSE NULL
        END AS content,
        r.permalink AS "fullPermalink",
        r."publishedVersionId"
    FROM
        public."Resource" r
    LEFT JOIN public."Version" v ON v."id" = r."publishedVersionId"
    LEFT JOIN public."Blob" b ON v."blobId" = b.id
    WHERE
        r."siteId" = $1 AND r."parentId" IS NULL

    UNION ALL

    -- Recursive case
    SELECT
        r.id,
        r.title,
        r.permalink,
        r."parentId",
        r.type,
        CASE
            WHEN r.type IN ('Page', 'CollectionPage', 'CollectionLink', 'IndexPage', 'RootPage', 'FolderMeta', 'CollectionMeta') THEN b."content"
            ELSE NULL
        END AS content,
        CONCAT(path."fullPermalink", '/', r.permalink) AS "fullPermalink",
        r."publishedVersionId"
    FROM
        public."Resource" r
    LEFT JOIN public."Version" v ON v."id" = r."publishedVersionId"
    LEFT JOIN public."Blob" b ON v."blobId" = b.id
    -- This join determines if the recursion continues if there are more rows
    INNER JOIN "resourcePath" path ON r."parentId" = path.id
    WHERE
        r."siteId" = $1
)
SELECT * FROM "resourcePath";
`

export const GET_NAVBAR = `
SELECT content FROM public."Navbar" WHERE "siteId" = $1;
`

export const GET_FOOTER = `
SELECT content FROM public."Footer" WHERE "siteId" = $1;
`

export const GET_CONFIG = `
SELECT name, config, theme FROM public."Site" WHERE "id" = $1;
`
