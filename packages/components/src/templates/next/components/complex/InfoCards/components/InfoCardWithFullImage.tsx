import {
  INFOCARD_VARIANT,
  SingleCardWithImageProps,
} from "~/interfaces/complex/InfoCards"
import { isExternalUrl } from "~/utils"
import { InfoCardContainer } from "./InfoCardContainer"
import { InfoCardImage } from "./InfoCardImage"
import { InfoCardText } from "./InfoCardText"
import { With4Cols } from "./types"

export const InfoCardWithFullImage = ({
  title,
  imageUrl,
  imageAlt,
  imageFit,
  url,
  maxColumns,
  layout,
  site,
  LinkComponent,
  shouldLazyLoad = true,
}: With4Cols<SingleCardWithImageProps>): JSX.Element => {
  const isExternalLink = isExternalUrl(url)

  return (
    <InfoCardContainer
      variant={INFOCARD_VARIANT.bold}
      url={url}
      site={site}
      isExternalLink={isExternalLink}
      LinkComponent={LinkComponent}
    >
      <InfoCardImage
        imageFit={imageFit}
        imageUrl={imageUrl}
        imageAlt={imageAlt}
        url={url}
        maxColumns={maxColumns}
        site={site}
        layout={layout}
        shouldLazyLoad={shouldLazyLoad}
        variant={INFOCARD_VARIANT.bold}
      />
      <div className="absolute bottom-0 w-full bg-[rgba(38,38,38,0.8)] p-5">
        <InfoCardText
          title={title}
          url={url}
          isExternalLink={isExternalLink}
          variant={INFOCARD_VARIANT.bold}
        />
      </div>
    </InfoCardContainer>
  )
}
