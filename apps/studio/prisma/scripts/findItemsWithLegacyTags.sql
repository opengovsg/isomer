-- Audit: Collection Items (draft or published) that still carry usable legacy
-- `page.tags` values (`{ category: string, selected: string[] }[]`) on a side
-- whose `page.tagged` is empty or missing.
--
-- Run before migrateTagsToTagCategories.ts to inventory items whose legacy tag
-- data the migration still needs to backfill. "Usable" matches collateLegacyTags
-- in that script: a non-empty trimmed category AND at least one non-empty
-- trimmed selected value. Empty arrays, missing fields, and entries with only
-- blank strings are excluded.
--
-- Sides with a non-empty `tagged` array are excluded — that implies the item
-- side has already been migrated (including via migrateCategoryToTagCategories.ts).
-- The legacy `tags` field is left untouched by migrateTagsToTagCategories.ts,
-- so migrated sides may still carry `tags` in blob content but will not appear
-- here.
--
-- Pair with findCollectionsWithLegacyTags.sql for a per-collection roll-up, and
-- findDivergentTagOptionIds.sql for cross-side option-id divergence on the
-- Index before migrating.
--
-- Optional: uncomment the siteId filter to scope to one site.

SELECT
  item."siteId",
  item.id AS resource_id,
  item.title,
  item.type,
  item."parentId" AS collection_id,
  collection.title AS collection_title,
  blob_side.state,
  blob_side.content->'page'->'tags' AS tags,
  blob_side.content->'page'->'tagged' AS tagged
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
ORDER BY
  item."siteId",
  collection.title,
  item.id,
  blob_side.state;
