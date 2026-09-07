import type { CollectionPagePageProps } from "@opengovsg/isomer-components"
import {
  DEFAULT_TAG_CATEGORY_DISPLAY,
  IMAGE_ACCEPTED_MIME_TYPE_MAPPING,
} from "@opengovsg/isomer-components"

export const ACCEPTED_IMAGE_TYPES_MESSAGE = Object.keys(
  IMAGE_ACCEPTED_MIME_TYPE_MAPPING,
).join(", ")

type TagCategory = NonNullable<CollectionPagePageProps["tagCategories"]>[number]
export const createDefaultTagCategory = (): TagCategory => ({
  display: DEFAULT_TAG_CATEGORY_DISPLAY,
  id: crypto.randomUUID(),
  isRequired: true,
  label: "New filter",
  options: [],
})

type TagOption = TagCategory["options"][number]
export const createDefaultTagOption = (): TagOption => ({
  id: crypto.randomUUID(),
  label: "New option",
})
