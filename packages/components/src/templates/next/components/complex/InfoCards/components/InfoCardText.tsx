import type { SingleCardWithImageProps } from "~/interfaces/complex/InfoCards"
import { BiRightArrowAlt } from "react-icons/bi"
import { DynamicHeading } from "~/utils/DynamicHeading"
import { hasNonEmptyString } from "~/utils/truthiness"

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
>): React.ReactNode => (
  <div className={compoundStyles.cardTextContainer({ variant })}>
    <DynamicHeading
      level={headingLevel}
      className={infoCardTitleStyle({
        isClickableCard: hasNonEmptyString(url),
        variant,
      })}
    >
      {title}
      {hasNonEmptyString(url) && (
        <BiRightArrowAlt
          aria-hidden
          className={compoundStyles.cardTitleArrow({
            isExternalLink,
            variant,
          })}
        />
      )}
    </DynamicHeading>

    {hasNonEmptyString(description) && (
      <p className={compoundStyles.cardDescription()}>{description}</p>
    )}
  </div>
)
