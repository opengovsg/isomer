export const GET_ALL_RESOURCES_WITH_FULL_PERMALINKS = `
WITH RECURSIVE "resourcePath" (id, title, permalink, parentId, type, "fullPermalink", "blobId") AS (
    -- Base case for all resources
    SELECT
        r.id,
        r.title,
        r.permalink,
        r."parentId",
        r.type,
        r.permalink AS "fullPermalink",
        v."blobId"
    FROM
        public."Resource" r
    LEFT JOIN public."Version" v ON v."id" = r."publishedVersionId"
    WHERE r."siteId" = $1 AND r."parentId" IS NULL

    UNION ALL

    -- Recursive case
    SELECT
        r.id,
        r.title,
        r.permalink,
        r."parentId",
        r.type,
        CONCAT(path."fullPermalink", '/', r.permalink) AS "fullPermalink",
        v."blobId"
    FROM
        public."Resource" r
    LEFT JOIN public."Version" v ON v."id" = r."publishedVersionId"

    -- This join determines if the recursion continues if there are more rows
    INNER JOIN "resourcePath" path ON r."parentId" = path.id
    WHERE r."siteId" = $1
)

SELECT * FROM "resourcePath";
`;
