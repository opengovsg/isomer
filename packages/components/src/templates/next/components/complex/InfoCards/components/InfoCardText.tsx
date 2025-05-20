import { BiRightArrowAlt } from "react-icons/bi"

import { SingleCardWithImageProps } from "~/interfaces/complex/InfoCards"
import { compoundStyles, infoCardTitleStyle } from "../common"

export const InfoCardText = ({
  title,
  description,
  url,
  isExternalLink,
}: Pick<
  SingleCardWithImageProps,
  "title" | "description" | "url" | "isExternalLink"
>): JSX.Element => (
  <div className={compoundStyles.cardTextContainer()}>
    <h3 className={infoCardTitleStyle({ isClickableCard: !!url })}>
      {title}

      {url && (
        <BiRightArrowAlt
          aria-hidden
          className={compoundStyles.cardTitleArrow({
            isExternalLink,
          })}
        />
      )}
    </h3>
    <p className={compoundStyles.cardDescription()}>{description}</p>
  </div>
)
