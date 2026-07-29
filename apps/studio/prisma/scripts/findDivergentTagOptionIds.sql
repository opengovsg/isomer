-- Audit Collection Indexes whose draft and published sides both carry the same
-- tagCategories option label (trimmed, case-insensitive) under DIFFERENT ids.
--
-- Run before migrateTagsToTagCategories.ts. That script canonicalizes option ids
-- across sides only for labels it has to ADD (see `canonicalizeGroupOptionIds`).
-- When both sides ALREADY carry a label under different ids, neither side needs
-- an addition, so the divergence is left in place and each side's items are
-- tagged with that side's own id — correct against the Index as it stands today.
-- It stays correct only until someone publishes the draft Index: publish
-- replaces live `tagCategories` wholesale and does NOT republish items, so a
-- published item whose `tagged` holds a published-only id stops resolving and
-- drops out of tag-based filtering.
--
-- An empty result means no such divergence exists and that "leave it alone"
-- behavior costs nothing in the audited environment.
--
-- `published_items_orphaned_on_index_publish` is the blast radius: published
-- Collection Items under the collection whose `tagged` references an id present
-- on the published Index but absent from every draft Index group. Rows with 0
-- are divergence with no current victims — still worth reporting, because the
-- migration is about to add `tagged` references to the published-side id.
--
-- Draft-only ids are NOT reported as a hazard: the draft Index is not live, and
-- a draft item resolving against the draft Index is self-consistent.
--
-- Indexes with only one present side are excluded — with no opposite side there
-- is no cross-side divergence to have. Labels missing from one side are also not
-- reported: those are additions, and the migration already gives them one shared
-- id across both sides.
--
-- Optional: uncomment the siteId filter to scope to one site.

WITH index_sides AS (
  SELECT
    index_page."siteId",
    index_page.id AS index_resource_id,
    index_page."parentId" AS collection_id,
    collection.title AS collection_title,
    blob_side.state,
    blob_side.content
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
both_sides AS (
  SELECT *
  FROM index_sides
  WHERE index_resource_id IN (
    SELECT index_resource_id
    FROM index_sides
    GROUP BY index_resource_id
    HAVING COUNT(DISTINCT state) = 2
  )
),
side_options AS (
  SELECT
    sides."siteId",
    sides.index_resource_id,
    sides.collection_id,
    sides.collection_title,
    sides.state,
    LOWER(TRIM(tag_group->>'label')) AS group_key,
    LOWER(TRIM(tag_option->>'label')) AS option_key,
    TRIM(tag_group->>'label') AS group_label,
    TRIM(tag_option->>'label') AS option_label,
    TRIM(tag_option->>'id') AS option_id
  FROM both_sides sides
  CROSS JOIN LATERAL jsonb_array_elements(
    CASE
      WHEN jsonb_typeof(sides.content->'page'->'tagCategories') = 'array'
      THEN sides.content->'page'->'tagCategories'
      ELSE '[]'::jsonb
    END
  ) AS tag_group
  CROSS JOIN LATERAL jsonb_array_elements(
    CASE
      WHEN jsonb_typeof(tag_group->'options') = 'array'
      THEN tag_group->'options'
      ELSE '[]'::jsonb
    END
  ) AS tag_option
  WHERE NULLIF(TRIM(tag_option->>'id'), '') IS NOT NULL
    AND NULLIF(TRIM(tag_option->>'label'), '') IS NOT NULL
),
-- All ids the draft Index resolves, across every group. A published id missing
-- from this set is what a future Index publish would orphan.
draft_option_ids_by_index AS (
  SELECT
    index_resource_id,
    ARRAY_AGG(DISTINCT option_id) AS option_ids
  FROM side_options
  WHERE state = 'draft'
  GROUP BY index_resource_id
),
per_label AS (
  SELECT
    "siteId",
    index_resource_id,
    collection_id,
    collection_title,
    group_key,
    option_key,
    -- Report the live side's casing; MIN over both sides would be
    -- collation-dependent when the two sides disagree on case.
    MIN(group_label) FILTER (WHERE state = 'published') AS group_label,
    MIN(option_label) FILTER (WHERE state = 'published') AS option_label,
    ARRAY_AGG(DISTINCT option_id ORDER BY option_id)
      FILTER (WHERE state = 'draft') AS draft_option_ids,
    ARRAY_AGG(DISTINCT option_id ORDER BY option_id)
      FILTER (WHERE state = 'published') AS published_option_ids
  FROM side_options
  GROUP BY
    "siteId",
    index_resource_id,
    collection_id,
    collection_title,
    group_key,
    option_key
),
divergent AS (
  SELECT *
  FROM per_label
  WHERE draft_option_ids IS NOT NULL
    AND published_option_ids IS NOT NULL
    AND draft_option_ids <> published_option_ids
)
SELECT
  divergent."siteId",
  divergent.collection_id,
  divergent.collection_title,
  divergent.index_resource_id,
  divergent.group_label,
  divergent.option_label,
  divergent.draft_option_ids,
  divergent.published_option_ids,
  orphaned.option_ids AS orphaned_option_ids,
  (
    SELECT COUNT(*)
    FROM "Resource" item
    JOIN "Version" item_version
      ON item_version.id = item."publishedVersionId"
    JOIN "Blob" item_blob
      ON item_blob.id = item_version."blobId"
    WHERE item."parentId" = divergent.collection_id
      AND item.type IN ('CollectionPage', 'CollectionLink')
      AND jsonb_typeof(item_blob.content->'page'->'tagged') = 'array'
      AND EXISTS (
        SELECT 1
        FROM jsonb_array_elements_text(
          item_blob.content->'page'->'tagged'
        ) AS tagged(option_id)
        WHERE tagged.option_id = ANY(orphaned.option_ids)
      )
  ) AS published_items_orphaned_on_index_publish
FROM divergent
CROSS JOIN LATERAL (
  SELECT ARRAY(
    SELECT UNNEST(divergent.published_option_ids)
    EXCEPT
    SELECT UNNEST(
      COALESCE(draft_ids.option_ids, ARRAY[]::text[])
    )
  ) AS option_ids
  FROM draft_option_ids_by_index draft_ids
  WHERE draft_ids.index_resource_id = divergent.index_resource_id
) orphaned
ORDER BY
  published_items_orphaned_on_index_publish DESC,
  divergent."siteId",
  divergent.collection_title,
  divergent.group_label,
  divergent.option_label;
