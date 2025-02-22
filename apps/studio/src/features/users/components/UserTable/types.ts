import type { RouterOutput } from "~/utils/trpc"

export type UserTableData = RouterOutput["user"]["list"][number]
