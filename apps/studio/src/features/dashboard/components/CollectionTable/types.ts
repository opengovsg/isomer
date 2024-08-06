import type { RouterOutput } from "~/utils/trpc"

export type CollectionTableData = RouterOutput["collection"]["list"][number]
