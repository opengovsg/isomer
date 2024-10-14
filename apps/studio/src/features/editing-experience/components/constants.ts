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

export const CHANGES_SAVED_PLEASE_PUBLISH_MESSAGE =
  "Changes saved. Click 'Publish' when you're ready to go live."
