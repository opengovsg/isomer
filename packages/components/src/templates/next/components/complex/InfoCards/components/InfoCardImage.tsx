import type { With4Cols } from "./types"
import type { SingleCardWithImageProps } from "~/interfaces/complex/InfoCards"
import { INFOCARD_VARIANT } from "~/interfaces/complex/InfoCards"
import { getTailwindVariantLayout, isExternalUrl } from "~/utils"
import { ImageClient } from "../../Image"
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
}: Pick<
  With4Cols<SingleCardWithImageProps>,
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
  const imgSrc =
    isExternalUrl(imageUrl) || site.assetsBaseUrl === undefined
      ? imageUrl
      : `${site.assetsBaseUrl}${imageUrl}`

  return (
    <div
      className={compoundStyles.cardImageContainer({
        layout: getTailwindVariantLayout(layout),
        maxColumns,
        isClickableCard: !!url,
        variant,
      })}
    >
      <ImageClient
        src={imgSrc}
        alt={imageAlt}
        width="100%"
        className={compoundStyles.cardImage({
          imageFit,
        })}
        assetsBaseUrl={site.assetsBaseUrl}
        lazyLoading={shouldLazyLoad}
      />
    </div>
  )
}
