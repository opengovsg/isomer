import { BiRightArrowAlt } from "react-icons/bi"

import { SingleCardWithImageProps } from "~/interfaces/complex/InfoCards"
import { compoundStyles, infoCardTitleStyle } from "../common"

export const InfoCardText = ({
  title,
  description,
  url,
  isExternalLink,
  variant = "default",
}: Pick<
  SingleCardWithImageProps,
  "variant" | "title" | "description" | "url" | "isExternalLink"
>): JSX.Element => (
  <div className={compoundStyles.cardTextContainer({ variant })}>
    <h3 className={infoCardTitleStyle({ isClickableCard: !!url, variant })}>
      {title}
      {url && (
        <BiRightArrowAlt
          aria-hidden
          className={compoundStyles.cardTitleArrow({
            isExternalLink,
            variant,
          })}
        />
      )}
    </h3>

    {description && (
      <p className={compoundStyles.cardDescription()}>{description}</p>
    )}
  </div>
)
