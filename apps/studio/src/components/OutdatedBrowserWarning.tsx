import { Infobox } from "@opengovsg/design-system-react"

import { isBrowserOutdated } from "../utils/isBrowserOutdated"

export const OutdatedBrowserWarning: React.FC<
  Partial<React.ComponentProps<typeof Infobox>>
> = (props) => {
  if (isBrowserOutdated({ userAgent: window.navigator.userAgent }))
    return (
      <Infobox variant="warning" textStyle="body-2" size="sm" {...props}>
        Your browser is outdated. Please update it for the best experience.
      </Infobox>
    )

  return null
}
