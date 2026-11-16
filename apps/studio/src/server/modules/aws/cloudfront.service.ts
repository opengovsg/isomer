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

// Invalidates each deleted asset's folder so CloudFront stops serving it
// immediately, without evicting unrelated cached objects on the same site. The
// S3 access-point policy already blocks reads of deletedAt-tagged objects at
// origin, but edge caches can still serve a stale copy for the remainder of
// the cache TTL without this. The folder wildcard also covers the .webp/.avif
// renditions, which the viewer-request function caches under their own paths.
//
// A missing CLOUDFRONT_ASSETS_DISTRIBUTION_ID degrades to a reported failure
// rather than throwing, so asset tagging still succeeds on its own.
export const invalidateAssetPaths = async (
  logger: Logger<string>,
  keys: Set<string> | string[],
): Promise<InvalidationResult> => {
  const uniqueKeys = Array.from(new Set(keys))
  if (uniqueKeys.length === 0) {
    return { success: true }
  }

  const distributionId = env.CLOUDFRONT_ASSETS_DISTRIBUTION_ID
  if (!distributionId) {
    return {
      success: false,
      error: "CLOUDFRONT_ASSETS_DISTRIBUTION_ID is not configured",
    }
  }

  const paths = Array.from(
    new Set(
      uniqueKeys.map((key) => `/${key.slice(0, key.lastIndexOf("/") + 1)}*`),
    ),
  )

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
      { error, keys: uniqueKeys },
      "Failed to invalidate CloudFront cache",
    )
    return {
      success: false,
      error: "Failed to invalidate CloudFront cache",
    }
  }
}
