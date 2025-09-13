export const isSafari = (): boolean | undefined => {
  // to not render during static site generation on the server
  if (typeof navigator === "undefined") {
    return undefined
  }

  return /^((?!chrome|android|crios|fxios|edg).)*safari/i.test(
    navigator.userAgent,
  )
}
