import type { UseToastOptions } from "@chakra-ui/react"

const THREE_SECONDS_IN_MS = 3000
export const BRIEF_TOAST_SETTINGS: Pick<
  UseToastOptions,
  "isClosable" | "duration"
> = {
  isClosable: true,
  duration: THREE_SECONDS_IN_MS,
}
