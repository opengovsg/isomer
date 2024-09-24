import type { UseToastOptions } from "@chakra-ui/react"

const THREE_SECONDS_IN_MS = 3000
export const BRIEF_TOAST_SETTINGS: Pick<
  UseToastOptions,
  "isClosable" | "duration"
> = {
  isClosable: true,
  duration: THREE_SECONDS_IN_MS,
}

export const PLACEHOLDER_IMAGE_FILENAME = "placeholder_no_image.png"

export const MAX_IMG_FILE_SIZE_BYTES = 5000000
export const IMAGE_UPLOAD_ACCEPTED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/svg+xml",
  "image/tiff",
  "image/bmp",
  "image/webp",
]
