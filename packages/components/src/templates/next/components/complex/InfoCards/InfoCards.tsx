import type { InfoCardsProps } from "~/interfaces"
import {
  CARDS_WITH_FULL_IMAGES,
  CARDS_WITH_IMAGES,
  CARDS_WITHOUT_IMAGES,
} from "~/interfaces/complex/InfoCards"
import { getReferenceLinkHref, getTailwindVariantLayout } from "~/utils"
import { LinkButton } from "../../internal/LinkButton"
import { compoundStyles } from "./common"
import {
  InfoCardNoImage,
  InfoCardWithFullImage,
  InfoCardWithImage,
} from "./components"

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

  const InfoCardtoRender = () => {
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
      case CARDS_WITH_FULL_IMAGES:
        return (
          <>
            {cards.map((card, idx) => (
              <InfoCardWithFullImage
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

      <div className={compoundStyles.grid({ maxColumns })}>
        <InfoCardtoRender />
      </div>

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
