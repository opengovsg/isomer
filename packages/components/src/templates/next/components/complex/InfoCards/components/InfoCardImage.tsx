import type { SingleCardWithImageProps } from "~/interfaces/complex/infoCards"
import { INFOCARD_VARIANT } from "~/interfaces/complex/infoCards/constants"
import { getTailwindVariantLayout } from "~/utils/getTailwindVariantLayout"

import type { With4Cols } from "./types"
import { ImageClient } from "../../../internal/ImageClient"
import { compoundStyles } from "../common"

export const InfoCardImage = ({
  imageUrl,
  imageAlt,
  imageFit,
  maxColumns,
  url,
  layout,
  site,
  shouldLazyLoad,
  variant = INFOCARD_VARIANT.default,
  isFallback,
}: Pick<
  With4Cols<SingleCardWithImageProps>,
  | "isFallback"
  | "imageUrl"
  | "imageAlt"
  | "maxColumns"
  | "url"
  | "imageFit"
  | "layout"
  | "site"
  | "shouldLazyLoad"
  | "variant"
>): JSX.Element => {
  return (
    <div
      className={compoundStyles.cardImageContainer({
        layout: getTailwindVariantLayout(layout),
        maxColumns,
        isClickableCard: !!url,
        variant,
        isFallback,
      })}
    >
      <ImageClient
        src={imageUrl}
        alt={imageAlt}
        width="100%"
        className={compoundStyles.cardImage({
          imageFit,
          isFallback,
        })}
        assetsBaseUrl={site.assetsBaseUrl}
        lazyLoading={shouldLazyLoad}
      />
    </div>
  )
}
