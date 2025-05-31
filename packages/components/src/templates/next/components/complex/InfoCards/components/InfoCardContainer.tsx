import { PropsWithChildren } from "react"

import {
  INFOCARD_VARIANT,
  SingleCardWithImageProps,
} from "~/interfaces/complex/InfoCards"
import { getReferenceLinkHref } from "~/utils"
import { Link } from "../../../internal/Link"
import { compoundStyles } from "../common"

export const InfoCardContainer = ({
  url,
  site,
  LinkComponent,
  children,
  isExternalLink,
  variant = INFOCARD_VARIANT.default,
}: PropsWithChildren<
  Pick<
    SingleCardWithImageProps,
    "variant" | "url" | "site" | "isExternalLink" | "LinkComponent"
  >
>): JSX.Element => {
  return url ? (
    <Link
      href={getReferenceLinkHref(url, site.siteMap, site.assetsBaseUrl)}
      className={compoundStyles.cardContainer({ variant })}
      LinkComponent={LinkComponent}
      isExternal={isExternalLink}
    >
      {children}
    </Link>
  ) : (
    <div className={compoundStyles.cardContainer({ variant })}>{children}</div>
  )
}
