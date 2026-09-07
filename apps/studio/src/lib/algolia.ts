import { env } from "~/env.mjs"

import { createAlgoliaClient } from "@isomer/algolia"

/**
 * Studio adapter for `@isomer/algolia`: reads validated env and binds a single
 * client to the gazette search index. Import the functions from here rather
 * than instantiating another client.
 */
export const {
  saveObjectsToSearchIndex,
  deleteObjectsFromSearchIndexByFilter,
} = createAlgoliaClient({
  apiKey: env.ALGOLIA_API_KEY,
  appId: env.ALGOLIA_APP_ID,
  indexName: env.ALGOLIA_INDEX_NAME,
})
