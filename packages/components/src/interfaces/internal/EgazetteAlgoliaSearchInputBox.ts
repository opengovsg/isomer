import type { Static } from "@sinclair/typebox"
import { Type } from "@sinclair/typebox"

const EgazetteAlgoliaSubCategorySchema = Type.Object({
  value: Type.String({
    title: "Sub-category value as stored in Algolia",
  }),
  displayLabel: Type.String({
    title: "Sub-category label shown in the UI",
  }),
})

const EgazetteAlgoliaCategorySchema = Type.Object({
  value: Type.String({
    title: "Category value as stored in Algolia",
  }),
  displayLabel: Type.String({
    title: "Category label shown in the UI",
  }),
  subCategories: Type.Optional(
    Type.Array(EgazetteAlgoliaSubCategorySchema, {
      title: "Sub-categories under this category",
    }),
  ),
})

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
  categories: Type.Array(EgazetteAlgoliaCategorySchema, {
    title: "Category taxonomy",
    description:
      "Ordered list of categories shown in the left filter rail. Each category may carry its own sub-categories.",
  }),
})

export type EgazetteAlgoliaSearchProps = Static<
  typeof EgazetteAlgoliaSearchSchema
>
export type EgazetteAlgoliaCategory = Static<
  typeof EgazetteAlgoliaCategorySchema
>
export type EgazetteAlgoliaSubCategory = Static<
  typeof EgazetteAlgoliaSubCategorySchema
>
