import { Static, Type } from "@sinclair/typebox"

export const CollectionVariantSchema = Type.Union([
  Type.Literal("blog"),
  Type.Literal("collection"),
])

export type CollectionVariant = Static<typeof CollectionVariantSchema>

export type IsomerLayoutVariants = {
  collection: {
    variant: CollectionVariant
  }
}
