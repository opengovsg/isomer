/* oxlint-disable typescript/no-unnecessary-condition -- studio lint cleanup */
export const isMac =
  globalThis.window !== undefined &&
  (navigator.userAgent || navigator.platform).toLowerCase().includes("mac")
