import type { readCollectionOrderByOptions } from "~/schemas/collection"
import type { RouterOutput } from "~/utils/trpc"

export type CollectionTableData = RouterOutput["collection"]["list"][number]

export type CollectionTableSortOptions =
  (typeof readCollectionOrderByOptions)[number]
