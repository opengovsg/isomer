import { SingleCardWithImageProps } from "~/interfaces/complex/InfoCards"
import { isExternalUrl } from "~/utils"
import { InfoCardContainer } from "./InfoCardContainer"
import { InfoCardImage } from "./InfoCardImage"
import { InfoCardText } from "./InfoCardText"

export const InfoCardWithFullImage = ({
  title,
  description,
  imageUrl,
  imageAlt,
  imageFit,
  url,
  maxColumns,
  layout,
  site,
  LinkComponent,
  shouldLazyLoad = true,
}: SingleCardWithImageProps): JSX.Element => {
  const isExternalLink = isExternalUrl(url)
  return (
    <InfoCardContainer
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
      />
      <InfoCardText
        title={title}
        description={description}
        url={url}
        isExternalLink={isExternalLink}
      />
    </InfoCardContainer>
  )
}
