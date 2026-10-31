import type { SingleCardWithImageProps } from "~/interfaces/complex/InfoCards"
import { INFOCARD_VARIANT } from "~/interfaces/complex/InfoCards"
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
  // aspect ratio swings across breakpoints. Ignored under "contain": the whole
  // (already-cropped) image is letterboxed, so an object-position would only
  // shove it off-center within the letterbox — a focal set earlier under cover
  // must not leak through. "contain" cards always keep the object-center default.
  const effectiveImageAdjustment =
    imageFit === "contain" ? undefined : imageAdjustment
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
        imageAdjustment={effectiveImageAdjustment}
        assetsBaseUrl={site.assetsBaseUrl}
        lazyLoading={shouldLazyLoad}
      />
    </div>
  )
}
