import type { Static } from "@sinclair/typebox"
import { Type } from "@sinclair/typebox"

export const CollectionVariantSchema = Type.Union([
  Type.Literal("blog"),
  Type.Literal("collection"),
])

export type CollectionVariant = Static<typeof CollectionVariantSchema>

export interface IsomerLayoutVariants {
  collection: {
    variant: CollectionVariant
  }
}
