export const FILE_SCAN_STATUS = {
  completed: "COMPLETED",
} as const

export const FILE_SCAN_RESULT = {
  noThreatsFound: "NO_THREATS_FOUND",
  threatsFound: "THREATS_FOUND",
  unsupported: "UNSUPPORTED",
  accessDenied: "ACCESS_DENIED",
  failed: "FAILED",
} as const
