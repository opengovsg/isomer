import type {
  DateFilterSchemaType,
  TextFilterSchemaType,
} from "@opengovsg/isomer-components"
import {
  DEFAULT_DATE_FILTER_STATUS_LABELS,
  DEFAULT_TAG_CATEGORY_DISPLAY,
  IMAGE_ACCEPTED_MIME_TYPE_MAPPING,
  TAG_CATEGORY_TYPE,
} from "@opengovsg/isomer-components"

export const ACCEPTED_IMAGE_TYPES_MESSAGE = Object.keys(
  IMAGE_ACCEPTED_MIME_TYPE_MAPPING,
).join(", ")

export const createDefaultTagCategory = (): TextFilterSchemaType => ({
  id: crypto.randomUUID(),
  label: "New filter",
  type: TAG_CATEGORY_TYPE.Text,
  isRequired: true,
  display: DEFAULT_TAG_CATEGORY_DISPLAY,
  options: [],
})

export const createDefaultDateFilter = (): DateFilterSchemaType => ({
  id: crypto.randomUUID(),
  label: "New filter",
  type: TAG_CATEGORY_TYPE.Date,
  isRequired: true,
  statusLabels: DEFAULT_DATE_FILTER_STATUS_LABELS,
  showStatusLabels: true,
  showDateRange: true,
})

type TagOption = TextFilterSchemaType["options"][number]
export const createDefaultTagOption = (): TagOption => ({
  id: crypto.randomUUID(),
  label: "New option",
})
