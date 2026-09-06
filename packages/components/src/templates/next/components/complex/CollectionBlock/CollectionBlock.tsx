import type {
  CollectionBlockNumberOfCards,
  CollectionBlockProps,
  CollectionBlockSingleCardProps,
} from "~/interfaces/complex/CollectionBlock"
import { BiRightArrowAlt } from "react-icons/bi"
import { tv } from "~/lib/tv"
import { DynamicHeading } from "~/utils/DynamicHeading"
import { getReferenceLinkHref } from "~/utils/getReferenceLinkHref"
import { getResourceIdFromReferenceLink } from "~/utils/getResourceIdFromReferenceLink"
import { isExternalUrl } from "~/utils/isExternalUrl"

import { ComponentContent } from "../../internal/customCssClass"
import { ImageClient } from "../../internal/ImageClient"
import { Link } from "../../internal/Link"
import { LinkButton } from "../../internal/LinkButton"
import { PlaintextTags } from "../../internal/Tags/PlaintextTags"
import {
  getCollectionPages,
  NUMBER_OF_PAGES_TO_DISPLAY,
} from "./utils/getCollectionPages"
import { getCollectionParent } from "./utils/getCollectionParent"

const createInfoCardsStyles = tv({
  defaultVariants: {
    imageFit: "cover",
    numberOfCards: NUMBER_OF_PAGES_TO_DISPLAY,
  },
  slots: {
    cardCategory: "prose-label-sm-regular text-base-content-light",
    cardContainer: "group flex flex-col gap-5 outline-0",
    cardDate: "prose-label-sm-medium text-base-content",
    cardImage: "h-full w-full object-center",
    cardImageContainer:
      "aspect-[3/2] w-full overflow-hidden rounded-lg border border-base-divider-subtle bg-base-canvas drop-shadow-none transition ease-in",
    cardTextContainer: "flex flex-col gap-1.5 sm:gap-2",
    cardTitle:
      "prose-headline-lg-semibold text-base-content-strong group-hover:text-brand-canvas-inverse",
    cardTitleArrow:
      "mb-0.5 ml-1 inline h-auto w-6 transition ease-in group-hover:translate-x-1",
    container: `${ComponentContent} flex flex-col gap-8 py-12 first:pt-0 md:gap-12 md:py-16`,
    grid: "grid grid-cols-1 items-start gap-10 md:gap-7 lg:gap-x-16 lg:gap-y-12",
    headingContainer: "flex flex-col gap-2.5 lg:max-w-3xl",
    headingSubtitle: "prose-headline-lg-regular text-base-content",
    headingTitle: "prose-display-sm break-words text-base-content-strong",
    urlButtonContainer: "mx-auto block",
  },
  variants: {
    imageFit: {
      contain: {
        cardImage: "object-contain",
      },
      cover: {
        cardImage: "object-cover",
      },
    },
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
        cardImageContainer: "aspect-[3/2] lg:aspect-[2/1]",
        grid: "md:grid-cols-2",
      },
      3: {
        grid: "md:grid-cols-2 lg:grid-cols-3",
      },
    },
  },
})

const compoundStyles = createInfoCardsStyles()

const SingleCard = ({
  title,
  image,
  isContainNeeded,
  plaintextTags,
  referenceLinkHref,
  displayThumbnail,
  displayCategory,
  site,
  shouldLazyLoad,
  numberOfCards,
  formattedDate,
  headingLevel,
}: CollectionBlockSingleCardProps): React.ReactNode => {
  const isExternalLink = !!referenceLinkHref && isExternalUrl(referenceLinkHref)

  const renderImage = () => {
    if (!image?.src) {
      return null
    }

    return (
      <div className={compoundStyles.cardImageContainer({ numberOfCards })}>
        <ImageClient
          src={image.src}
          alt={image.alt}
          width="100%"
          className={compoundStyles.cardImage({
            imageFit: isContainNeeded ? "contain" : "cover",
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
      isExternal={isExternalLink}
    >
      {displayThumbnail && renderImage()}
      <div className={compoundStyles.cardTextContainer()}>
        {formattedDate && (
          <p className={compoundStyles.cardDate()}>{formattedDate}</p>
        )}

        <DynamicHeading
          level={headingLevel}
          className={compoundStyles.cardTitle()}
        >
          {title}
          <BiRightArrowAlt
            aria-hidden
            className={compoundStyles.cardTitleArrow({
              isExternalLink,
            })}
          />
        </DynamicHeading>

        {displayCategory && (
          <PlaintextTags
            tags={plaintextTags}
            className={compoundStyles.cardCategory()}
          />
        )}
      </div>
    </Link>
  )
}

interface CollectionBlockSkeletonProps {
  title: string
  description: string
  headingLevel: number
}
const CollectionBlockSkeleton = ({
  title,
  description,
  headingLevel,
}: CollectionBlockSkeletonProps) => 
  (
    <section className={compoundStyles.container()}>
      <div className={compoundStyles.headingContainer()}>
        <DynamicHeading
          level={headingLevel}
          className={compoundStyles.headingTitle()}
        >
          {title}
        </DynamicHeading>
        <p>{description}</p>
      </div>
    </section>
  )


const toNumberOfCards = (
  length: number,
): CollectionBlockNumberOfCards["numberOfCards"] => {
  if (length === 1) {return 1}
  if (length === 2) {return 2}
  return 3
}

export const CollectionBlock = ({
  site,
  collectionReferenceLink,
  customTitle,
  customDescription,
  displayThumbnail,
  displayCategory,
  buttonLabel,
  shouldLazyLoad,
  headingLevel,
}: CollectionBlockProps): React.ReactNode => {
  const collectionId = getResourceIdFromReferenceLink(collectionReferenceLink)

  // This happens when no collection is selected yet on Studio when the user just added the block
  if (collectionId === "") {
    return (
      <CollectionBlockSkeleton
        title="No collection selected"
        description="Choose a collection to display its content."
        headingLevel={headingLevel}
      />
    )
  }

  const collectionParent = getCollectionParent({ collectionId, site })

  if (!collectionParent) {
    return null
  }

  const collectionPages = getCollectionPages({
    collectionParent,
    site,
  })

  if (collectionPages.length === 0) {
    return null
  }

  const numberOfCards = toNumberOfCards(collectionPages.length)

  return (
    <section className={compoundStyles.container()}>
      <div className={compoundStyles.headingContainer()}>
        <DynamicHeading
          level={headingLevel}
          className={compoundStyles.headingTitle()}
        >
          {customTitle ?? collectionParent.title}
        </DynamicHeading>
        <p>{customDescription ?? collectionParent.summary}</p>
      </div>

      <div className={compoundStyles.grid({ numberOfCards })}>
        {collectionPages.map((card) => (
          <SingleCard
            key={card.id}
            displayThumbnail={displayThumbnail}
            displayCategory={displayCategory}
            site={site}
            shouldLazyLoad={shouldLazyLoad}
            numberOfCards={numberOfCards}
            headingLevel={headingLevel + 1}
            {...card}
          />
        ))}
      </div>

      <div className={compoundStyles.urlButtonContainer()}>
        <LinkButton
          href={getReferenceLinkHref(
            collectionReferenceLink,
            site.siteMapArray,
            site.assetsBaseUrl,
          )}
          size="base"
          variant="outline"
          isWithFocusVisibleHighlight
        >
          {buttonLabel}
        </LinkButton>
      </div>
    </section>
  )
}
