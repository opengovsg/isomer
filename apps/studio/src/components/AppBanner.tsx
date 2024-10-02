import { Banner } from "@opengovsg/design-system-react"

import { useBanner } from "~/hooks/useBanner"

export const AppBanner = () => {
  const banner = useBanner()
  return banner && <Banner variant={banner.variant}>{banner.message}</Banner>
}
