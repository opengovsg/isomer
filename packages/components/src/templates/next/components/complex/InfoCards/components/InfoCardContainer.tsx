import type { PropsWithChildren } from "react"
import type { SingleCardWithImageProps } from "~/interfaces/complex/InfoCards"
import { getReferenceLinkHref } from "~/utils/getReferenceLinkHref"

import { Link } from "../../../internal/Link"
import { compoundStyles } from "../common"

export const InfoCardContainer = ({
  url,
  site,
  children,
  isExternalLink,
  variant,
}: PropsWithChildren<
  Pick<SingleCardWithImageProps, "variant" | "url" | "site" | "isExternalLink">
>): JSX.Element => {
  return url ? (
    <Link
      href={getReferenceLinkHref(url, site.siteMapArray, site.assetsBaseUrl)}
      className={compoundStyles.cardContainer({ variant })}
      isExternal={isExternalLink}
    >
      {children}
    </Link>
  ) : (
    <div className={compoundStyles.cardContainer({ variant })}>{children}</div>
  )
}
