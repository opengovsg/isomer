import {
  CloudFrontClient,
  CreateInvalidationCommand,
} from "@aws-sdk/client-cloudfront"
import { randomUUID } from "crypto"
import { env } from "~/env.mjs"

import type { Logger } from "@isomer/logging"

const client = new CloudFrontClient({})

export interface InvalidationResult {
  success: boolean
  invalidationId?: string
  error?: string
}

// Invalidates `/${siteId}/*` for each affected site so CloudFront stops
// serving newly soft-deleted assets immediately. The S3 access-point policy
// already blocks reads of deletedAt-tagged objects at origin, but edge
// caches can still serve a stale copy for the remainder of the cache TTL
// without this.
//
// CLOUDFRONT_ASSETS_DISTRIBUTION_ID is not yet provisioned in
// isomer-next-infra (no SSM param, no IAM permission for this app's task
// role to call cloudfront:CreateInvalidation) — until that lands, this
// degrades to a reported failure rather than throwing, so asset tagging
// still succeeds on its own.
export const invalidateAssetsBySiteIds = async (
  logger: Logger<string>,
  siteIds: Set<string> | string[],
): Promise<InvalidationResult> => {
  const uniqueSiteIds = Array.from(new Set(siteIds))
  if (uniqueSiteIds.length === 0) {
    return { success: true }
  }

  const distributionId = env.CLOUDFRONT_ASSETS_DISTRIBUTION_ID
  if (!distributionId) {
    return {
      success: false,
      error: "CLOUDFRONT_ASSETS_DISTRIBUTION_ID is not configured",
    }
  }

  const paths = uniqueSiteIds.map((siteId) => `/${siteId}/*`)

  try {
    const response = await client.send(
      new CreateInvalidationCommand({
        DistributionId: distributionId,
        InvalidationBatch: {
          CallerReference: `delete-assets-${Date.now()}-${randomUUID()}`,
          Paths: {
            Quantity: paths.length,
            Items: paths,
          },
        },
      }),
    )
    return { success: true, invalidationId: response.Invalidation?.Id }
  } catch (error) {
    logger.error(
      { error, siteIds: uniqueSiteIds },
      "Failed to invalidate CloudFront cache",
    )
    return {
      success: false,
      error: "Failed to invalidate CloudFront cache",
    }
  }
}
