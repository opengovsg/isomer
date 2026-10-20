import type { BeforeEach } from "storybook/internal/types"

interface ViewportSize {
  styles?: { width?: string; height?: string }
}

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
  const global = globals["viewport"] as string | { value?: string } | undefined
  const key = typeof global === "object" ? global.value : global
  const options = (
    parameters["viewport"] as { options?: Record<string, ViewportSize> }
  ).options
  const styles = key ? options?.[key]?.styles : undefined
  const width = parseInt(styles?.width ?? "", 10)
  if (!width) return
  // Heights are often "100%"; only trust absolute pixel values.
  const height = styles?.height?.endsWith("px")
    ? parseInt(styles.height, 10)
    : 720
  const { page } = await import("vitest/browser")
  await page.viewport(width, height)
}
