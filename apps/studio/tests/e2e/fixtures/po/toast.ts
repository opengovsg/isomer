import type { Page } from "@playwright/test"

/** Chakra mounts toasts under `chakra-toast-manager-*` regions. */
export const toastWithText = (page: Page, text: string | RegExp) =>
  page.locator('[id^="chakra-toast-manager"]').getByText(text)
