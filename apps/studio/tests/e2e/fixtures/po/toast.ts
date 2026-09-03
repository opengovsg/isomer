import type { Page } from "@playwright/test"
import { expect } from "@playwright/test"

/** Chakra mounts toasts under `chakra-toast-manager-*` regions. */
export const toastRegionWithText = (page: Page, text: string | RegExp) =>
  page.locator('[id^="chakra-toast-manager"]').filter({ hasText: text })

/** Wait until a toast containing `text` is visible (handles overlapping toasts). */
export const waitForToastWithText = async (
  page: Page,
  text: string | RegExp,
  options?: { timeout?: number },
) => {
  const locator = toastRegionWithText(page, text)
  await expect(async () => {
    const count = await locator.count()
    for (let i = count - 1; i >= 0; i--) {
      if (await locator.nth(i).isVisible()) {
        return
      }
    }
    throw new Error(`Expected toast: ${String(text)}`)
  }).toPass({ timeout: options?.timeout })
}
