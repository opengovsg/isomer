import type { PropsWithChildren } from "react"
import { useRouter } from "next/router"
import { useEffect } from "react"
import { useMe } from "~/features/me/api"
import { useEgazetteInfo } from "~/hooks/useEgazetteInfo"

import { FullscreenSpinner } from "../FullscreenSpinner"

const TOPPAN_EMAIL_DOMAIN = "@toppannext.com"

export const ToppanRouteGuard = ({ children }: PropsWithChildren) => {
  const {
    me: { email },
  } = useMe()
  const { siteId } = useEgazetteInfo()
  const router = useRouter()

  // NOTE: If the user is from toppan, we wait on the redirect
  // otherwise, just allow them to continue
  const isToppanUser = email.endsWith(TOPPAN_EMAIL_DOMAIN)
  const gazettesPath = isToppanUser && siteId && `/sites/${siteId}/gazettes`

  const isAllowedRoute = isToppanUser && router.asPath === gazettesPath

  useEffect(() => {
    // NOTE: If the user is from Toppan and is not on the allowed
    // `/gazettes` path, direct them to the `/gazettes` path
    // as they should only have access there
    if (isToppanUser && !isAllowedRoute && gazettesPath) {
      void router.replace(gazettesPath)
    }
  }, [isAllowedRoute, router, isToppanUser, gazettesPath, siteId])

  if (!isToppanUser || (isToppanUser && isAllowedRoute)) {
    return <>{children}</>
  }

  return <FullscreenSpinner />
}
