// NOTE: algoliasearch v4 is used deliberately — the legacy egazette integration
// uses the v4 client API (algoliasearch(appId, key).initIndex(name),
// index.saveObjects, index.deleteBy). v5 changed the client API; do not
// upgrade without reviewing egazette compatibility.
import algoliasearch from "algoliasearch"

export interface AlgoliaClientConfig {
  appId: string
  apiKey: string
  indexName: string
}

/**
 * Create a client bound to a single Algolia index. This package does not read
 * application env — callers pass validated configuration (see
 * `apps/studio/src/lib/algolia.ts` for the Studio adapter).
 */
export const createAlgoliaClient = ({
  appId,
  apiKey,
  indexName,
}: AlgoliaClientConfig) => {
  const index = algoliasearch(appId, apiKey).initIndex(indexName)

  /**
   * Upsert records into the search index. Each record must carry an `objectID`.
   * Calling this with the same `objectID` overwrites the existing record cleanly.
   */
  const saveObjectsToSearchIndex = async (
    objects: readonly ({ objectID: string } & Record<string, unknown>)[],
  ) => {
    await index.saveObjects(objects)
  }

  /**
   * Delete all records matching the given Algolia filter expression.
   * Example: `deleteObjectsFromSearchIndexByFilter('objectGroup:"year/cat/sub/file.pdf"')`.
   *
   * NOTE: `objectGroup` must be registered as `filterOnly(objectGroup)` in
   * `attributesForFaceting` in the Algolia dashboard before this is used —
   * otherwise deleteBy silently matches nothing.
   */
  const deleteObjectsFromSearchIndexByFilter = async (filters: string) => {
    await index.deleteBy({ filters })
  }

  return { saveObjectsToSearchIndex, deleteObjectsFromSearchIndexByFilter }
}
