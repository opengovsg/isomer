import type { With4Cols } from "./types"
import type { SingleCardWithImageProps } from "~/interfaces/complex/InfoCards"
import { INFOCARD_VARIANT } from "~/interfaces/complex/InfoCards"
import { isExternalUrl } from "~/utils"
import { InfoCardContainer } from "./InfoCardContainer"
import { InfoCardImage } from "./InfoCardImage"
import { InfoCardText } from "./InfoCardText"

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
      {/* NOTE: This is kept separate from styling because this is a one-off style that is only applied here */}
      <div className="absolute bottom-0 flex h-[50%] w-full items-end bg-gradient-to-t from-[rgba(38,38,38,100%)] to-[rgba(38,38,38,0%)] p-5">
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
