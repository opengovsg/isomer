-- Audit: Collection Items (draft or published) that still carry usable legacy
-- `page.tags` values (`{ category: string, selected: string[] }[]`).
--
-- Run before migrateTagsToTagCategories.ts to inventory items whose legacy tag
-- data the migration will read. "Usable" matches collateLegacyTags in that
-- script: a non-empty trimmed category AND at least one non-empty trimmed
-- selected value. Empty arrays, missing fields, and entries with only blank
-- strings are excluded.
--
-- migrateTagsToTagCategories.ts copies these values into `tagCategories` on
-- the Index and appends matching option UUIDs to each item's `tagged` array.
-- The legacy `tags` field is left untouched — this query will still return
-- rows after a successful migration until a later cleanup removes `tags`.
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
  -- AND item."siteId" = 123
ORDER BY
  item."siteId",
  collection.title,
  item.id,
  blob_side.state;
