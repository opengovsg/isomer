-- Audit: individual Collections still pending category → tagCategories migration.
-- Same logic as findPendingCategoryMigrationSites.sql, but lists each collection
-- with migration_status = 'would_migrate'.
--
-- Use this to build SITE_IDS_INCLUDE for a targeted retry after a failed run,
-- or to inspect which Index sides / legacy categories still need work.
--
-- Columns:
--   site_id / site_name           — owning site
--   collection_id / collection_title
--   migration_status              — always 'would_migrate' in this result set
--   has_draft / has_published     — which Index sides exist
--   draft_has_category_group      — draft Index already has a "Category" group
--   published_has_category_group  — published Index already has a "Category" group
--   has_legacy_categories         — any item has a non-empty legacy `category`
--
-- Caveat: a human-created "Category" tag group is treated as migrated (same as
-- the script). Audit ambiguous cases with findCategoryTagGroups.sql first.
--
-- Optional: uncomment the siteId filter in collection_eval to scope one site.
--
-- Usage:
--   cd apps/studio
--   source .env && psql "$DATABASE_URL" -f prisma/scripts/findPendingCategoryMigrationCollections.sql

WITH collections AS (
  SELECT
    r.id AS collection_id,
    r."siteId",
    r.title AS collection_title
  FROM "Resource" r
  WHERE r.type = 'Collection'
),

index_pages AS (
  SELECT
    c.collection_id,
    c."siteId",
    c.collection_title,
    idx.id AS index_resource_id,
    draft_blob.content AS draft_content,
    published_blob.content AS published_content
  FROM collections c
  LEFT JOIN "Resource" idx
    ON idx."parentId" = c.collection_id
   AND idx.type = 'IndexPage'
   AND idx."siteId" = c."siteId"
  LEFT JOIN "Blob" draft_blob
    ON draft_blob.id = idx."draftBlobId"
  LEFT JOIN "Version" published_version
    ON published_version.id = idx."publishedVersionId"
  LEFT JOIN "Blob" published_blob
    ON published_blob.id = published_version."blobId"
),

index_groups AS (
  SELECT
    ip.*,
    (
      SELECT tag_group
      FROM jsonb_array_elements(
        CASE
          WHEN jsonb_typeof(ip.draft_content->'page'->'tagCategories') = 'array'
          THEN ip.draft_content->'page'->'tagCategories'
          ELSE '[]'::jsonb
        END
      ) AS tag_group
      WHERE LOWER(TRIM(tag_group->>'label')) = 'category'
      LIMIT 1
    ) AS draft_category_group,
    (
      SELECT tag_group
      FROM jsonb_array_elements(
        CASE
          WHEN jsonb_typeof(ip.published_content->'page'->'tagCategories') = 'array'
          THEN ip.published_content->'page'->'tagCategories'
          ELSE '[]'::jsonb
        END
      ) AS tag_group
      WHERE LOWER(TRIM(tag_group->>'label')) = 'category'
      LIMIT 1
    ) AS published_category_group
  FROM index_pages ip
),

item_sides AS (
  SELECT
    item."parentId" AS collection_id,
    item."siteId",
    NULLIF(TRIM(blob_side.content->'page'->>'category'), '') AS category,
    blob_side.content->'page'->'tagged' AS tagged
  FROM "Resource" item
  CROSS JOIN LATERAL (
    SELECT draft_blob.content
    FROM "Blob" draft_blob
    WHERE draft_blob.id = item."draftBlobId"

    UNION ALL

    SELECT published_blob.content
    FROM "Version" published_version
    JOIN "Blob" published_blob
      ON published_blob.id = published_version."blobId"
    WHERE published_version.id = item."publishedVersionId"
  ) blob_side
  WHERE item.type IN ('CollectionPage', 'CollectionLink')
),

distinct_item_categories AS (
  SELECT DISTINCT
    collection_id,
    "siteId",
    LOWER(category) AS normalized_category
  FROM item_sides
  WHERE category IS NOT NULL
),

collection_eval AS (
  SELECT
    ig.collection_id,
    ig."siteId",
    ig.collection_title,
    ig.index_resource_id,
    (ig.draft_content IS NOT NULL) AS has_draft,
    (ig.published_content IS NOT NULL) AS has_published,
    ig.draft_category_group,
    ig.published_category_group,
    COALESCE(ig.draft_category_group, ig.published_category_group) AS existing_category_group,
    EXISTS (
      SELECT 1
      FROM distinct_item_categories dic
      WHERE dic.collection_id = ig.collection_id
    ) AS has_legacy_categories
  FROM index_groups ig
  -- WHERE ig."siteId" = 123
),

collection_status AS (
  SELECT
    ce.*,
    CASE
      WHEN ce.index_resource_id IS NULL
        OR (NOT ce.has_draft AND NOT ce.has_published)
        THEN 'no_index'

      WHEN ce.draft_category_group IS NOT NULL
       AND ce.published_category_group IS NOT NULL
       AND (
         ce.draft_category_group->>'id' IS DISTINCT FROM ce.published_category_group->>'id'
         OR jsonb_array_length(ce.draft_category_group->'options')
            IS DISTINCT FROM jsonb_array_length(ce.published_category_group->'options')
         OR EXISTS (
           SELECT 1
           FROM jsonb_array_elements(ce.published_category_group->'options') pub_opt
           WHERE NOT EXISTS (
             SELECT 1
             FROM jsonb_array_elements(ce.draft_category_group->'options') draft_opt
             WHERE LOWER(TRIM(draft_opt->>'label')) = LOWER(TRIM(pub_opt->>'label'))
               AND draft_opt->>'id' = pub_opt->>'id'
           )
         )
       )
        THEN 'conflicting_category_groups'

      WHEN ce.existing_category_group IS NULL
       AND NOT ce.has_legacy_categories
        THEN 'no_categories'

      WHEN
        (ce.has_draft AND ce.draft_category_group IS NULL)
        OR (ce.has_published AND ce.published_category_group IS NULL)
        OR EXISTS (
          SELECT 1
          FROM distinct_item_categories dic
          WHERE dic.collection_id = ce.collection_id
            AND NOT EXISTS (
              SELECT 1
              FROM jsonb_array_elements(
                COALESCE(ce.existing_category_group->'options', '[]'::jsonb)
              ) opt
              WHERE LOWER(TRIM(opt->>'label')) = dic.normalized_category
            )
        )
        OR EXISTS (
          SELECT 1
          FROM item_sides iside
          WHERE iside.collection_id = ce.collection_id
            AND iside.category IS NOT NULL
            AND NOT EXISTS (
              SELECT 1
              FROM jsonb_array_elements(
                COALESCE(ce.existing_category_group->'options', '[]'::jsonb)
              ) opt
              WHERE LOWER(TRIM(opt->>'label')) = LOWER(iside.category)
                AND EXISTS (
                  SELECT 1
                  FROM jsonb_array_elements_text(
                    COALESCE(iside.tagged, '[]'::jsonb)
                  ) tagged_id
                  WHERE tagged_id = opt->>'id'
                )
            )
        )
        THEN 'would_migrate'

      ELSE 'already_migrated'
    END AS migration_status
  FROM collection_eval ce
)

SELECT
  cs."siteId" AS site_id,
  s.name AS site_name,
  cs.collection_id,
  cs.collection_title,
  cs.migration_status,
  cs.has_draft,
  cs.has_published,
  (cs.draft_category_group IS NOT NULL) AS draft_has_category_group,
  (cs.published_category_group IS NOT NULL) AS published_has_category_group,
  cs.has_legacy_categories
FROM collection_status cs
JOIN "Site" s ON s.id = cs."siteId"
WHERE cs.migration_status = 'would_migrate'
ORDER BY cs."siteId", cs.collection_title;
