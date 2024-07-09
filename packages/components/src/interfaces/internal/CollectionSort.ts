export const SortKeys = ["date"] as const
export type SortKey = (typeof SortKeys)[number]
export const SortDirections = ["asc", "desc"] as const
export type SortDirection = (typeof SortDirections)[number]
