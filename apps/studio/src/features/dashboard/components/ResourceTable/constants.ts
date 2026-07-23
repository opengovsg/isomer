import type { ResourceOrderByOption } from "~/schemas/resource"

export const RESOURCE_TABLE_SORT_OPTIONS: Record<
  ResourceOrderByOption,
  string
> = {
  "updated-desc": "Recently edited",
  "title-asc": "Alphabetical",
}
