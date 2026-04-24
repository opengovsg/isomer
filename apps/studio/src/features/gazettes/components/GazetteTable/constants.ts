import type { GazetteTableSortOptions } from "./types"

export const GAZETTE_TABLE_SORT_OPTIONS: Record<
  GazetteTableSortOptions,
  string
> = {
  "publish-time-desc": "Recently published",
  "publish-time-asc": "Oldest published",
  "notification-no-desc": "Notification No. (High to Low)",
  "notification-no-asc": "Notification No. (Low to High)",
}
