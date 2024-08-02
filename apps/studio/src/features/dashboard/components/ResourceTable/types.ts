import type { RouterOutput } from "~/utils/trpc"

export type ResourceTableData = RouterOutput["resource"]["list"][number]
