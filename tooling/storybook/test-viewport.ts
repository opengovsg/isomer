import type { BeforeEach } from "storybook/internal/types"

import { resolveViewportSize } from "./viewport-size.mjs"

/**
 * Storybook's `viewport` global only resizes the preview wrapper in the UI.
 * Under the Vitest addon the real browser keeps its default size, so play
 * functions of mobile stories would run against the desktop layout. Resize the
 * tester iframe to match before the story renders.
 */
export const applyViewportInVitest: BeforeEach = async ({
  globals,
  parameters,
}) => {
  if (!("__vitest_browser__" in globalThis)) return
  const size = resolveViewportSize(globals, parameters)
  if (!size) return
  const { page } = await import("vitest/browser")
  await page.viewport(size.width, size.height)
}
