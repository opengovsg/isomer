import type { RouterOutput } from "~/utils/trpc"

import type { ResourceSortOption } from "../ResourceTable/types"

export type CollectionTableData = RouterOutput["collection"]["list"][number]

export type CollectionTableSortOptions = ResourceSortOption
