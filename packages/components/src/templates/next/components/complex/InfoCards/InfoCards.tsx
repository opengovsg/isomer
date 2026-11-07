import type { InfoCardsProps } from "~/interfaces"
import {
  CARDS_WITH_FULL_IMAGES,
  CARDS_WITH_IMAGES,
  CARDS_WITHOUT_IMAGES,
  INFOCARD_VARIANT,
} from "~/interfaces/complex/InfoCards"
import { getHeadingTag } from "~/utils/getHeadingTag"
import { getReferenceLinkHref } from "~/utils/getReferenceLinkHref"
import { getTailwindVariantLayout } from "~/utils/getTailwindVariantLayout"

import { LinkButton } from "../../internal/LinkButton"
import { compoundStyles } from "./common"
import {
  InfoCardNoImage,
  InfoCardWithFullImage,
  InfoCardWithImage,
} from "./components"

export const InfoCards = ({
  id,
  title,
  subtitle,
  variant,
  cards,
  maxColumns,
  label,
  url,
  layout,
  site,
  shouldLazyLoad,
  headingLevel,
}: InfoCardsProps): JSX.Element => {
  const simplifiedLayout = getTailwindVariantLayout(layout)
  const cardVariant =
    variant === CARDS_WITH_FULL_IMAGES
      ? INFOCARD_VARIANT.bold
      : INFOCARD_VARIANT.default
  const TitleTag = getHeadingTag(headingLevel)

  const InfoCardsToRender = () => {
    switch (variant) {
      case CARDS_WITH_IMAGES:
        return (
          <>
            {cards.map((card, idx) => (
              <InfoCardWithImage
                key={idx}
                {...card}
                maxColumns={maxColumns}
                layout={layout}
                site={site}
                shouldLazyLoad={shouldLazyLoad}
                headingLevel={headingLevel + 1}
              />
            ))}
          </>
        )
      case CARDS_WITHOUT_IMAGES:
        return (
          <>
            {cards.map((card, idx) => (
              <InfoCardNoImage
                key={idx}
                {...card}
                site={site}
                headingLevel={headingLevel + 1}
              />
            ))}
          </>
        )
      case CARDS_WITH_FULL_IMAGES: {
        return (
          <>
            {cards.map((card, idx) => (
              <InfoCardWithFullImage
                key={idx}
                {...card}
                maxColumns={maxColumns}
                layout={layout}
                site={site}
                shouldLazyLoad={shouldLazyLoad}
                headingLevel={headingLevel + 1}
              />
            ))}
          </>
        )
      }

      default:
        const _: never = variant
        return <></>
    }
  }

  return (
    <section
      id={id}
      className={compoundStyles.container({ layout: simplifiedLayout })}
    >
      {(title || subtitle) && (
        <div
          className={compoundStyles.headingContainer({
            layout: simplifiedLayout,
            imageStyle: cardVariant,
            variant: cardVariant,
          })}
        >
          <TitleTag className={compoundStyles.headingTitle()}>{title}</TitleTag>

          {subtitle && (
            <p
              className={compoundStyles.headingSubtitle({
                layout: simplifiedLayout,
              })}
            >
              {subtitle}
            </p>
          )}
        </div>
      )}

      <div
        className={compoundStyles.grid({
          maxColumns,
          variant: cardVariant,
        })}
      >
        <InfoCardsToRender />
      </div>

      {!!url && !!label && (
        <div className={compoundStyles.urlButtonContainer()}>
          <LinkButton
            href={getReferenceLinkHref(
              url,
              site.siteMapArray,
              site.assetsBaseUrl,
            )}
            size="base"
            variant="outline"
            isWithFocusVisibleHighlight
          >
            {label}
          </LinkButton>
        </div>
      )}
    </section>
  )
}
