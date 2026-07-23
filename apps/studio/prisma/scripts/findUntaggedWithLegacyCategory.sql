-- Items with a non-empty legacy `category` but empty/missing `tagged`.
--
-- ONLY SearchSG / Algolia ingestion is affected by this shape.
-- schedulePushDocumentJob derives SearchSG `categories` / Algolia `subCategory`
-- from `page.tagged[0]`. That cron only runs for resources with a
-- PushDocumentJob row (gazettes). Ordinary CollectionPage / CollectionLink
-- items are NOT search-ingested on this path — filling their `tagged` after
-- migration does not change SearchSG or Algolia.
--
-- After migrateCategoryToTagCategories.ts, matching items get
-- `tagged: [categoryOptionId]`. For rows with `has_push_document_job = true`,
-- the next PushDocumentJob run can start emitting the legacy category label
-- as the search subcategory where it was previously empty.
--
-- Risk accepted (2026-07-23): audited environments had zero rows with
-- `has_push_document_job = true` in this result set. The migration still
-- proceeds; re-run this query before each environment if you want to
-- reconfirm.
--
-- Optional: uncomment the siteId filter to scope to one site.
-- Optional: uncomment the has_push_document_job filter to show only
-- search-ingestion-relevant rows.

SELECT
  item."siteId",
  item.id AS resource_id,
  item.title,
  item.type,
  item."parentId" AS collection_id,
  collection.title AS collection_title,
  blob_side.state,
  NULLIF(TRIM(blob_side.content->'page'->>'category'), '') AS category,
  blob_side.content->'page'->'tagged' AS tagged,
  -- true = gazette/search path (SearchSG / Algolia). false = not search-ingested.
  EXISTS (
    SELECT 1
    FROM "PushDocumentJob" j
    WHERE j."resourceId" = item.id
  ) AS has_push_document_job
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
  AND NULLIF(TRIM(blob_side.content->'page'->>'category'), '') IS NOT NULL
  AND (
    blob_side.content->'page'->'tagged' IS NULL
    OR jsonb_typeof(blob_side.content->'page'->'tagged') = 'null'
    OR blob_side.content->'page'->'tagged' = '[]'::jsonb
  )
  -- AND item."siteId" = 123
  -- AND EXISTS (
  --   SELECT 1 FROM "PushDocumentJob" j WHERE j."resourceId" = item.id
  -- )
ORDER BY
  has_push_document_job DESC,
  item."siteId",
  collection.title,
  item.id,
  blob_side.state;
