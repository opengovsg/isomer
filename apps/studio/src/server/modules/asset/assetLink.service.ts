import { AssetStatus } from "~prisma/generated/generatedEnums"

import type { DB, Transaction } from "../database"

// Kept apart from asset.service so that delete paths, scripts and e2e fixtures
// can clear links without loading the S3 client or the components package.

// AssetLink.resourceId is RESTRICT, so a delete must clear links for the
// resource and every descendant that Resource.parent will cascade to.
// Removing the assets this orphans is left to the removal flow.
export const deleteAssetLinksForResourceTree = async (
  tx: Transaction<DB>,
  { siteId, resourceIds }: { siteId: number; resourceIds: string[] },
) => {
  if (resourceIds.length === 0) return

  const deletedLinks = await tx
    .withRecursive("subtree", (eb) =>
      eb
        .selectFrom("Resource")
        .where("Resource.siteId", "=", siteId)
        .where("Resource.id", "in", resourceIds)
        .select("Resource.id")
        // `union` dedupes, so a cyclic parent chain cannot recurse forever
        .union((fb) =>
          fb
            .selectFrom("Resource")
            .innerJoin("subtree", "subtree.id", "Resource.parentId")
            .where("Resource.siteId", "=", siteId)
            .select("Resource.id"),
        ),
    )
    .deleteFrom("AssetLink")
    .where("AssetLink.resourceId", "in", (eb) =>
      eb.selectFrom("subtree").select("subtree.id"),
    )
    .returning("AssetLink.assetId")
    .execute()

  const assetIds = [...new Set(deletedLinks.map(({ assetId }) => assetId))]
  if (assetIds.length === 0) return

  await tx
    .updateTable("Asset")
    .set({ unreferencedAt: new Date() })
    .where("Asset.id", "in", assetIds)
    .where("Asset.status", "=", AssetStatus.UPLOADED)
    .where("Asset.unreferencedAt", "is", null)
    .where((eb) =>
      eb.not(
        eb.exists(
          eb
            .selectFrom("AssetLink")
            .whereRef("AssetLink.assetId", "=", "Asset.id")
            .where((ub) =>
              ub.or([
                ub("AssetLink.usedInDraft", "=", true),
                ub("AssetLink.usedInPublished", "=", true),
              ]),
            )
            .select("AssetLink.id"),
        ),
      ),
    )
    .execute()
}
