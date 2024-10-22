import type { Static } from "@sinclair/typebox"
import { Type } from "@sinclair/typebox"

import type { IsomerSitemap, LinkComponentType } from "~/types"

export const SearchableTableSchema = Type.Object({
  title: Type.Optional(Type.String()),
  headers: Type.Array(Type.Union([Type.String(), Type.Number()])),
  items: Type.Array(Type.Array(Type.Union([Type.String(), Type.Number()]))),
})

export type SearchableTableProps = Static<typeof SearchableTableSchema> & {
  sitemap: IsomerSitemap
  LinkComponent?: LinkComponentType
}
