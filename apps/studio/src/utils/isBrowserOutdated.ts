// Refer to https://nextjs.org/docs/architecture/supported-browsers#browserslist
const browsers: { name: string; regex: RegExp; minVersion: number | null }[] = [
  { name: "Chrome", regex: /Chrome\/(\d+)/, minVersion: 64 },
  { name: "Edge", regex: /Edg\/(\d+)/, minVersion: 79 },
  { name: "Firefox", regex: /Firefox\/(\d+)/, minVersion: 67 },
  { name: "Opera", regex: /OPR\/(\d+)/, minVersion: 51 },
  { name: "Safari", regex: /Version\/(\d+).*Safari/, minVersion: 12 },
  { name: "IE", regex: /MSIE|Trident/, minVersion: null },
]

export const isBrowserOutdated = ({
  userAgent,
}: {
  userAgent: string
}): boolean => {
  for (const browser of browsers) {
    const match = userAgent.match(browser.regex)
    if (match?.[1]) {
      const version: number = parseInt(match[1], 10)
      if (browser.minVersion === null || version < browser.minVersion) {
        return true
      }
    }
  }

  return false
}
