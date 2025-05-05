import { BiRightArrowAlt } from "react-icons/bi"

import type { CollectionBlockProps } from "~/interfaces"
import type {
  CollectionBlockDisplayProps,
  CollectionBlockNumberOfCards,
  CollectionBlockSingleCardProps,
} from "~/interfaces/complex/CollectionBlock"
import { tv } from "~/lib/tv"
import {
  getReferenceLinkHref,
  getResourceIdFromReferenceLink,
  isExternalUrl,
} from "~/utils"
import { getFormattedDate } from "~/utils/getFormattedDate"
import { ComponentContent } from "../../internal/customCssClass"
import { Link } from "../../internal/Link"
import { LinkButton } from "../../internal/LinkButton"
import { ImageClient } from "../Image"
import {
  getCollectionPages,
  getCollectionParent,
  NUMBER_OF_PAGES_TO_DISPLAY,
} from "./utils"

const createInfoCardsStyles = tv({
  slots: {
    container: `${ComponentContent} flex flex-col gap-8 py-12 first:pt-0 md:gap-12 md:py-16`,
    headingContainer: "flex flex-col gap-2.5 lg:max-w-3xl",
    headingTitle: "prose-display-md break-words text-base-content-strong",
    headingSubtitle: "prose-headline-lg-regular text-base-content",
    grid: "grid grid-cols-1 items-start gap-10 md:gap-7 lg:gap-x-16 lg:gap-y-12",
    cardContainer: "group flex flex-col gap-5 outline-0",
    cardImageContainer:
      "aspect-[3/2] w-full overflow-hidden rounded-lg border border-base-divider-subtle bg-base-canvas drop-shadow-none transition ease-in",
    cardImage: "h-full w-full object-center",
    cardTextContainer: "flex flex-col gap-1.5 sm:gap-2",
    cardLastUpdated: "prose-label-sm-medium text-base-content",
    cardTitle:
      "prose-headline-lg-semibold text-base-content-strong group-hover:text-brand-canvas-inverse",
    cardTitleArrow:
      "mb-0.5 ml-1 inline h-auto w-6 transition ease-in group-hover:translate-x-1",
    cardCategory: "prose-label-sm-regular text-base-content-light",
    urlButtonContainer: "mx-auto block",
  },
  variants: {
    isExternalLink: {
      true: {
        cardTitleArrow: "rotate-[-45deg]",
      },
    },
    numberOfCards: {
      1: {
        grid: "",
      },
      2: {
        grid: "md:grid-cols-2",
        cardImageContainer: "aspect-[3/2] lg:aspect-[2/1]",
      },
      3: {
        grid: "md:grid-cols-2 lg:grid-cols-3",
      },
    },
    imageFit: {
      cover: {
        cardImage: "object-cover",
      },
      contain: {
        cardImage: "object-contain",
      },
    },
  },
  defaultVariants: {
    numberOfCards: NUMBER_OF_PAGES_TO_DISPLAY,
    imageFit: "cover",
  },
})

const compoundStyles = createInfoCardsStyles()

const SingleCard = ({
  title,
  image,
  category,
  referenceLinkHref,
  lastUpdated,
  displayThumbnail,
  displayCategory,
  site,
  LinkComponent,
  shouldLazyLoad,
  numberOfCards,
}: CollectionBlockSingleCardProps): JSX.Element => {
  const isExternalLink = !!referenceLinkHref && isExternalUrl(referenceLinkHref)

  const renderImage = () => {
    const hasImage = image?.src !== undefined
    const imageSrc = hasImage ? image.src : site.logoUrl
    const imageAlt = hasImage ? image.alt : `Site logo for ${site.siteName}`

    return (
      <div className={compoundStyles.cardImageContainer({ numberOfCards })}>
        <ImageClient
          src={
            isExternalUrl(imageSrc) || site.assetsBaseUrl === undefined
              ? imageSrc
              : `${site.assetsBaseUrl}${imageSrc}`
          }
          alt={imageAlt}
          width="100%"
          className={compoundStyles.cardImage({
            imageFit: hasImage ? "cover" : "contain",
          })}
          lazyLoading={shouldLazyLoad}
          assetsBaseUrl={site.assetsBaseUrl}
        />
      </div>
    )
  }

  return (
    <Link
      href={referenceLinkHref}
      className={compoundStyles.cardContainer()}
      LinkComponent={LinkComponent}
      isExternal={isExternalLink}
    >
      {displayThumbnail && renderImage()}
      <div className={compoundStyles.cardTextContainer()}>
        {lastUpdated && (
          <p className={compoundStyles.cardLastUpdated()}>
            {getFormattedDate(lastUpdated)}
          </p>
        )}

        <h3 className={compoundStyles.cardTitle()}>
          {title}
          <BiRightArrowAlt
            aria-hidden
            className={compoundStyles.cardTitleArrow({
              isExternalLink,
            })}
          />
        </h3>

        {displayCategory && category && (
          <p className={compoundStyles.cardCategory()}>{category}</p>
        )}
      </div>
    </Link>
  )
}

const CollectionBlockDisplay = ({
  site,
  LinkComponent,
  collectionReferenceLink,
  title,
  description,
  buttonLabel,
  collectionCards,
  ...restProps
}: CollectionBlockDisplayProps): JSX.Element => {
  if (collectionCards.length === 0) {
    return <></>
  }

  const numberOfCards =
    collectionCards.length as CollectionBlockNumberOfCards["numberOfCards"]

  return (
    <section className={compoundStyles.container()}>
      <div className={compoundStyles.headingContainer()}>
        <h2 className={compoundStyles.headingTitle()}>{title}</h2>
        <p>{description}</p>
      </div>

      <div className={compoundStyles.grid({ numberOfCards })}>
        {collectionCards.map((card) => (
          <SingleCard
            key={card.id}
            site={site}
            LinkComponent={LinkComponent}
            numberOfCards={numberOfCards}
            {...card}
            {...restProps}
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

export const CollectionBlock = ({
  customTitle,
  customDescription,
  studioProps,
  ...restProps
}: CollectionBlockProps): JSX.Element => {
  // This is a temporary solution to display a collection block in Studio
  // as currently there's no way to preview the collection block in Studio
  // TODO: Update to pass in properties from the collection page,
  // like how we do it with collectionParent below for the non-studio case
  if (studioProps) {
    return (
      <CollectionBlockDisplay
        {...restProps}
        title={customTitle ?? studioProps.title}
        description={customDescription ?? studioProps.description}
        collectionCards={Array.from({ length: NUMBER_OF_PAGES_TO_DISPLAY }).map(
          (_, idx) => ({
            id: `collection-card-${idx}`,
            ...studioProps.card,
          }),
        )}
      />
    )
  }

  const collectionParent = getCollectionParent({
    site: restProps.site,
    collectionId: getResourceIdFromReferenceLink(
      restProps.collectionReferenceLink,
    ),
  })
  return (
    <CollectionBlockDisplay
      {...restProps}
      title={customTitle ?? collectionParent.title}
      description={customDescription ?? collectionParent.summary}
      collectionCards={getCollectionPages({
        site: restProps.site,
        collectionParent,
      })}
    />
  )
}
