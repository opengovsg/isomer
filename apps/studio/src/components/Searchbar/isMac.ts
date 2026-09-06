export const isMac =
  globalThis.window !== undefined &&
  (navigator.userAgent || navigator.platform).toLowerCase().includes("mac")
