import type { Static } from "@sinclair/typebox"
import { Type } from "@sinclair/typebox"

import type { IsomerSiteProps, LinkComponentType } from "~/types"

export const NativeSearchableTableSchema = Type.Object({
  title: Type.Optional(Type.String()),
  headers: Type.Array(Type.Union([Type.String(), Type.Number()])),
  items: Type.Array(Type.Array(Type.Union([Type.String(), Type.Number()]))),
})

export type NativeSearchableTableProps = Static<
  typeof NativeSearchableTableSchema
> & {
  site: IsomerSiteProps
  LinkComponent?: LinkComponentType
}
