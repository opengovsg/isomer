import type { RouterOutput } from "~/utils/trpc"

export type CollectionTableData =
  RouterOutput["resource"]["listWithoutRoot"][number]
