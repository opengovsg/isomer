import type { InfoCardsProps } from "~/interfaces"
import {
  CARDS_WITH_FULL_IMAGES,
  CARDS_WITH_IMAGES,
  CARDS_WITHOUT_IMAGES,
  INFOCARD_VARIANT,
} from "~/interfaces/complex/InfoCards"
import { getReferenceLinkHref, getTailwindVariantLayout } from "~/utils"
import { LinkButton } from "../../internal/LinkButton"
import { compoundStyles } from "./common"
import {
  InfoCardNoImage,
  InfoCardWithFullImage,
  InfoCardWithImage,
} from "./components"
import { calculateGridDimensions } from "./utils"

const InfoCards = ({
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
  LinkComponent,
}: InfoCardsProps): JSX.Element => {
  const simplifiedLayout = getTailwindVariantLayout(layout)
  const cardVariant =
    variant === CARDS_WITH_FULL_IMAGES
      ? INFOCARD_VARIANT.bold
      : INFOCARD_VARIANT.default

  const { cols, requiresResizingLastRow } = calculateGridDimensions(cards)
  const computedMaxCols = variant === CARDS_WITH_FULL_IMAGES ? cols : maxColumns

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
                LinkComponent={LinkComponent}
                shouldLazyLoad={shouldLazyLoad}
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
                LinkComponent={LinkComponent}
              />
            ))}
          </>
        )
      case CARDS_WITH_FULL_IMAGES: {
        const cardsToRender = requiresResizingLastRow
          ? cards.slice(0, 3)
          : cards

        return (
          <>
            {cardsToRender.map((card, idx) => (
              <InfoCardWithFullImage
                key={idx}
                {...card}
                maxColumns={computedMaxCols}
                layout={layout}
                site={site}
                LinkComponent={LinkComponent}
                shouldLazyLoad={shouldLazyLoad}
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
          })}
        >
          <h2 className={compoundStyles.headingTitle()}>{title}</h2>

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
          maxColumns: computedMaxCols,
          variant: cardVariant,
        })}
      >
        <InfoCardsToRender />
      </div>

      {requiresResizingLastRow && variant === CARDS_WITH_FULL_IMAGES && (
        <div
          className={compoundStyles.grid({
            maxColumns: "2",
            variant: INFOCARD_VARIANT.bold,
            isResizedLastRow: true,
          })}
        >
          {cards.slice(3).map((card, idx) => (
            <InfoCardWithFullImage
              key={idx}
              {...card}
              maxColumns="2"
              layout={layout}
              site={site}
              LinkComponent={LinkComponent}
              shouldLazyLoad={shouldLazyLoad}
            />
          ))}
        </div>
      )}

      {!!url && !!label && (
        <div className={compoundStyles.urlButtonContainer()}>
          <LinkButton
            href={getReferenceLinkHref(url, site.siteMap, site.assetsBaseUrl)}
            size="base"
            variant="outline"
            isWithFocusVisibleHighlight
            LinkComponent={LinkComponent}
          >
            {label}
          </LinkButton>
        </div>
      )}
    </section>
  )
}

export default InfoCards
