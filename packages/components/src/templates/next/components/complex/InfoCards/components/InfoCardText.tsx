import type { SingleCardWithImageProps } from "~/interfaces/complex/InfoCards"
import { createElement } from "react"
import { BiRightArrowAlt } from "react-icons/bi"
import { getHeadingTag } from "~/utils/getHeadingTag"

import { compoundStyles, infoCardTitleStyle } from "../common"

export const InfoCardText = ({
  title,
  description,
  url,
  isExternalLink,
  variant = "default",
  headingLevel,
}: Pick<
  SingleCardWithImageProps,
  | "variant"
  | "title"
  | "description"
  | "url"
  | "isExternalLink"
  | "headingLevel"
>): JSX.Element => {
  const Tag = getHeadingTag(headingLevel)
  return (
    <div className={compoundStyles.cardTextContainer({ variant })}>
      {createElement(
        Tag,
        {
          className: infoCardTitleStyle({ isClickableCard: !!url, variant }),
        },
        title,
        url &&
          createElement(BiRightArrowAlt, {
            "aria-hidden": true,
            className: compoundStyles.cardTitleArrow({
              isExternalLink,
              variant,
            }),
          }),
      )}

      {description && (
        <p className={compoundStyles.cardDescription()}>{description}</p>
      )}
    </div>
  )
}
