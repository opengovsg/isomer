import { expect, type Locator } from "@playwright/test"

/** Assert at least one matching locator is visible (avoids strict-mode `.first()`). */
export async function expectAnyVisible(
  locator: Locator,
  options?: { timeout?: number },
) {
  await expect(async () => {
    const count = await locator.count()
    for (let i = 0; i < count; i++) {
      if (await locator.nth(i).isVisible()) {
        return
      }
    }
    throw new Error("Expected at least one visible match")
  }).toPass({ timeout: options?.timeout })
}
