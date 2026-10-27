import type { InfoCardsProps } from "~/interfaces"
import {
  CARDS_WITH_FULL_IMAGES,
  CARDS_WITH_IMAGES,
  CARDS_WITHOUT_IMAGES,
  INFOCARD_VARIANT,
  INFOCARDS_DISPLAY,
} from "~/interfaces/complex/InfoCards"
import { getHeadingTag } from "~/utils/getHeadingTag"
import { getReferenceLinkHref } from "~/utils/getReferenceLinkHref"
import { getTailwindVariantLayout } from "~/utils/getTailwindVariantLayout"

import { LinkButton } from "../../internal/LinkButton"
import { CarouselWrapperClient } from "./CarouselWrapperClient"
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
  display,
  label,
  url,
  layout,
  site,
  shouldLazyLoad,
  headingLevel,
}: InfoCardsProps): JSX.Element => {
  const simplifiedLayout = getTailwindVariantLayout(layout)
  const isCarousel =
    layout === "homepage" && display === INFOCARDS_DISPLAY.carousel
  const cardMaxColumns = isCarousel ? undefined : maxColumns
  const cardVariant =
    variant === CARDS_WITH_FULL_IMAGES
      ? INFOCARD_VARIANT.bold
      : isCarousel && variant === CARDS_WITHOUT_IMAGES
        ? INFOCARD_VARIANT.block
        : INFOCARD_VARIANT.default
  const TitleTag = getHeadingTag(headingLevel)

  const renderedCards = (() => {
    switch (variant) {
      case CARDS_WITH_IMAGES:
        return cards.map((card, idx) => (
          <InfoCardWithImage
            key={idx}
            {...card}
            maxColumns={cardMaxColumns}
            layout={layout}
            site={site}
            shouldLazyLoad={shouldLazyLoad}
            headingLevel={headingLevel + 1}
          />
        ))
      case CARDS_WITHOUT_IMAGES:
        return cards.map((card, idx) => (
          <InfoCardNoImage
            key={idx}
            {...card}
            site={site}
            headingLevel={headingLevel + 1}
            variant={cardVariant}
          />
        ))
      case CARDS_WITH_FULL_IMAGES:
        return cards.map((card, idx) => (
          <InfoCardWithFullImage
            key={idx}
            {...card}
            maxColumns={cardMaxColumns}
            layout={layout}
            site={site}
            shouldLazyLoad={shouldLazyLoad}
            headingLevel={headingLevel + 1}
          />
        ))
      default: {
        const _: never = variant
        return _
      }
    }
  })()

  return (
    <section
      id={id}
      aria-roledescription={isCarousel ? "carousel" : undefined}
      aria-label={isCarousel ? title || "Cards" : undefined}
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

      {isCarousel ? (
        <CarouselWrapperClient cardCount={cards.length} variant={cardVariant}>
          {renderedCards}
        </CarouselWrapperClient>
      ) : (
        <div
          className={compoundStyles.grid({
            maxColumns,
            variant: cardVariant,
          })}
        >
          {renderedCards}
        </div>
      )}

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
