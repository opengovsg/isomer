import type { PropsWithChildren } from "react"
import { BiRightArrowAlt } from "react-icons/bi"

import type { InfoCardsProps } from "~/interfaces"
import type {
  SingleCardNoImageProps,
  SingleCardWithImageProps,
} from "~/interfaces/complex/InfoCards"
import {
  CARDS_WITH_IMAGES,
  CARDS_WITHOUT_IMAGES,
} from "~/interfaces/complex/InfoCards"
import { tv } from "~/lib/tv"
import {
  getReferenceLinkHref,
  getTailwindVariantLayout,
  groupFocusVisibleHighlight,
  isExternalUrl,
} from "~/utils"
import { ComponentContent } from "../../internal/customCssClass"
import { Link } from "../../internal/Link"
import { LinkButton } from "../../internal/LinkButton"
import { ImageClient } from "../Image"

const infoCardTitleStyle = tv({
  extend: groupFocusVisibleHighlight,
  base: "prose-headline-lg-semibold text-base-content-strong",
  variants: {
    isClickableCard: {
      true: "group-hover:text-brand-canvas-inverse",
    },
  },
})

const createInfoCardsStyles = tv({
  slots: {
    container: `${ComponentContent} flex flex-col`,
    headingContainer: "flex flex-col pb-8 sm:pb-12",
    headingTitle: "prose-display-md break-words text-base-content-strong",
    headingSubtitle: "text-base-content",
    grid: "grid grid-cols-1 gap-10 md:gap-7 lg:gap-x-16 lg:gap-y-12",
    cardContainer: "group flex flex-col gap-5 outline-0",
    cardImageContainer:
      "aspect-[3/2] w-full overflow-hidden rounded-lg border border-base-divider-subtle bg-base-canvas drop-shadow-none transition ease-in",
    cardImage: "h-full w-full object-center",
    cardTextContainer: "flex flex-col gap-2.5 sm:gap-3",
    cardTitleArrow:
      "mb-0.5 ml-1 inline h-auto w-6 transition ease-in group-hover:translate-x-1",
    cardDescription: "prose-body-base text-base-content",
    urlButtonContainer: "mx-auto block pt-8 sm:pt-12", // temp: following headingContainer's mb
  },
  variants: {
    layout: {
      homepage: {
        container: "py-12 first:pt-0 md:py-16",
        headingContainer: "gap-2.5 lg:max-w-3xl",
        headingSubtitle: "prose-headline-lg-regular",
      },
      default: {
        container: "mt-14 first:mt-0",
        headingContainer: "gap-6",
        headingSubtitle: "prose-body-base",
      },
    },
    isClickableCard: {
      true: {
        cardImageContainer: "group-hover:drop-shadow-md",
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
    maxColumns: {
      "2": {
        grid: "md:grid-cols-2",
      },
      "3": {
        grid: "md:grid-cols-2 lg:grid-cols-3",
      },
    },
    isExternalLink: {
      true: {
        cardTitleArrow: "rotate-[-45deg]",
      },
    },
  },
  compoundVariants: [
    {
      layout: "default",
      maxColumns: "3",
      class: {
        cardImageContainer: "aspect-square",
      },
    },
  ],
  defaultVariants: {
    layout: "default",
    maxColumns: "3",
    imageFit: "cover",
  },
})

const compoundStyles = createInfoCardsStyles()

const InfoCardContainer = ({
  url,
  site,
  LinkComponent,
  children,
  isExternalLink,
}: PropsWithChildren<
  Pick<
    SingleCardNoImageProps,
    "url" | "site" | "isExternalLink" | "LinkComponent"
  >
>): JSX.Element => {
  return url ? (
    <Link
      href={getReferenceLinkHref(url, site.siteMap, site.assetsBaseUrl)}
      className={compoundStyles.cardContainer()}
      LinkComponent={LinkComponent}
      isExternal={isExternalLink}
    >
      {children}
    </Link>
  ) : (
    <div className={compoundStyles.cardContainer()}>{children}</div>
  )
}

const InfoCardImage = ({
  imageUrl,
  imageAlt,
  imageFit,
  url,
  layout,
  site,
  shouldLazyLoad,
}: Pick<
  SingleCardWithImageProps,
  | "imageUrl"
  | "imageAlt"
  | "url"
  | "imageFit"
  | "layout"
  | "site"
  | "shouldLazyLoad"
>): JSX.Element => {
  const imgSrc =
    isExternalUrl(imageUrl) || site.assetsBaseUrl === undefined
      ? imageUrl
      : `${site.assetsBaseUrl}${imageUrl}`

  return (
    <div
      className={compoundStyles.cardImageContainer({
        layout: getTailwindVariantLayout(layout),
        isClickableCard: !!url,
      })}
    >
      <ImageClient
        src={imgSrc}
        alt={imageAlt}
        width="100%"
        className={compoundStyles.cardImage({
          imageFit,
        })}
        assetsBaseUrl={site.assetsBaseUrl}
        lazyLoading={shouldLazyLoad}
      />
    </div>
  )
}

const InfoCardText = ({
  title,
  description,
  url,
  isExternalLink,
}: Pick<
  SingleCardWithImageProps,
  "title" | "description" | "url" | "isExternalLink"
>): JSX.Element => (
  <div className={compoundStyles.cardTextContainer()}>
    <h3 className={infoCardTitleStyle({ isClickableCard: !!url })}>
      {title}

      {url && (
        <BiRightArrowAlt
          aria-hidden
          className={compoundStyles.cardTitleArrow({
            isExternalLink,
          })}
        />
      )}
    </h3>
    <p className={compoundStyles.cardDescription()}>{description}</p>
  </div>
)

const InfoCardNoImage = ({
  title,
  description,
  url,
  site,
  LinkComponent,
}: SingleCardNoImageProps): JSX.Element => {
  const isExternalLink = isExternalUrl(url)
  return (
    <InfoCardContainer
      url={url}
      site={site}
      isExternalLink={isExternalLink}
      LinkComponent={LinkComponent}
    >
      <InfoCardText
        title={title}
        description={description}
        url={url}
        isExternalLink={isExternalLink}
      />
    </InfoCardContainer>
  )
}

const InfoCardWithImage = ({
  title,
  description,
  imageUrl,
  imageAlt,
  imageFit,
  url,
  layout,
  site,
  LinkComponent,
  shouldLazyLoad = true,
}: SingleCardWithImageProps): JSX.Element => {
  const isExternalLink = isExternalUrl(url)
  return (
    <InfoCardContainer
      url={url}
      site={site}
      isExternalLink={isExternalLink}
      LinkComponent={LinkComponent}
    >
      <InfoCardImage
        imageFit={imageFit}
        imageUrl={imageUrl}
        imageAlt={imageAlt}
        url={url}
        site={site}
        layout={layout}
        shouldLazyLoad={shouldLazyLoad}
      />
      <InfoCardText
        title={title}
        description={description}
        url={url}
        isExternalLink={isExternalLink}
      />
    </InfoCardContainer>
  )
}

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
