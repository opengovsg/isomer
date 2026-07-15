import type { resourceOrderByOptions } from "~/schemas/resource"
import type { RouterOutput } from "~/utils/trpc"

export type ResourceTableData =
  RouterOutput["resource"]["listWithoutRoot"][number]

export type ResourceSortOption = (typeof resourceOrderByOptions)[number]
