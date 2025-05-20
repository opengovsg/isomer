import { PropsWithChildren } from "react"

import { SingleCardNoImageProps } from "~/interfaces/complex/InfoCards"
import { getReferenceLinkHref } from "~/utils"
import { Link } from "../../../internal/Link"
import { compoundStyles } from "../common"

export const InfoCardContainer = ({
  url,
  site,
  LinkComponent,
  children,
  isExternalLink,
}: PropsWithChildren<
  Pick<
    SingleCardNoImageProps,
    "url" | "site" | "isExternalLink" | "LinkComponent"
  >
>): JSX.Element => {
  return url ? (
    <Link
      href={getReferenceLinkHref(url, site.siteMap, site.assetsBaseUrl)}
      className={compoundStyles.cardContainer()}
      LinkComponent={LinkComponent}
      isExternal={isExternalLink}
    >
      {children}
    </Link>
  ) : (
    <div className={compoundStyles.cardContainer()}>{children}</div>
  )
}
