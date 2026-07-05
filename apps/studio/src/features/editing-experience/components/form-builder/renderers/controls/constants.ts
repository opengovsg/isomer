import type {
  CollectionPageCategoryOption,
  CollectionPagePageProps,
} from "@opengovsg/isomer-components"
import { IMAGE_ACCEPTED_MIME_TYPE_MAPPING } from "@opengovsg/isomer-components"

export {
  FILE_UPLOAD_ACCEPTED_MIME_TYPE_MAPPING,
  MAX_FILE_SIZE_BYTES,
  MAX_IMG_FILE_SIZE_BYTES,
  MAX_SVG_FILE_SIZE_BYTES,
  ONE_MB_IN_BYTES,
  RISKY_FILE_EXTENSIONS,
} from "~/lib/fileUpload"

export const ACCEPTED_IMAGE_TYPES_MESSAGE = Object.keys(
  IMAGE_ACCEPTED_MIME_TYPE_MAPPING,
).join(", ")

type TagCategory = NonNullable<CollectionPagePageProps["tagCategories"]>[number]
export const createDefaultTagCategory = (): TagCategory => ({
  id: crypto.randomUUID(),
  label: "New filter",
  isRequired: true,
  options: [],
})

type TagOption = TagCategory["options"][number]
export const createDefaultTagOption = (): TagOption => ({
  id: crypto.randomUUID(),
  label: "New option",
})

export const createDefaultCategoryOption =
  (): CollectionPageCategoryOption => ({
    id: crypto.randomUUID(),
    label: "New option",
  })
