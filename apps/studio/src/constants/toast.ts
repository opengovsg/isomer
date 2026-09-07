import type { UseToastOptions } from "@chakra-ui/react"

const THREE_SECONDS_IN_MS = 3000
export const BRIEF_TOAST_SETTINGS: Pick<
  UseToastOptions,
  "isClosable" | "duration"
> = {
  duration: THREE_SECONDS_IN_MS,
  isClosable: true,
}

export const SETTINGS_TOAST_MESSAGES = {
  success: {
    description: "They'll appear on your site in 5-10 minutes.",
    title: "Changes published",
  },
}
