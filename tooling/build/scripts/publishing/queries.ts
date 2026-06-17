export const GET_ALL_RESOURCES_WITH_FULL_PERMALINKS = `
WITH RECURSIVE "resourcePath" (id, title, permalink, parentId, type, content, "fullPermalink", "publishedVersionId", "updatedAt") AS (
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
        r."publishedVersionId",
        r."updatedAt"
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
        r."publishedVersionId",
        r."updatedAt"
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

// Internal-page destinations are stored as "[resource:siteId:resourceId]"
// references so a redirect follows the page when its permalink changes. We
// resolve each reference to the page's current full permalink at publish time
// by walking the resource tree (same shape as
// GET_ALL_RESOURCES_WITH_FULL_PERMALINKS). Non-reference destinations (literal
// paths and external https URLs) pass through untouched.
//
// A reference resolves to NULL — and the redirect is dropped — when its target
// no longer exists OR is no longer published ("publishedVersionId" IS NULL): a
// redirect to a deleted or unpublished page is broken, so we don't publish it.
//
// The trailing "_index" segment is stripped to match getConvertedPermalink in
// index.ts (an index page represents its folder, so it has no URL of its own);
// this keeps the published target identical to what the editor displays.
export const GET_REDIRECTS = `
WITH RECURSIVE "resourcePath" (id, "publishedVersionId", "parentId", "fullPermalink") AS (
    SELECT r.id, r."publishedVersionId", r."parentId", r.permalink AS "fullPermalink"
    FROM public."Resource" r
    WHERE r."siteId" = $1 AND r."parentId" IS NULL

    UNION ALL

    SELECT r.id, r."publishedVersionId", r."parentId", CONCAT(path."fullPermalink", '/', r.permalink)
    FROM public."Resource" r
    INNER JOIN "resourcePath" path ON r."parentId" = path.id
    WHERE r."siteId" = $1
)
SELECT source, destination FROM (
    SELECT
        redirect.source AS source,
        CASE
            WHEN redirect.destination ~ '^\\[resource:\\d+:\\d+\\]$'
            -- "||" (not CONCAT) so an unresolved reference stays NULL and is
            -- dropped below; CONCAT would coerce NULL to '' and emit "/"
            THEN '/' || regexp_replace(rp."fullPermalink", '(^|/)_index$', '')
            ELSE redirect.destination
        END AS destination
    FROM public."Redirect" redirect
    LEFT JOIN "resourcePath" rp
        ON redirect.destination ~ '^\\[resource:\\d+:\\d+\\]$'
        AND rp.id = CAST(substring(redirect.destination from '\\[resource:\\d+:(\\d+)\\]') AS bigint)
        AND rp."publishedVersionId" IS NOT NULL
    WHERE redirect."siteId" = $1 AND redirect."deletedAt" IS NULL
) resolved
WHERE resolved.destination IS NOT NULL;
`
