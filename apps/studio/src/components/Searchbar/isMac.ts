export const isMac =
  typeof window !== "undefined" &&
  (navigator.userAgent || navigator.platform).toLowerCase().includes("mac")
