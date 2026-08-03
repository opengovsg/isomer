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

// Internal destinations are stored as "[resource:siteId:resourceId]" references
// so a redirect follows the page when its permalink changes. At publish time we
// resolve each reference to the target's current full permalink. Rather than
// materialise every resource's permalink, we resolve only the resources a
// redirect actually references and walk UP the tree from each to its root — so
// cost scales with the number of referencing redirects, not the site's size
// (and does no tree walk at all when no redirect references a resource).
//
// A Folder/Collection reference resolves via its published IndexPage child (the
// container has no version of its own); the trailing "_index"/"_meta" is
// stripped to match getConvertedPermalink in index.ts. Non-reference
// destinations (literal paths, external https URLs) pass through untouched. A
// reference resolves to NULL — and the redirect is dropped — when nothing live
// matches (deleted/unpublished target, or a reference to another site).
export const GET_REDIRECTS = `
WITH RECURSIVE
    -- Distinct resourceIds referenced by this site's own redirects. The
    -- embedded siteId must equal $1, else the reference can't resolve here.
    "referenced" AS (
        SELECT DISTINCT
            CAST(substring(destination from '\\[resource:\\d+:(\\d+)\\]') AS bigint) AS "resourceId"
        FROM public."Redirect"
        WHERE "siteId" = $1
            AND "deletedAt" IS NULL
            AND destination ~ '^\\[resource:\\d+:\\d+\\]$'
            AND CAST(substring(destination from '\\[resource:(\\d+):\\d+\\]') AS bigint) = $1
    ),
    -- The published resource each reference resolves to: the referenced page
    -- itself, or the published IndexPage child of a referenced container.
    "target" AS (
        SELECT ref."resourceId", r."parentId", r.permalink AS "fullPermalink"
        FROM "referenced" ref
        INNER JOIN public."Resource" r
            ON r."siteId" = $1
            AND r."publishedVersionId" IS NOT NULL
            AND (
                r.id = ref."resourceId"
                OR (r."type" = 'IndexPage' AND r."parentId" = ref."resourceId")
            )
    ),
    -- Walk UP from each target to its root, prepending ancestor permalinks so
    -- the assembled "fullPermalink" matches the old top-down walk exactly.
    "resolved" ("resourceId", "parentId", "fullPermalink") AS (
        SELECT "resourceId", "parentId", "fullPermalink" FROM "target"

        UNION ALL

        SELECT res."resourceId", r."parentId", CONCAT(r.permalink, '/', res."fullPermalink")
        FROM "resolved" res
        INNER JOIN public."Resource" r ON r.id = res."parentId" AND r."siteId" = $1
    )
SELECT source, destination FROM (
    SELECT
        redirect.source AS source,
        CASE
            WHEN redirect.destination ~ '^\\[resource:\\d+:\\d+\\]$'
            -- "||" (not CONCAT) so an unresolved reference stays NULL and is
            -- dropped below; CONCAT would coerce NULL to '' and emit "/".
            -- Strips a trailing "_index"/"_meta" to match getConvertedPermalink.
            THEN '/' || regexp_replace(root."fullPermalink", '(^|/)(_index|_meta)$', '')
            ELSE redirect.destination
        END AS destination
    FROM public."Redirect" redirect
    LEFT JOIN (
        SELECT "resourceId", "fullPermalink" FROM "resolved" WHERE "parentId" IS NULL
    ) root
        ON redirect.destination ~ '^\\[resource:\\d+:\\d+\\]$'
        -- The reference's siteId must match this site ($1); a mismatched
        -- reference can't resolve here even if its resourceId exists locally.
        AND CAST(substring(redirect.destination from '\\[resource:(\\d+):\\d+\\]') AS bigint) = $1
        AND root."resourceId" = CAST(substring(redirect.destination from '\\[resource:\\d+:(\\d+)\\]') AS bigint)
    WHERE redirect."siteId" = $1 AND redirect."deletedAt" IS NULL
) resolved_redirects
WHERE resolved_redirects.destination IS NOT NULL;
`
