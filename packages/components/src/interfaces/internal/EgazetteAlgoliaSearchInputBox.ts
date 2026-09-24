import type { Static } from "@sinclair/typebox"
import { Type } from "@sinclair/typebox"

// The category/sub-category taxonomy is fixed and hard-coded in the renderer
// (see EgazetteAlgoliaSearch/categories.ts), so it is not part of this config.
export const EgazetteAlgoliaSearchSchema = Type.Object({
  type: Type.Literal("egazette-algolia", {
    default: "egazette-algolia",
    format: "hidden",
  }),
  appId: Type.String({
    title: "Algolia App ID",
    readOnly: true,
  }),
  searchApiKey: Type.String({
    title: "Algolia search-only API key",
    description:
      "Must be a public search-only key, never an admin key — this value ships to the browser.",
    readOnly: true,
  }),
  indexName: Type.String({
    title: "Algolia index name",
    readOnly: true,
  }),
})

export type EgazetteAlgoliaSearchProps = Static<
  typeof EgazetteAlgoliaSearchSchema
>
