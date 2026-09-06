import type { ResourceOrderByOption } from "~/schemas/resource"

export const RESOURCE_TABLE_SORT_OPTIONS = {
  "updated-desc": "Recently edited",
  "title-asc": "Alphabetical",
  "permalink-asc": "URL",
} satisfies Record<ResourceOrderByOption, string>
