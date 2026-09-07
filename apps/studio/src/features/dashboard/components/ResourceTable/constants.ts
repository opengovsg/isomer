import type { ResourceOrderByOption } from "~/schemas/resource"

export const RESOURCE_TABLE_SORT_OPTIONS = {
  "permalink-asc": "URL",
  "title-asc": "Alphabetical",
  "updated-desc": "Recently edited",
} satisfies Record<ResourceOrderByOption, string>
