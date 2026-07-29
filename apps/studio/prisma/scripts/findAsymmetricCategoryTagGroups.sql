-- Audit Collection Index pages whose present draft and published sides disagree
-- on whether a trimmed, case-insensitive "Category" tagCategories group exists.
--
-- Run before migrateCategoryToTagCategories.ts when deciding whether the old
-- "skip if either side has Category" behavior is safe to accept. An empty
-- result means there are no asymmetric Indexes among collections where both
-- sides exist. It does NOT prove that item `tagged` values match group options;
-- run findUntaggedWithLegacyCategory.sql separately for that narrower check.
--
-- A draft-only or published-only Index is intentionally excluded. There is no
-- opposite present side for the migration to leave behind.
--
-- Optional: uncomment the siteId filter to scope to one site.

WITH index_sides AS (
  SELECT
    index_page."siteId",
    index_page.id AS index_resource_id,
    index_page."parentId" AS collection_id,
    collection.title AS collection_title,
    blob_side.state,
    EXISTS (
      SELECT 1
      FROM jsonb_array_elements(
        CASE
          WHEN jsonb_typeof(
            blob_side.content->'page'->'tagCategories'
          ) = 'array'
          THEN blob_side.content->'page'->'tagCategories'
          ELSE '[]'::jsonb
        END
      ) AS tag_group
      WHERE LOWER(TRIM(tag_group->>'label')) = 'category'
    ) AS has_category_group
  FROM "Resource" index_page
  JOIN "Resource" collection
    ON collection.id = index_page."parentId"
   AND collection.type = 'Collection'
  CROSS JOIN LATERAL (
    SELECT 'draft' AS state, draft_blob.content
    FROM "Blob" draft_blob
    WHERE draft_blob.id = index_page."draftBlobId"

    UNION ALL

    SELECT 'published' AS state, published_blob.content
    FROM "Version" published_version
    JOIN "Blob" published_blob
      ON published_blob.id = published_version."blobId"
    WHERE published_version.id = index_page."publishedVersionId"
  ) blob_side
  WHERE index_page.type = 'IndexPage'
    -- AND index_page."siteId" = 123
),
collection_status AS (
  SELECT
    "siteId",
    index_resource_id,
    collection_id,
    collection_title,
    COUNT(*) FILTER (WHERE state = 'draft') > 0 AS has_draft,
    COUNT(*) FILTER (WHERE state = 'published') > 0 AS has_published,
    COALESCE(
      BOOL_OR(has_category_group) FILTER (WHERE state = 'draft'),
      false
    ) AS draft_has_category,
    COALESCE(
      BOOL_OR(has_category_group) FILTER (WHERE state = 'published'),
      false
    ) AS published_has_category
  FROM index_sides
  GROUP BY
    "siteId",
    index_resource_id,
    collection_id,
    collection_title
)
SELECT *
FROM collection_status
WHERE has_draft
  AND has_published
  AND draft_has_category <> published_has_category
ORDER BY "siteId", collection_title;
