import type { RouterOutput } from "~/utils/trpc"

export type CollectionTableData =
  RouterOutput["folder"]["readFolder"]["children"][number]
