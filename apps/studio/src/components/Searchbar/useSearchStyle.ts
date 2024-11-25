import { useEffect, useState } from "react"
import { useMediaQuery } from "usehooks-ts"

import { getBannerHeightInPx } from "~/hooks/useBanner"

const topOffsetInPx = 8

export const useSearchStyle = () => {
  const isDesktop = useMediaQuery("(min-width: 1024px)")
  const isTablet = useMediaQuery("(min-width: 768px)")
  const isSmallerThanTablet = !isDesktop && !isTablet

  // Banner height changes from different number of lines of text
  // and not due to the viewport width
  const [bannerHeight, setBannerHeight] = useState(getBannerHeightInPx())
  useEffect(() => {
    const handleResize = () => {
      setBannerHeight(getBannerHeightInPx())
    }
    window.addEventListener("resize", handleResize)
    return () => {
      window.removeEventListener("resize", handleResize)
    }
  }, [])

  const minWidth = "30rem"
  const maxWidth = isDesktop ? "42.5rem" : isTablet ? "35rem" : "30rem"
  const marginTop = `${bannerHeight + (isSmallerThanTablet ? 0 : topOffsetInPx)}px`

  return { minWidth, maxWidth, marginTop }
}
