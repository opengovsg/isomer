import type {
  ResourceOrderByOption,
  ResourceStatusFilterOption,
} from "~/schemas/resource"

export const RESOURCE_TABLE_SORT_OPTIONS: Record<
  ResourceOrderByOption,
  string
> = {
  "updated-desc": "Recently edited",
  "title-asc": "Alphabetical",
  "permalink-asc": "URL",
}

export const RESOURCE_TABLE_STATUS_FILTER_OPTIONS: Record<
  ResourceStatusFilterOption,
  string
> = {
  live: "Published",
  notLive: "Unpublished",
  scheduledToPublish: "Scheduled to publish",
  scheduledToUnpublish: "Scheduled to unpublish",
  hasDraft: "Has draft",
}
