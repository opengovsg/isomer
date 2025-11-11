export const isUrl = (url: string): boolean => {
  try {
    // The URL constructor will throw if the string is not a valid absolute URL
    new URL(url)
    return true
  } catch {
    return false
  }
}
