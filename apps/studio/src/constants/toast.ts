import type { UseToastOptions } from "@chakra-ui/react"

const THREE_SECONDS_IN_MS = 3000
export const BRIEF_TOAST_SETTINGS: Pick<
  UseToastOptions,
  "isClosable" | "duration"
> = {
  isClosable: true,
  duration: THREE_SECONDS_IN_MS,
}

export const SETTINGS_TOAST_MESSAGES = {
  success: {
    title: "Changes published",
    description: "They'll appear on your site in 5-10 minutes.",
  },
}
