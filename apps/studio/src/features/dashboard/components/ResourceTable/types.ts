import type { RouterOutput } from "~/utils/trpc"

export type ResourceTableData =
  RouterOutput["resource"]["listWithoutRoot"][number]
