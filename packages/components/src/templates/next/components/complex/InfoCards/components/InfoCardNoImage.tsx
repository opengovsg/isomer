import type { SingleCardNoImageProps } from "~/interfaces/complex/InfoCards"
import { isExternalUrl } from "~/utils"
import { InfoCardContainer } from "./InfoCardContainer"
import { InfoCardText } from "./InfoCardText"

export const InfoCardNoImage = ({
  title,
  description,
  url,
  site,
  LinkComponent,
}: SingleCardNoImageProps): JSX.Element => {
  const isExternalLink = isExternalUrl(url)
  return (
    <InfoCardContainer
      url={url}
      site={site}
      isExternalLink={isExternalLink}
      LinkComponent={LinkComponent}
    >
      <InfoCardText
        title={title}
        description={description}
        url={url}
        isExternalLink={isExternalLink}
      />
    </InfoCardContainer>
  )
}
