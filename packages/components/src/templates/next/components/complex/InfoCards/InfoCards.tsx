import type { InfoCardsProps } from "~/interfaces"
import {
  CARDS_WITH_FULL_IMAGES,
  CARDS_WITH_IMAGES,
  CARDS_WITHOUT_IMAGES,
  INFOCARD_VARIANT,
} from "~/interfaces/complex/InfoCards"
import { DynamicHeading } from "~/utils/DynamicHeading"
import { getReferenceLinkHref } from "~/utils/getReferenceLinkHref"
import { getTailwindVariantLayout } from "~/utils/getTailwindVariantLayout"
import { hasNonEmptyString } from "~/utils/truthiness"

import { LinkButton } from "../../internal/LinkButton"
import { compoundStyles } from "./common"
import { InfoCardNoImage } from "./components/InfoCardNoImage"
import { InfoCardWithFullImage } from "./components/InfoCardWithFullImage"
import { InfoCardWithImage } from "./components/InfoCardWithImage"

/* oxlint-disable typescript/no-unsafe-type-assertion -- variant switch narrows props per branch */
type InfoCardsToRenderProps = Pick<
  InfoCardsProps,
  | "variant"
  | "cards"
  | "maxColumns"
  | "layout"
  | "site"
  | "shouldLazyLoad"
  | "headingLevel"
>

const InfoCardsToRender = (props: InfoCardsToRenderProps) => {
  const { maxColumns, layout, site, shouldLazyLoad, headingLevel } = props

  switch (props.variant) {
    case CARDS_WITH_IMAGES: {
      // SAFETY: switch on variant narrows props to the cards-with-images branch
      // oxlint-disable-next-line typescript/no-unsafe-type-assertion -- variant switch narrows InfoCardsProps
      const { cards } = props as Extract<
        InfoCardsProps,
        { variant: typeof CARDS_WITH_IMAGES }
      >
      return cards.map((card) => (
        <InfoCardWithImage
          key={`${card.title}-${card.url ?? card.description ?? ""}`}
          {...card}
          maxColumns={maxColumns}
          layout={layout}
          site={site}
          shouldLazyLoad={shouldLazyLoad}
          headingLevel={headingLevel + 1}
        />
      ))
    }
    case CARDS_WITHOUT_IMAGES: {
      // SAFETY: switch on variant narrows props to the cards-without-images branch
      // oxlint-disable-next-line typescript/no-unsafe-type-assertion -- variant switch narrows InfoCardsProps
      const { cards } = props as Extract<
        InfoCardsProps,
        { variant: typeof CARDS_WITHOUT_IMAGES }
      >
      return cards.map((card) => (
        <InfoCardNoImage
          key={`${card.title}-${card.url ?? card.description ?? ""}`}
          {...card}
          site={site}
          headingLevel={headingLevel + 1}
        />
      ))
    }
    case CARDS_WITH_FULL_IMAGES: {
      // SAFETY: switch on variant narrows props to the cards-with-full-images branch
      // oxlint-disable-next-line typescript/no-unsafe-type-assertion -- variant switch narrows InfoCardsProps
      const { cards } = props as Extract<
        InfoCardsProps,
        { variant: typeof CARDS_WITH_FULL_IMAGES }
      >
      return cards.map((card) => (
        <InfoCardWithFullImage
          key={`${card.title}-${card.url ?? card.imageUrl}`}
          {...card}
          maxColumns={maxColumns}
          layout={layout}
          site={site}
          shouldLazyLoad={shouldLazyLoad}
          headingLevel={headingLevel + 1}
        />
      ))
    }
    default: {
      const _: never = props.variant
      return null
    }
  }
}

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
}: InfoCardsProps): React.ReactNode => {
  const simplifiedLayout = getTailwindVariantLayout(layout)
  const cardVariant =
    variant === CARDS_WITH_FULL_IMAGES
      ? INFOCARD_VARIANT.bold
      : INFOCARD_VARIANT.default

  return (
    <section
      id={id}
      className={compoundStyles.container({ layout: simplifiedLayout })}
    >
      {(hasNonEmptyString(title) || hasNonEmptyString(subtitle)) && (
        <div
          className={compoundStyles.headingContainer({
            imageStyle: cardVariant,
            layout: simplifiedLayout,
            variant: cardVariant,
          })}
        >
          <DynamicHeading
            level={headingLevel}
            className={compoundStyles.headingTitle()}
          >
            {title}
          </DynamicHeading>

          {hasNonEmptyString(subtitle) && (
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
        <InfoCardsToRender
          variant={variant}
          cards={cards}
          maxColumns={maxColumns}
          layout={layout}
          site={site}
          shouldLazyLoad={shouldLazyLoad}
          headingLevel={headingLevel}
        />
      </div>

      {hasNonEmptyString(url) && hasNonEmptyString(label) && (
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
