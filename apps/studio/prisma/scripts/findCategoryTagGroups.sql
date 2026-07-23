-- Audit: Collection Index pages (draft or published) that already have a
-- tagCategories group labeled "Category".
--
-- Run before migrateCategoryToTagCategories.ts. An empty result means the
-- label-based skip guard is safe for that database (no pre-existing
-- "Category" groups that would be mistaken for a completed migration).
--
-- Optional: uncomment the siteId filter to scope to one site.

SELECT
  index_page."siteId",
  index_page.id AS index_resource_id,
  index_page."parentId" AS collection_id,
  collection.title AS collection_title,
  blob_side.state,
  tag_group AS category_group
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
CROSS JOIN LATERAL jsonb_array_elements(
  CASE
    WHEN jsonb_typeof(blob_side.content->'page'->'tagCategories') = 'array'
    THEN blob_side.content->'page'->'tagCategories'
    ELSE '[]'::jsonb
  END
) AS tag_group
WHERE index_page.type = 'IndexPage'
  AND tag_group->>'label' = 'Category'
  -- AND index_page."siteId" = 123
ORDER BY index_page."siteId", collection.title, blob_side.state;
