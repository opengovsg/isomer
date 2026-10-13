import type { SingleCardWithImageProps } from "~/interfaces/complex/InfoCards"
import { INFOCARD_VARIANT } from "~/interfaces/complex/InfoCards"
import { getFocalObjectPosition } from "~/utils/getFocalObjectPosition"
import { getTailwindVariantLayout } from "~/utils/getTailwindVariantLayout"

import type { With4Cols } from "./types"
import { ImageClient } from "../../../internal/ImageClient"
import { compoundStyles } from "../common"

export const InfoCardImage = ({
  imageUrl,
  imageAlt,
  imageFit,
  imageAdjustment,
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
  | "imageAdjustment"
  | "layout"
  | "site"
  | "shouldLazyLoad"
  | "variant"
>): JSX.Element => {
  // Focal point for a "cover"-fit card: anchors the subject as the card's
  // aspect ratio swings across breakpoints. A no-op (undefined) when no focal
  // is set, so "contain" cards keep the object-center default.
  const objectPosition = getFocalObjectPosition(imageAdjustment)
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
        objectPosition={objectPosition}
        assetsBaseUrl={site.assetsBaseUrl}
        lazyLoading={shouldLazyLoad}
      />
    </div>
  )
}
