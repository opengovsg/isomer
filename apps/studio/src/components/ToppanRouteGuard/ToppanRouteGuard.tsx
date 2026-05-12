import type { PropsWithChildren } from "react"
import { useRouter } from "next/router"
import { useEffect } from "react"
import { TOPPAN_EMAIL_DOMAIN } from "~/constants/toppan"
import { useMe } from "~/features/me/api"
import { useEgazetteInfo } from "~/hooks/useEgazetteInfo"

import { FullscreenSpinner } from "../FullscreenSpinner"

export const ToppanRouteGuard = ({ children }: PropsWithChildren) => {
  const {
    me: { email },
  } = useMe()
  const egazette = useEgazetteInfo()
  const router = useRouter()

  const isToppanUser = email.endsWith(TOPPAN_EMAIL_DOMAIN)
  // Pin Toppan users to the gazettes section. `startsWith` (not exact match)
  // so child paths and query strings under /sites/{siteId}/gazettes/* don't
  // bounce. Non-Toppan users and Toppan users with no configured egazette
  // flag are not pinned.
  const shouldRestrictToGazettesPath = isToppanUser && egazette.isConfigured
  const gazettesPath = egazette.isConfigured
    ? `/sites/${egazette.siteId}/gazettes`
    : null
  const isGazettesOnlyRoute =
    !shouldRestrictToGazettesPath ||
    (gazettesPath !== null && router.asPath.startsWith(gazettesPath))

  useEffect(() => {
    if (shouldRestrictToGazettesPath && !isGazettesOnlyRoute && gazettesPath) {
      void router.replace(gazettesPath)
    }
  }, [shouldRestrictToGazettesPath, isGazettesOnlyRoute, router, gazettesPath])

  if (isGazettesOnlyRoute) {
    return <>{children}</>
  }

  return <FullscreenSpinner />
}
