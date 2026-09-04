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
  id: crypto.randomUUID(),
  label: "New filter",
  isRequired: true,
  display: DEFAULT_TAG_CATEGORY_DISPLAY,
  options: [],
})

type TagOption = TagCategory["options"][number]
export const createDefaultTagOption = (): TagOption => ({
  id: crypto.randomUUID(),
  label: "New option",
})
