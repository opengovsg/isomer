export const shouldNotIncludeGoogleTagManager = (): boolean => {
  if (typeof process === "undefined") return true
  if (process.env.NODE_ENV !== "production") return true
  return false
}

export const getIsomerGoogleTagManagerId = (): string | undefined => {
  if (shouldNotIncludeGoogleTagManager()) return undefined
  return process.env.NEXT_PUBLIC_ISOMER_GOOGLE_TAG_MANAGER_ID
}
