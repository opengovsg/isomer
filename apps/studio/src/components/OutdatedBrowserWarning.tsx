import { Infobox } from "@opengovsg/design-system-react"

const browsers: { name: string; regex: RegExp; minVersion: number | null }[] = [
  { name: "Chrome", regex: /Chrome\/(\d+)/, minVersion: 64 },
  { name: "Edge", regex: /Edg\/(\d+)/, minVersion: 79 },
  { name: "Firefox", regex: /Firefox\/(\d+)/, minVersion: 67 },
  { name: "Opera", regex: /OPR\/(\d+)/, minVersion: 51 },
  { name: "Safari", regex: /Version\/(\d+).*Safari/, minVersion: 12 },
  { name: "IE", regex: /MSIE|Trident/, minVersion: null },
]

export const isBrowserOutdated = (): boolean => {
  const userAgent: string = navigator.userAgent

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

export const OutdatedBrowserWarning: React.FC = () => {
  if (isBrowserOutdated())
    return (
      <Infobox variant="warning" textStyle="body-2" size="sm" mt="1.75rem">
        Your browser is outdated. Please update it for the best experience.
      </Infobox>
    )

  return null
}
