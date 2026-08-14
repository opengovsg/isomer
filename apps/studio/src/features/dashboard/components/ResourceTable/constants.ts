import type {
  ResourceLiveStatus,
  ResourceOrderByOption,
} from "~/schemas/resource"

export const RESOURCE_TABLE_SORT_OPTIONS: Record<
  ResourceOrderByOption,
  string
> = {
  "updated-desc": "Recently edited",
  "title-asc": "Alphabetical",
  "permalink-asc": "URL",
}

// "all" represents no filter applied (the `liveStatus` input is omitted)
export const RESOURCE_TABLE_LIVE_STATUS_OPTIONS: Record<
  "all" | ResourceLiveStatus,
  string
> = {
  all: "All",
  live: "Live",
  notLive: "Not live",
}
