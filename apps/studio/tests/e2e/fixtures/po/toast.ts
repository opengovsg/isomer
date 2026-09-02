import type { Page } from "@playwright/test"

import { expectAnyVisible } from "./locator-helpers"

/** Chakra mounts toasts under `chakra-toast-manager-*` regions. */
export const toastRegionWithText = (page: Page, text: string | RegExp) =>
  page.locator('[id^="chakra-toast-manager"]').filter({ hasText: text })

/** Wait until a toast containing `text` is visible (handles overlapping toasts). */
export const waitForToastWithText = async (
  page: Page,
  text: string | RegExp,
  options?: { timeout?: number },
) => {
  await expectAnyVisible(toastRegionWithText(page, text), options)
}
