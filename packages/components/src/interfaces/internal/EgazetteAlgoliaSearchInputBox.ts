import type { Static } from "@sinclair/typebox"
import { Type } from "@sinclair/typebox"

// The category/sub-category taxonomy is fixed and hard-coded in the renderer
// (see EgazetteAlgoliaSearch/categories.ts), so it is not part of this config.
export const EgazetteAlgoliaSearchSchema = Type.Object({
  appId: Type.String({
    readOnly: true,
    title: "Algolia App ID",
  }),
  indexName: Type.String({
    readOnly: true,
    title: "Algolia index name",
  }),
  searchApiKey: Type.String({
    description:
      "Must be a public search-only key, never an admin key — this value ships to the browser.",
    readOnly: true,
    title: "Algolia search-only API key",
  }),
  type: Type.Literal("egazette-algolia", {
    default: "egazette-algolia",
    format: "hidden",
  }),
})

export type EgazetteAlgoliaSearchProps = Static<
  typeof EgazetteAlgoliaSearchSchema
>
