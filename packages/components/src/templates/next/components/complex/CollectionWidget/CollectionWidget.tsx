import { BiRightArrowAlt } from "react-icons/bi"

import type { CollectionWidgetProps } from "~/interfaces"
import type { CollectionWidgetSingleCardProps } from "~/interfaces/complex/CollectionWidget"
import { tv } from "~/lib/tv"
import { getReferenceLinkHref, isExternalUrl } from "~/utils"
import { ComponentContent } from "../../internal/customCssClass"
import { Link } from "../../internal/Link"
import { LinkButton } from "../../internal/LinkButton"
import { ImageClient } from "../Image"
import { getCollectionPages, getCollectionParent } from "./utils"

const createInfoCardsStyles = tv({
  slots: {
    container: `${ComponentContent} flex flex-col py-12 first:pt-0 md:py-16`,
    headingContainer: "flex flex-col gap-2.5 pb-8 sm:pb-12 lg:max-w-3xl",
    headingTitle: "prose-display-md break-words text-base-content-strong",
    headingSubtitle: "prose-headline-lg-regular text-base-content",
    grid: "grid grid-cols-1 gap-10 md:grid-cols-2 md:gap-7 lg:grid-cols-3 lg:gap-x-16 lg:gap-y-12",
    cardContainer: "group flex flex-col gap-5 outline-0",
    cardImageContainer:
      "h-[11.875rem] w-full overflow-hidden rounded-lg border border-base-divider-subtle bg-base-canvas drop-shadow-none transition ease-in group-hover:drop-shadow-md md:h-60",
    cardImage: "h-full w-full object-center",
    cardTextContainer: "flex flex-col gap-2.5 sm:gap-3",
    cardTitle:
      "prose-headline-lg-semibold text-base-content-strong group-hover:text-brand-canvas-inverse",
    cardTitleArrow:
      "mb-0.5 ml-1 inline h-auto w-6 transition ease-in group-hover:translate-x-1",
    cardDescription: "prose-body-base text-base-content",
    urlButtonContainer: "mx-auto block pt-8 sm:pt-12", // temp: following headingContainer's mb
  },
  variants: {
    isExternalLink: {
      true: {
        cardTitleArrow: "rotate-[-45deg]",
      },
    },
  },
})

const compoundStyles = createInfoCardsStyles()

const SingleCard = ({
  title,
  description,
  image,
  referenceLinkHref,
  displayThumbnail,
  site,
  LinkComponent,
  shouldLazyLoad,
}: CollectionWidgetSingleCardProps): JSX.Element => {
  const isExternalLink = !!referenceLinkHref && isExternalUrl(referenceLinkHref)

  return (
    <Link
      href={getReferenceLinkHref(
        referenceLinkHref,
        site.siteMap,
        site.assetsBaseUrl,
      )}
      className={compoundStyles.cardContainer()}
      LinkComponent={LinkComponent}
      isExternal={isExternalLink}
    >
      {/* TODO: Add fallback image if displayThumbnail but image is not present e.g. link variant */}
      {displayThumbnail && image && (
        <ImageClient
          src={
            isExternalUrl(image.src) || site.assetsBaseUrl === undefined
              ? image.src
              : `${site.assetsBaseUrl}${image.src}`
          }
          alt={image.alt}
          width="100%"
          className={compoundStyles.cardImage()}
          lazyLoading={shouldLazyLoad}
        />
      )}

      <div className={compoundStyles.cardTextContainer()}>
        <h3 className={compoundStyles.cardTitle()}>
          {title}
          <BiRightArrowAlt
            aria-hidden
            className={compoundStyles.cardTitleArrow({
              isExternalLink,
            })}
          />
        </h3>
        <p className={compoundStyles.cardDescription()}>{description}</p>
      </div>
    </Link>
  )
}

const CollectionWidget = ({
  site,
  LinkComponent,
  collectionReferenceLink,
  customTitle,
  customDescription,
  displayThumbnail,
  buttonLabel,
  numberOfPages,
  shouldLazyLoad,
}: CollectionWidgetProps): JSX.Element => {
  const collectionParent = getCollectionParent({
    site,
    collectionReferenceLink,
  })

  const collectionPages = getCollectionPages({
    site,
    collectionParent,
    numberOfPages: parseInt(numberOfPages),
  })

  return (
    <section className={compoundStyles.container()}>
      <div className={compoundStyles.headingContainer()}>
        <h2 className={compoundStyles.headingTitle()}>
          {customTitle ?? collectionParent?.title}
        </h2>
        <p>{customDescription ?? collectionParent?.summary}</p>
      </div>

      <div className={compoundStyles.grid()}>
        {collectionPages.map((card, idx) => (
          <SingleCard
            key={idx}
            displayThumbnail={displayThumbnail}
            site={site}
            LinkComponent={LinkComponent}
            shouldLazyLoad={shouldLazyLoad}
            {...card}
          />
        ))}
      </div>

      <div className={compoundStyles.urlButtonContainer()}>
        <LinkButton
          href={getReferenceLinkHref(
            collectionReferenceLink,
            site.siteMap,
            site.assetsBaseUrl,
          )}
          size="base"
          variant="outline"
          isWithFocusVisibleHighlight
          LinkComponent={LinkComponent}
        >
          {buttonLabel}
        </LinkButton>
      </div>
    </section>
  )
}

export default CollectionWidget
