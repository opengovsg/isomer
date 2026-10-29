// modes.desktop.viewport. Kept here so node:test can load this file without tsc.
export const DESKTOP_VIEWPORT = "xl"

/**
 * @param {{ viewport?: string | { value?: string } }} globals
 * @param {{ viewport?: { options?: Record<string, { styles?: { width?: string, height?: string } }> } }} parameters
 * @returns {{ width: number, height: number } | undefined}
 */
export function resolveViewportSize(globals, parameters) {
  const global = globals.viewport
  const requested = typeof global === "object" ? global.value : global
  // Stories with no viewport inherit the previous story's size in the
  // persistent iframe. Desktop is the suite default.
  const key = requested || DESKTOP_VIEWPORT
  const styles = parameters.viewport?.options?.[key]?.styles
  const width = parseInt(styles?.width ?? "", 10)
  if (!width) return
  // Relative heights such as "100%" cannot be set on the Vitest browser.
  // 720 matches the Studio preview height; Argos otherwise reads "100%" as 100px.
  const height = styles?.height?.endsWith("px")
    ? parseInt(styles.height, 10)
    : 720
  return { width, height }
}
