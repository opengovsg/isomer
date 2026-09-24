import type { UseToastOptions } from "@chakra-ui/react"

const THREE_SECONDS_IN_MS = 3000
export const BRIEF_TOAST_SETTINGS: Pick<
  UseToastOptions,
  "isClosable" | "duration"
> = {
  isClosable: true,
  duration: THREE_SECONDS_IN_MS,
}

const EIGHT_SECONDS_IN_MS = 8000
// Longer duration for actionable error toasts (e.g. naming a schedule to cancel) that need more time to read.
export const ACTIONABLE_ERROR_TOAST_SETTINGS: Pick<
  UseToastOptions,
  "isClosable" | "duration"
> = {
  isClosable: true,
  duration: EIGHT_SECONDS_IN_MS,
}

export const SETTINGS_TOAST_MESSAGES = {
  success: {
    title: "Changes published",
    description: "They'll appear on your site in 5-10 minutes.",
  },
}
