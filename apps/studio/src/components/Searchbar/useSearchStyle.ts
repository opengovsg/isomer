import { useSyncExternalStore } from "react"
import { useMediaQuery } from "usehooks-ts"
import { getBannerHeightInPx } from "~/hooks/useBanner"

const topOffsetInPx = 8

const subscribeToBannerHeight = (onStoreChange: () => void) => {
  window.addEventListener("resize", onStoreChange)
  return () => {
    window.removeEventListener("resize", onStoreChange)
  }
}

const getBannerHeightSnapshot = () => getBannerHeightInPx()

export const useSearchStyle = () => {
  const isDesktop = useMediaQuery("(min-width: 1024px)")
  const isTablet = useMediaQuery("(min-width: 768px)")
  const isSmallerThanTablet = !isDesktop && !isTablet

  const bannerHeight = useSyncExternalStore(
    subscribeToBannerHeight,
    getBannerHeightSnapshot,
    () => 0,
  )

  const minWidth = "30rem"
  const maxWidth = isDesktop ? "42.5rem" : (isTablet ? "35rem" : "30rem")
  const marginTop = `${bannerHeight + (isSmallerThanTablet ? 0 : topOffsetInPx)}px`

  return { marginTop, maxWidth, minWidth }
}
