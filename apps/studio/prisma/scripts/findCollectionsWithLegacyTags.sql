-- Audit: Collections with at least one Item that still carries usable legacy
-- `page.tags` on a draft or published side whose `page.tagged` is empty or
-- missing.
--
-- Run before migrateTagsToTagCategories.ts for a per-collection roll-up of
-- findItemsWithLegacyTags.sql. `items_with_unmigrated_legacy_tags` counts
-- distinct CollectionPage / CollectionLink resources with at least one side
-- that has usable legacy tags and no `tagged` values yet.
--
-- "Usable" matches collateLegacyTags in migrateTagsToTagCategories.ts: a
-- non-empty trimmed category AND at least one non-empty trimmed selected value.
-- Sides with a non-empty `tagged` array are excluded.
--
-- Optional: uncomment the siteId filter to scope to one site.

SELECT
  item."siteId",
  collection.id AS collection_id,
  collection.title AS collection_title,
  COUNT(DISTINCT item.id) AS items_with_unmigrated_legacy_tags
FROM "Resource" item
JOIN "Resource" collection
  ON collection.id = item."parentId"
 AND collection.type = 'Collection'
CROSS JOIN LATERAL (
  SELECT 'draft' AS state, draft_blob.content
  FROM "Blob" draft_blob
  WHERE draft_blob.id = item."draftBlobId"

  UNION ALL

  SELECT 'published' AS state, published_blob.content
  FROM "Version" published_version
  JOIN "Blob" published_blob
    ON published_blob.id = published_version."blobId"
  WHERE published_version.id = item."publishedVersionId"
) blob_side
WHERE item.type IN ('CollectionPage', 'CollectionLink')
  AND EXISTS (
    SELECT 1
    FROM jsonb_array_elements(
      CASE
        WHEN jsonb_typeof(blob_side.content->'page'->'tags') = 'array'
        THEN blob_side.content->'page'->'tags'
        ELSE '[]'::jsonb
      END
    ) AS tag_entry
    CROSS JOIN LATERAL jsonb_array_elements_text(
      CASE
        WHEN jsonb_typeof(tag_entry->'selected') = 'array'
        THEN tag_entry->'selected'
        ELSE '[]'::jsonb
      END
    ) AS selected_value
    WHERE NULLIF(TRIM(tag_entry->>'category'), '') IS NOT NULL
      AND NULLIF(TRIM(selected_value), '') IS NOT NULL
  )
  AND (
    blob_side.content->'page'->'tagged' IS NULL
    OR jsonb_typeof(blob_side.content->'page'->'tagged') = 'null'
    OR blob_side.content->'page'->'tagged' = '[]'::jsonb
  )
  -- AND item."siteId" = 123
GROUP BY
  item."siteId",
  collection.id,
  collection.title
ORDER BY
  item."siteId",
  collection.title;
